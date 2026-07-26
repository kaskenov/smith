import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ensureGlobalConfig } from '../../config/loadGlobalConfig';
import { NotFoundError, UsageError, UnsafePathError } from '../../core/errors';
import { isRealDirectory } from '../../core/fsGuard';
import { isInside, isInsideResolved } from '../../core/pathSafety';
import { assertTemplateTreeSafe } from '../../core/replicateTree';
import { assertValidTemplateName } from '../../core/resolveTemplate';
import { readSources, writeSources, type TemplateSourceRecord } from '../../core/templateSources';
import { ensureGlobalSmithDir, getGlobalTemplatesDir } from '../../paths/globalSmithHome';

export interface TemplatesAddOptions {
  name: string;
  from: string;
  path?: string;
  ref?: string;
  force?: boolean;
  cwd?: string;
  /** Required — installed templates may execute config.js/hooks on replicate/validate. */
  acknowledgeExecutableConfig?: boolean;
}

export interface TemplatesAddResult {
  targetDir: string;
}

const GIT_CLONE_TIMEOUT_MS = 120_000;

/** Allowlisted remotes only — no http:// or git://. */
function isAllowedGitSource(from: string): boolean {
  return (
    from.startsWith('git@') ||
    from.startsWith('https://') ||
    from.startsWith('ssh://') ||
    from.startsWith('github:')
  );
}

function assertSecureGitSource(from: string): void {
  if (from.startsWith('http://') || from.startsWith('git://')) {
    throw new UsageError(
      'Insecure git transports (http://, git://) are not allowed. Use https://, ssh://, git@, or github:.',
    );
  }
}

/** Reject host/user path segments that start with `-` (older git option-injection class). */
function assertSafeGitSourceShape(from: string): void {
  const candidates: string[] = [];
  if (from.startsWith('git@')) {
    const host = from.slice('git@'.length).split(/[:/]/)[0];
    if (host) candidates.push(host);
  } else if (from.startsWith('github:')) {
    const rest = from.slice('github:'.length);
    candidates.push(...rest.split('/').filter(Boolean));
  } else {
    try {
      const url = new URL(from);
      if (url.hostname) candidates.push(url.hostname);
      if (url.username) candidates.push(url.username);
      candidates.push(...url.pathname.split('/').filter(Boolean));
    } catch {
      // Non-URL allowlisted forms are handled by prefix checks elsewhere.
    }
  }
  for (const part of candidates) {
    if (part.startsWith('-')) {
      throw new UsageError(`Unsafe git source component starting with '-': ${part}`);
    }
  }
}

function resolveSourceDir(from: string, subPath?: string): string {
  const base = resolve(from);
  if (!isRealDirectory(base)) {
    throw new NotFoundError(`Source path not found or not a directory: ${from}`);
  }
  if (!subPath) {
    assertTemplateTreeSafe(base);
    return base;
  }

  const nested = resolve(base, subPath);
  if (!isInside(nested, base) || !isInsideResolved(nested, base)) {
    throw new UnsafePathError(`--path must stay inside the source directory: ${subPath}`);
  }
  if (!isRealDirectory(nested)) {
    throw new NotFoundError(`Source subdirectory not found: ${subPath}`);
  }
  assertTemplateTreeSafe(nested);
  return nested;
}

function cloneGitSource(from: string, ref?: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), 'smith-template-'));
  const args = ['clone', '--depth', '1'];
  if (ref) {
    args.push('--branch', ref);
  }
  args.push('--', from, tempDir);
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    timeout: GIT_CLONE_TIMEOUT_MS,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: 'echo',
      GCM_INTERACTIVE: 'never',
    },
  });
  if (result.error) {
    rmSync(tempDir, { recursive: true, force: true });
    const timedOut =
      result.error.message.includes('TIMEDOUT') ||
      (result.signal !== null && result.signal !== undefined);
    throw new UsageError(
      timedOut
        ? `git clone timed out after ${GIT_CLONE_TIMEOUT_MS / 1000}s`
        : `Failed to clone template source: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    rmSync(tempDir, { recursive: true, force: true });
    const detail = (result.stderr || result.stdout || 'git clone failed').trim();
    throw new UsageError(`Failed to clone template source: ${detail}`);
  }
  return tempDir;
}

function installTemplateDir(name: string, sourceDir: string, force: boolean): string {
  ensureGlobalSmithDir();
  const targetDir = join(getGlobalTemplatesDir(), name);
  if (existsSync(targetDir)) {
    if (!force) {
      throw new UsageError(`Global template already exists: ${name}. Use --force to overwrite.`);
    }
    rmSync(targetDir, { recursive: true, force: true });
  }
  cpSync(sourceDir, targetDir, { recursive: true });
  // Defense in depth after copy (source could change between assert and cp on shared FS).
  assertTemplateTreeSafe(targetDir);
  return targetDir;
}

export async function addTemplate(options: TemplatesAddOptions): Promise<TemplatesAddResult> {
  if (options.acknowledgeExecutableConfig !== true) {
    throw new UsageError(
      'templates add requires acknowledgeExecutableConfig:true — installed templates may execute config.js/hooks on replicate/validate.',
    );
  }
  assertValidTemplateName(options.name);
  if (!options.from) {
    throw new UsageError('Missing required flag: --from');
  }

  assertSecureGitSource(options.from);
  if (isAllowedGitSource(options.from)) {
    assertSafeGitSourceShape(options.from);
  }

  ensureGlobalConfig();

  const cwd = options.cwd ?? process.cwd();
  let cloneDir: string | undefined;
  let sourceDir: string;
  let record: TemplateSourceRecord;

  try {
    const absolutePath = resolve(cwd, options.from);
    if (isRealDirectory(absolutePath)) {
      sourceDir = resolveSourceDir(absolutePath, options.path);
      record = {
        type: 'path',
        from: absolutePath,
        path: options.path,
        updatedAt: new Date().toISOString(),
      };
    } else if (isAllowedGitSource(options.from)) {
      cloneDir = cloneGitSource(options.from, options.ref);
      sourceDir = resolveSourceDir(cloneDir, options.path);
      record = {
        type: 'git',
        from: options.from,
        ref: options.ref,
        path: options.path,
        updatedAt: new Date().toISOString(),
      };
    } else {
      throw new UsageError(
        `Unknown --from source: ${options.from}. Provide an existing directory or an https/ssh/git@/github: URL.`,
      );
    }

    const targetDir = installTemplateDir(options.name, sourceDir, Boolean(options.force));
    const sources = readSources();
    sources[options.name] = record;
    writeSources(sources);

    return { targetDir };
  } finally {
    if (cloneDir) {
      rmSync(cloneDir, { recursive: true, force: true });
    }
  }
}

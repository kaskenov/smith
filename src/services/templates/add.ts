import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ensureGlobalConfig } from '../../config/loadGlobalConfig';
import { NotFoundError, UsageError, UnsafePathError } from '../../core/errors';
import { isRealDirectory } from '../../core/fsGuard';
import { isInside, isInsideResolved } from '../../core/pathSafety';
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
}

export interface TemplatesAddResult {
  targetDir: string;
}

function looksLikeGitSource(from: string): boolean {
  return (
    from.startsWith('git@') ||
    from.startsWith('https://') ||
    from.startsWith('ssh://') ||
    from.startsWith('github:') ||
    from.endsWith('.git')
  );
}

function assertNoSymlinksInTree(dir: string, base = dir): void {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const relPath = fullPath.slice(base.length + 1);
    if (lstatSync(fullPath).isSymbolicLink()) {
      throw new UnsafePathError(`Template source contains symlink (not allowed): ${relPath}`);
    }
    if (isRealDirectory(fullPath)) {
      assertNoSymlinksInTree(fullPath, base);
    }
  }
}

function resolveSourceDir(from: string, subPath?: string): string {
  const base = resolve(from);
  if (!isRealDirectory(base)) {
    throw new NotFoundError(`Source path not found or not a directory: ${from}`);
  }
  if (!subPath) {
    assertNoSymlinksInTree(base);
    return base;
  }

  const nested = resolve(base, subPath);
  if (!isInside(nested, base) || !isInsideResolved(nested, base)) {
    throw new UnsafePathError(`--path must stay inside the source directory: ${subPath}`);
  }
  if (!isRealDirectory(nested)) {
    throw new NotFoundError(`Source subdirectory not found: ${subPath}`);
  }
  assertNoSymlinksInTree(nested);
  return nested;
}

function cloneGitSource(from: string, ref?: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), 'smith-template-'));
  const args = ['clone', '--depth', '1'];
  if (ref) {
    args.push('--branch', ref);
  }
  args.push('--', from, tempDir);
  const result = spawnSync('git', args, { encoding: 'utf8' });
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
  return targetDir;
}

export async function addTemplate(options: TemplatesAddOptions): Promise<TemplatesAddResult> {
  assertValidTemplateName(options.name);
  if (!options.from) {
    throw new UsageError('Missing required flag: --from');
  }

  if (options.from.startsWith('http://')) {
    throw new UsageError('Insecure http:// git sources are not allowed. Use https:// or git@.');
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
    } else if (looksLikeGitSource(options.from)) {
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
        `Unknown --from source: ${options.from}. Provide an existing directory or a git URL.`,
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

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ensureGlobalConfig } from '../../config/loadGlobalConfig';
import { NotFoundError, UsageError, InternalError } from '../../core/errors';
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
    from.startsWith('http://') ||
    from.startsWith('ssh://') ||
    from.startsWith('github:') ||
    from.endsWith('.git')
  );
}

function resolveSourceDir(from: string, subPath?: string): string {
  const base = resolve(from);
  if (!existsSync(base) || !statSync(base).isDirectory()) {
    throw new NotFoundError(`Source path not found or not a directory: ${from}`);
  }
  if (!subPath) return base;
  const nested = join(base, subPath);
  if (!existsSync(nested) || !statSync(nested).isDirectory()) {
    throw new NotFoundError(`Source subdirectory not found: ${subPath}`);
  }
  return nested;
}

function cloneGitSource(from: string, ref?: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), 'smith-template-'));
  const args = ['clone', '--depth', '1'];
  if (ref) {
    args.push('--branch', ref);
  }
  args.push(from, tempDir);
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    rmSync(tempDir, { recursive: true, force: true });
    const detail = (result.stderr || result.stdout || 'git clone failed').trim();
    throw new InternalError(`Failed to clone template source: ${detail}`);
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

  ensureGlobalConfig();

  const cwd = options.cwd ?? process.cwd();
  let cloneDir: string | undefined;
  let sourceDir: string;
  let record: TemplateSourceRecord;

  try {
    const absolutePath = resolve(cwd, options.from);
    if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
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

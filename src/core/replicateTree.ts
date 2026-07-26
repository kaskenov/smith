import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { ReplicationAbortedError, UnsafePathError, ValidationError } from './errors';
import { assertRegularFile } from './fsGuard';
import { filterFilesByPreset } from './filterFiles';
import { isInsideResolved } from './pathSafety';
import { substitute } from './substitute';
import type {
  ConflictPolicy,
  ConflictResolver,
  PlaceholderDelimiters,
  VariableMap,
} from '../types';

interface TreeEntry {
  srcPath: string;
  relPath: string;
}

function walkTemplate(dir: string, base = dir): TreeEntry[] {
  const entries: TreeEntry[] = [];
  for (const name of readdirSync(dir)) {
    const srcPath = join(dir, name);
    const relPath = srcPath.slice(base.length + 1);
    const stat = lstatSync(srcPath);
    if (stat.isSymbolicLink()) {
      throw new UnsafePathError(`Template contains symlink (not allowed): ${relPath}`);
    }
    if (stat.isDirectory()) {
      entries.push(...walkTemplate(srcPath, base));
      continue;
    }
    if (!stat.isFile()) {
      throw new UnsafePathError(
        `Template contains non-regular file (not allowed): ${relPath}`,
      );
    }
    if (relPath !== 'config.js') entries.push({ srcPath, relPath });
  }
  return entries;
}

/** Reject any symlink in the template tree before loading config.js or running hooks. */
export function assertTemplateTreeSafe(templateDir: string): void {
  walkTemplate(templateDir);
}

function readUtf8TemplateFile(srcPath: string, relPath: string): string {
  // Re-check at read time (TOCTOU) — refuse symlinks / non-files planted after walk.
  assertRegularFile(srcPath, `Template file ${relPath}`);
  const buf = readFileSync(srcPath);
  if (buf.includes(0)) {
    throw new ValidationError(
      `Binary template files are not supported (UTF-8 text only): ${relPath}`,
    );
  }
  return buf.toString('utf8');
}

export async function replicateTree(options: {
  templateDir: string;
  outputRoot: string;
  vars: VariableMap;
  delimiters: PlaceholderDelimiters;
  policy: ConflictPolicy;
  resolveConflict: ConflictResolver;
  include?: string[];
  exclude?: string[];
  /** previousContent is null when the destination did not exist before this write */
  onWrite?: (file: string, previousContent: string | null) => void;
}): Promise<{ written: string[]; skipped: string[] }> {
  const {
    templateDir,
    outputRoot,
    vars,
    delimiters,
    policy,
    resolveConflict,
    include,
    exclude,
    onWrite,
  } = options;
  const written: string[] = [];
  const skipped: string[] = [];

  // Longer paths first: deterministic order when nested template paths share prefixes.
  const allFiles = walkTemplate(templateDir).sort((a, b) => b.relPath.length - a.relPath.length);
  const allowedRelPaths = new Set(
    filterFilesByPreset(
      allFiles.map((file) => file.relPath),
      include,
      exclude,
    ),
  );
  const files = allFiles.filter((file) => allowedRelPaths.has(file.relPath));

  for (const { srcPath, relPath } of files) {
    const outRel = substitute(relPath, vars, delimiters);
    const dest = join(outputRoot, outRel);
    if (!isInsideResolved(dest, outputRoot)) {
      throw new UnsafePathError(`Unsafe output path escapes output root: ${dest}`);
    }
    mkdirSync(dirname(dest), { recursive: true });

    const sourceText = readUtf8TemplateFile(srcPath, relPath);

    if (existsSync(dest)) {
      const incoming = substitute(sourceText, vars, delimiters);
      const existing = readFileSync(dest, 'utf8');
      const resolution = await resolveConflict(policy, { target: dest, existing, incoming });
      if (resolution.action === 'abort') throw new ReplicationAbortedError();
      if (resolution.action === 'skip') {
        skipped.push(dest);
        continue;
      }
      if (resolution.action === 'merge') {
        writeFileSync(dest, resolution.content, 'utf8');
        onWrite?.(dest, existing);
        written.push(dest);
        continue;
      }
      writeFileSync(dest, incoming, 'utf8');
      onWrite?.(dest, existing);
      written.push(dest);
      continue;
    }

    writeFileSync(dest, substitute(sourceText, vars, delimiters), 'utf8');
    onWrite?.(dest, null);
    written.push(dest);
  }

  return { written, skipped };
}

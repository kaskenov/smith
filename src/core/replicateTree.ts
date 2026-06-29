import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { filterFilesByPreset } from './filterFiles';
import { substitute } from './substitute';
import { resolveConflict } from './conflicts';
import type { ConflictPolicy, PlaceholderDelimiters, VariableMap } from '../types';

interface TreeEntry {
  srcPath: string;
  relPath: string;
}

export class ReplicationAbortedError extends Error {
  constructor() {
    super('Replication aborted by user');
    this.name = 'ReplicationAbortedError';
  }
}

function isInside(child: string, parent: string): boolean {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function walkTemplate(dir: string, base = dir): TreeEntry[] {
  const entries: TreeEntry[] = [];
  for (const name of readdirSync(dir)) {
    const srcPath = join(dir, name);
    const relPath = srcPath.slice(base.length + 1);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) entries.push(...walkTemplate(srcPath, base));
    else if (relPath !== 'config.js') entries.push({ srcPath, relPath });
  }
  return entries;
}

export async function replicateTree(options: {
  templateDir: string;
  outputRoot: string;
  vars: VariableMap;
  delimiters: PlaceholderDelimiters;
  policy: ConflictPolicy;
  include?: string[];
  exclude?: string[];
  onWrite?: (file: string) => void;
}): Promise<{ written: string[]; skipped: string[] }> {
  const { templateDir, outputRoot, vars, delimiters, policy, include, exclude, onWrite } = options;
  const written: string[] = [];
  const skipped: string[] = [];

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
    if (!isInside(dest, outputRoot)) {
      throw new Error(`Unsafe output path escapes output root: ${dest}`);
    }
    mkdirSync(dirname(dest), { recursive: true });

    if (existsSync(dest)) {
      const action = await resolveConflict(policy, dest);
      if (action === 'abort') throw new ReplicationAbortedError();
      if (action === 'skip') { skipped.push(dest); continue; }
    }

    const content = readFileSync(srcPath, 'utf8');
    writeFileSync(dest, substitute(content, vars, delimiters), 'utf8');
    onWrite?.(dest);
    written.push(dest);
  }

  return { written, skipped };
}

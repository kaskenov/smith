import { existsSync, readdirSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { isInsideResolved } from './pathSafety';

export type RollbackEntry = {
  path: string;
  /** null = path was created by this run; string = prior content to restore */
  previousContent: string | null;
  /** Created directory — remove with rmdir only when empty (never recursive). */
  isDirectory?: boolean;
};

function isStrictlyUnderRoot(dir: string, root: string): boolean {
  const rootResolved = resolve(root);
  const dirResolved = resolve(dir);
  if (dirResolved === rootResolved) return false;
  return isInsideResolved(dirResolved, rootResolved);
}

function tryRemoveEmptyDir(dir: string): void {
  if (existsSync(dir) && readdirSync(dir).length === 0) {
    rmdirSync(dir);
  }
}

function pruneEmptyDirs(filePaths: string[], root: string): void {
  const rootResolved = resolve(root);
  const dirs = new Set<string>();

  for (const file of filePaths) {
    let current = dirname(resolve(file));
    while (isStrictlyUnderRoot(current, rootResolved)) {
      dirs.add(current);
      current = dirname(current);
    }
  }

  for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
    tryRemoveEmptyDir(dir);
  }

  // Also remove the output root itself when left empty after a full rollback.
  tryRemoveEmptyDir(rootResolved);
}

export function createRollback(options?: { cleanEmptyDirsUpTo?: string }) {
  const entries: RollbackEntry[] = [];
  return {
    track(path: string, previousContent: string | null, meta?: { isDirectory?: boolean }) {
      entries.push({
        path,
        previousContent,
        isDirectory: meta?.isDirectory,
      });
    },
    rollback() {
      const paths = entries.map((entry) => entry.path);
      for (const entry of [...entries].reverse()) {
        if (entry.isDirectory) {
          tryRemoveEmptyDir(entry.path);
          continue;
        }
        if (entry.previousContent === null) {
          if (existsSync(entry.path)) {
            rmSync(entry.path, { force: true });
          }
        } else {
          writeFileSync(entry.path, entry.previousContent, 'utf8');
        }
      }
      if (options?.cleanEmptyDirsUpTo) {
        pruneEmptyDirs(paths, options.cleanEmptyDirsUpTo);
      }
      entries.length = 0;
    },
  };
}

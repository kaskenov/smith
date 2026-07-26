import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { UnsafePathError } from '../core/errors';
import { isInsideResolved } from '../core/pathSafety';
import type { FsAPI, PathAPI } from '../types';

export type FsWriteTracker = (
  file: string,
  previousContent: string | null,
  meta?: { isDirectory?: boolean },
) => void;

function assertAllowed(target: string, allowedRoots: string[]): void {
  const ok = allowedRoots.some((root) => isInsideResolved(target, root));
  if (!ok) throw new UnsafePathError(`Path outside allowed roots: ${target}`);
}

export function createFsAPI(
  _pathApi: PathAPI,
  allowedRoots: string[],
  onWrite?: FsWriteTracker,
): FsAPI {
  return {
    read(file) {
      assertAllowed(file, allowedRoots);
      return readFileSync(file, 'utf8');
    },
    write(file, content) {
      assertAllowed(file, allowedRoots);
      const previous = existsSync(file) ? readFileSync(file, 'utf8') : null;
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content, 'utf8');
      onWrite?.(file, previous);
    },
    append(file, content) {
      assertAllowed(file, allowedRoots);
      const previous = existsSync(file) ? readFileSync(file, 'utf8') : null;
      mkdirSync(dirname(file), { recursive: true });
      appendFileSync(file, content, 'utf8');
      onWrite?.(file, previous);
    },
    exists(file) {
      assertAllowed(file, allowedRoots);
      return existsSync(file);
    },
    ensureDir(dir) {
      assertAllowed(dir, allowedRoots);
      const existed = existsSync(dir);
      mkdirSync(dir, { recursive: true });
      if (!existed) {
        onWrite?.(dir, null, { isDirectory: true });
      }
    },
    copy(src, dest) {
      assertAllowed(src, allowedRoots);
      assertAllowed(dest, allowedRoots);
      const previous = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      onWrite?.(dest, previous);
    },
  };
}

import { existsSync, lstatSync } from 'node:fs';
import { UnsafePathError } from './errors';
import { isInside, isInsideResolved } from './pathSafety';

/** Reject symlinks so callers never follow them via stat/read. */
export function assertNotSymlink(path: string, label = 'Path'): void {
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
    throw new UnsafePathError(`${label} is a symlink (not allowed): ${path}`);
  }
}

/** True only for real directories (symlinks are excluded, not followed). */
export function isRealDirectory(path: string): boolean {
  if (!existsSync(path)) return false;
  const stat = lstatSync(path);
  return !stat.isSymbolicLink() && stat.isDirectory();
}

/** True only for real files (symlinks are excluded, not followed). */
export function isRealFile(path: string): boolean {
  if (!existsSync(path)) return false;
  const stat = lstatSync(path);
  return !stat.isSymbolicLink() && stat.isFile();
}

/**
 * Ensure target is a real file inside root (logical + resolved containment, no symlinks).
 */
export function assertSafeFileInside(root: string, target: string, label = 'Path'): void {
  if (!isInside(target, root)) {
    throw new UnsafePathError(`${label} must stay inside ${root}`);
  }
  assertNotSymlink(target, label);
  if (!isRealFile(target)) {
    throw new UnsafePathError(`${label} is not a regular file: ${target}`);
  }
  if (!isInsideResolved(target, root)) {
    throw new UnsafePathError(`${label} escapes ${root} after resolve`);
  }
}

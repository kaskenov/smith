import { NotFoundError } from '../core/errors';
import { findSmithRoot } from '../core/resolveRoot';
import { resolveUnderSmithDir } from '../core/smithPath';

export function requireSmithRoot(cwd: string): string {
  const root = findSmithRoot(cwd);
  if (!root) {
    throw new NotFoundError('No .smith directory found.');
  }
  return root;
}

export function resolveSmithPath(root: string, relPath: string): string {
  return resolveUnderSmithDir(root, relPath);
}

import { NotFoundError } from '../core/errors';
import { resolveUnderSmithDir } from '../core/smithPath';
import { discoverSmithRoot } from '../services/discover';

export function requireSmithRoot(cwd: string): string {
  const root = discoverSmithRoot(cwd);
  if (!root) {
    throw new NotFoundError('No .smith directory found.');
  }
  return root;
}

export function resolveSmithPath(root: string, relPath: string): string {
  return resolveUnderSmithDir(root, relPath);
}

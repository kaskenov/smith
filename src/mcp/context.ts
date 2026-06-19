import { isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { findSmithRoot } from '../core/resolveRoot';

export function requireSmithRoot(cwd: string): string {
  const root = findSmithRoot(cwd);
  if (!root) {
    throw new Error('No .smith directory found.');
  }
  return root;
}

export function resolveSmithPath(root: string, relPath: string): string {
  if (isAbsolute(relPath)) {
    throw new Error('Path must be relative to .smith/');
  }

  const smithDir = resolve(root, '.smith');
  const normalized = normalize(relPath.replace(/\\/g, '/'));

  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/..')) {
    throw new Error('Path traversal is not allowed.');
  }

  const resolved = resolve(smithDir, normalized);
  const rel = relative(smithDir, resolved);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('Path must be inside .smith/');
  }

  return resolved;
}

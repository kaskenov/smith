import { isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { UnsafePathError } from './errors';

/** Resolve a path under projectRoot/.smith/ with traversal checks. */
export function resolveUnderSmithDir(projectRoot: string, relPath: string): string {
  if (isAbsolute(relPath)) {
    throw new UnsafePathError('Path must be relative to .smith/');
  }

  const smithDir = resolve(projectRoot, '.smith');
  const normalized = normalize(relPath.replace(/\\/g, '/'));

  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/..')) {
    throw new UnsafePathError('Path traversal is not allowed.');
  }

  const resolved = resolve(smithDir, normalized);
  const rel = relative(smithDir, resolved);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new UnsafePathError('Path must be inside .smith/');
  }

  return resolved;
}

export function resolveSmithTemplateFile(
  projectRoot: string,
  templateName: string,
  fileRelPath: string,
): string {
  return resolveUnderSmithDir(projectRoot, join('templates', templateName, fileRelPath));
}

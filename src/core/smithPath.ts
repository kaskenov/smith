import { isAbsolute, normalize, relative, resolve } from 'node:path';
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

/**
 * Resolve a file path under projectRoot/.smith/templates/<templateName>/.
 * Containment is against the template directory (not merely .smith/), so
 * ../ and ../../ cannot escape into siblings or config.js.
 */
export function resolveSmithTemplateFile(
  projectRoot: string,
  templateName: string,
  fileRelPath: string,
): string {
  if (isAbsolute(fileRelPath)) {
    throw new UnsafePathError('Path must be relative to the template directory');
  }

  const templateRoot = resolve(projectRoot, '.smith', 'templates', templateName);
  const normalized = normalize(fileRelPath.replace(/\\/g, '/'));
  const resolved = resolve(templateRoot, normalized);
  const rel = relative(templateRoot, resolved);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new UnsafePathError(`Path must stay inside templates/${templateName}/`);
  }

  return resolved;
}

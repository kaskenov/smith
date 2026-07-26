import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

/** Logical path containment (no realpath). */
export function isInside(child: string, parent: string): boolean {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

/**
 * Resolve a path for containment checks, realpath-ing the longest existing prefix
 * so non-existent destinations under symlinked parents (e.g. macOS /var → /private/var)
 * still compare correctly.
 */
export function resolveForContainment(path: string): string {
  const resolved = resolve(path);
  const missing: string[] = [];
  let probe = resolved;

  while (!existsSync(probe)) {
    const parentDir = dirname(probe);
    if (parentDir === probe) {
      return missing.length > 0 ? join(probe, ...missing) : probe;
    }
    missing.unshift(basename(probe));
    probe = parentDir;
  }

  try {
    const realBase = realpathSync(probe);
    return missing.length > 0 ? join(realBase, ...missing) : realBase;
  } catch {
    return missing.length > 0 ? join(probe, ...missing) : probe;
  }
}

/**
 * Containment check that resolves symlinks via the longest existing path prefix.
 */
export function isInsideResolved(child: string, parent: string): boolean {
  return isInside(resolveForContainment(child), resolveForContainment(parent));
}

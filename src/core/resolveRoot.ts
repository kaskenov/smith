import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isRealDirectory } from './fsGuard';

/**
 * Walk up from startDir looking for a real `.smith/` directory (symlinks rejected).
 * Intermediate `.smith` → external redirects must not count as a project root.
 */
export function findSmithRoot(startDir: string): string | null {
  let current = startDir;
  while (true) {
    const smithDir = join(current, '.smith');
    if (existsSync(smithDir) && isRealDirectory(smithDir)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

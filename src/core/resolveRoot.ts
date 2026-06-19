import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function findSmithRoot(startDir: string): string | null {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, '.smith'))) return current;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function findSmithPackageRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, 'package.json')) && existsSync(join(current, 'dist/cli.js'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error('smith package root not found');
}

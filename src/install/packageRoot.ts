import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { SMITH_SKILL_NAMES } from './constants';

function hasBundledSkills(bundledDir: string): boolean {
  return SMITH_SKILL_NAMES.every((name) =>
    existsSync(join(bundledDir, 'skills', name, 'SKILL.md')),
  );
}

function findBundledDir(): string {
  let current = __dirname;
  while (true) {
    const candidate = join(current, 'bundled');
    if (hasBundledSkills(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error('Bundled smith skills not found. Reinstall @kaskenov/smith or run pnpm build.');
}

export function getBundledDir(): string {
  return findBundledDir();
}

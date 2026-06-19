import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { SMITH_SKILL_NAMES } from './constants';
import { getBundledDir } from './packageRoot';

export function copyBundledSkills(options: {
  targetRoot: string;
  force?: boolean;
}): { copied: string[] } {
  const { targetRoot, force } = options;
  const bundledDir = getBundledDir();
  const copied: string[] = [];

  for (const name of SMITH_SKILL_NAMES) {
    const dest = join(targetRoot, name);
    if (existsSync(dest) && !force) {
      throw new Error(dest);
    }
    cpSync(join(bundledDir, 'skills', name), dest, { recursive: true, force: !!force });
    copied.push(name);
  }

  return { copied };
}

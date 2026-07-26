import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { UsageError } from '../core/errors';
import { SMITH_SKILL_NAMES } from './constants';
import { getBundledDir } from './bundledRoot';

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
      throw new UsageError(`Skill already installed at ${dest}. Use --force to overwrite.`);
    }
    cpSync(join(bundledDir, 'skills', name), dest, { recursive: true, force: !!force });
    copied.push(name);
  }

  return { copied };
}

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { emptySmithConfig } from './mergeConfig';
import type { SmithConfig, SmithConfigInput } from '../types';

const requireConfig = createRequire(__filename);

async function importConfig(filePath: string): Promise<SmithConfigInput> {
  return requireConfig(filePath);
}

/** Loaded project config. Empty configs are data-only (no hooks). */
export async function loadRootConfig(root: string | null): Promise<SmithConfig> {
  if (!root) return emptySmithConfig();
  const file = join(root, '.smith', 'config.js');
  if (!existsSync(file)) {
    return emptySmithConfig();
  }
  return importConfig(file) as Promise<SmithConfig>;
}

export async function loadTemplateConfig(templateDir: string): Promise<SmithConfigInput | undefined> {
  const file = join(templateDir, 'config.js');
  if (!existsSync(file)) return undefined;
  return importConfig(file);
}

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { SmithConfig, SmithConfigInput } from '../types';

const requireConfig = createRequire(__filename);

async function importConfig(filePath: string): Promise<SmithConfigInput> {
  return requireConfig(filePath);
}

export async function loadRootConfig(root: string): Promise<SmithConfig> {
  const file = join(root, '.smith', 'config.js');
  if (!existsSync(file)) {
    return {
      placeholder: ['{{', '}}'],
      variables: {},
    };
  }
  return importConfig(file) as Promise<SmithConfig>;
}

export async function loadTemplateConfig(templateDir: string): Promise<SmithConfigInput | undefined> {
  const file = join(templateDir, 'config.js');
  if (!existsSync(file)) return undefined;
  return importConfig(file);
}

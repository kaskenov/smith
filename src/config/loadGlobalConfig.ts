import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { ensureGlobalSmithDir, getGlobalConfigPath } from '../core/globalTemplates';
import type { SmithConfig } from '../types';

const requireConfig = createRequire(__filename);

function emptyConfig(): SmithConfig {
  return {
    placeholder: ['{{', '}}'],
    variables: {},
  };
}

export function globalConfigStarterContent(): string {
  return `const { createSmithConfig } = require('@kaskenov/smith/dist/config/createSmithConfig');

module.exports = createSmithConfig((smith) => ({
  variables: {
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
    NAME_KEBAB: (ctx, s) => s.format.kebab(ctx.name),
    NAME_CONSTANT: (ctx, s) => s.format.constant(ctx.name),
    NAME_UPPER: (ctx, s) => s.format.constant(ctx.name),
    NAME_TITLE: (ctx, s) => s.format.title(ctx.name),
  },
}));
`;
}

export async function loadGlobalConfig(): Promise<SmithConfig> {
  const file = getGlobalConfigPath();
  if (!existsSync(file)) {
    return emptyConfig();
  }
  return requireConfig(file) as SmithConfig;
}

export function ensureGlobalConfig(): { path: string; created: boolean } {
  ensureGlobalSmithDir();
  const path = getGlobalConfigPath();
  if (existsSync(path)) {
    return { path, created: false };
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, globalConfigStarterContent(), 'utf8');
  return { path, created: true };
}

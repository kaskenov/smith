import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { ensureGlobalSmithDir, getGlobalConfigPath } from '../paths/globalSmithHome';
import { emptySmithConfig } from './mergeConfig';
import { globalConfigStarterContent } from './starterConfig';
import type { SmithConfig } from '../types';

const requireConfig = createRequire(__filename);

/** Loaded global config. Empty configs are data-only (no hooks). */
export async function loadGlobalConfig(): Promise<SmithConfig> {
  const file = getGlobalConfigPath();
  if (!existsSync(file)) {
    return emptySmithConfig();
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

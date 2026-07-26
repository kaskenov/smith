import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { UnsafePathError } from '../core/errors';
import { assertNotSymlink, isRealDirectory } from '../core/fsGuard';
import { isInsideResolved } from '../core/pathSafety';
import { emptySmithConfig } from './mergeConfig';
import { loadJsConfig } from './loadJsConfig';
import type { SmithConfig, SmithConfigInput } from '../types';

/** Loaded project config. Empty configs are data-only (no hooks). */
export async function loadRootConfig(root: string | null): Promise<SmithConfig> {
  if (!root) return emptySmithConfig();
  const smithDir = join(root, '.smith');
  if (!existsSync(smithDir)) {
    return emptySmithConfig();
  }
  assertNotSymlink(smithDir, '.smith directory');
  if (!isRealDirectory(smithDir)) {
    throw new UnsafePathError(`.smith is not a real directory: ${smithDir}`);
  }
  if (!isInsideResolved(smithDir, root)) {
    throw new UnsafePathError(`.smith escapes project root after resolve: ${smithDir}`);
  }
  const file = join(smithDir, 'config.js');
  if (!existsSync(file)) {
    return emptySmithConfig();
  }
  return loadJsConfig(file) as SmithConfig;
}

export async function loadTemplateConfig(templateDir: string): Promise<SmithConfigInput | undefined> {
  const file = join(templateDir, 'config.js');
  if (!existsSync(file)) return undefined;
  return loadJsConfig(file);
}

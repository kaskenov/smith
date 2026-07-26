import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { assertNotSymlink } from '../core/fsGuard';
import type { SmithConfigInput } from '../types';

/**
 * Load a trusted local config.js without Node's require cache so long-lived
 * MCP processes pick up on-disk updates after templates add/update.
 *
 * Trust model: config.js is full Node (createRequire + Function). Hooks and
 * top-level code can use fs/network/process. Only load configs from paths you
 * trust; MCP/CLI gates install via acknowledgeExecutableConfig.
 */
export function loadJsConfig(filePath: string, label = 'Config'): SmithConfigInput {
  assertNotSymlink(filePath, label);
  const code = readFileSync(filePath, 'utf8');
  const module = { exports: {} as SmithConfigInput };
  const localRequire = createRequire(filePath);
  const run = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    code,
  ) as (
    exports: SmithConfigInput,
    require: NodeRequire,
    module: { exports: SmithConfigInput },
    __filename: string,
    __dirname: string,
  ) => void;
  run(module.exports, localRequire, module, filePath, dirname(filePath));
  return module.exports;
}

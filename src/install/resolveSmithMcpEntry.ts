import { realpathSync } from 'node:fs';
import { join } from 'node:path';

import type { McpServerConfig } from './mergeMcpConfig';
import { findSmithPackageRoot } from '../package/packageRoot';

export function resolveSmithMcpEntry(startDir = __dirname): McpServerConfig {
  const root = findSmithPackageRoot(startDir);
  const cliPath = realpathSync(join(root, 'dist/cli.js'));
  return {
    command: process.execPath,
    args: [cliPath, 'mcp'],
  };
}

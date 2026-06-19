import { existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { McpServerConfig } from './mergeMcpConfig';

function findPackageRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, 'package.json')) && existsSync(join(current, 'dist/cli.js'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error('smith package root not found');
}

export function resolveSmithMcpEntry(startDir = __dirname): McpServerConfig {
  const root = findPackageRoot(startDir);
  const cliPath = realpathSync(join(root, 'dist/cli.js'));
  return {
    command: process.execPath,
    args: [cliPath, 'mcp'],
  };
}

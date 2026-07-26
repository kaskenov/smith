import { spawnSync } from 'node:child_process';

import { InternalError } from '../core/errors';
import {
  detectGlobalPackageManager,
  formatGlobalUpdateCommand,
  type GlobalPackageManager,
} from './detectPackageManager';

function getUpdateArgv(
  packageName: string,
  version: string,
  manager: GlobalPackageManager,
): { command: string; args: string[] } {
  const spec = `${packageName}@${version}`;
  if (manager === 'pnpm') return { command: 'pnpm', args: ['add', '-g', spec] };
  if (manager === 'yarn') return { command: 'yarn', args: ['global', 'add', spec] };
  if (manager === 'bun') return { command: 'bun', args: ['install', '-g', spec] };
  return { command: 'npm', args: ['install', '-g', spec] };
}

export function runGlobalPackageUpdate(
  packageName: string,
  version: string,
  manager = detectGlobalPackageManager(),
): GlobalPackageManager {
  const { command, args } = getUpdateArgv(packageName, version, manager);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw new InternalError(
      `${formatGlobalUpdateCommand(packageName, version, manager)} failed: ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    throw new InternalError(
      `${formatGlobalUpdateCommand(packageName, version, manager)} failed with exit code ${result.status ?? 'unknown'}`,
    );
  }

  return manager;
}

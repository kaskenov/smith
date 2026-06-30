import { findSmithPackageRoot } from './packageRoot';

export type GlobalPackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export function detectGlobalPackageManager(startDir = __dirname): GlobalPackageManager {
  const userAgent = process.env.npm_config_user_agent ?? '';
  if (userAgent.startsWith('pnpm/')) return 'pnpm';
  if (userAgent.startsWith('yarn/')) return 'yarn';
  if (userAgent.startsWith('bun/')) return 'bun';

  const root = findSmithPackageRoot(startDir).replace(/\\/g, '/');
  if (root.includes('/.pnpm/') || root.includes('/pnpm/global')) return 'pnpm';
  if (root.includes('/.yarn/') || root.includes('/yarn/global')) return 'yarn';
  if (root.includes('/.bun/install/global')) return 'bun';

  return 'npm';
}

export function formatGlobalUpdateCommand(
  packageName: string,
  version: string,
  manager: GlobalPackageManager,
): string {
  const spec = `${packageName}@${version}`;
  switch (manager) {
    case 'pnpm':
      return `pnpm add -g ${spec}`;
    case 'yarn':
      return `yarn global add ${spec}`;
    case 'bun':
      return `bun install -g ${spec}`;
    default:
      return `npm install -g ${spec}`;
  }
}

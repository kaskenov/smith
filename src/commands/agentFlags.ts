import type { InstallFlags } from '../install/types';

function isHelpFlag(arg: string): boolean {
  return arg === '-h' || arg === '--help';
}

export function parseAgentFlags(args: string[]): InstallFlags {
  const flags: InstallFlags = {};

  for (const arg of args) {
    if (isHelpFlag(arg)) {
      continue;
    }

    switch (arg) {
      case '--cursor':
        flags.cursor = true;
        break;
      case '--claude':
        flags.claude = true;
        break;
      case '--qwen':
        flags.qwen = true;
        break;
      case '--global':
        flags.global = true;
        break;
      case '--local':
        flags.local = true;
        break;
      case '--force':
        flags.force = true;
        break;
      case '--dry-run':
        flags.dryRun = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return flags;
}

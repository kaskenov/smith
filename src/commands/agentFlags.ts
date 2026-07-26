import type { InstallFlags } from '../install/types';
import { UsageError } from '../core/errors';
import { isHelpFlag } from './cliFlags';

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
        throw new UsageError(`Unknown option: ${arg}`);
    }
  }

  return flags;
}

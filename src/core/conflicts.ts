import type { ConflictInput, ConflictPolicy, ConflictResolution } from '../types';
import { UsageError } from './errors';

/**
 * Non-interactive conflict policy: force writes, skip skips, prompt throws.
 * Interactive prompting lives in terminal/promptConflict — keep core free of Inquirer.
 */
export async function resolveConflictByPolicy(
  policy: ConflictPolicy,
  _input: ConflictInput,
): Promise<ConflictResolution> {
  if (policy === 'force') return { action: 'write' };
  if (policy === 'skip') return { action: 'skip' };

  throw new UsageError(
    'Cannot resolve file conflicts in non-interactive mode. Use --force or --skip.',
  );
}

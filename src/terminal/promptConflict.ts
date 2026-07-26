import { editor, select } from '@inquirer/prompts';
import { buildMergeTemplate, formatConflictPreview } from '../core/diffPreview';
import { resolveConflictByPolicy } from '../core/conflicts';
import { UsageError } from '../core/errors';
import type { ConflictInput, ConflictPolicy, ConflictResolution } from '../types';

/**
 * CLI conflict resolver: force/skip via policy, prompt via Inquirer when TTY.
 */
export async function promptConflictResolution(
  policy: ConflictPolicy,
  input: ConflictInput,
): Promise<ConflictResolution> {
  if (policy === 'force' || policy === 'skip') {
    return resolveConflictByPolicy(policy, input);
  }

  if (!process.stdin.isTTY) {
    throw new UsageError(
      'Cannot resolve file conflicts in non-interactive mode. Use --force or --skip.',
    );
  }

  console.log('');
  console.log(formatConflictPreview(input.target, input.existing, input.incoming));
  console.log('');

  const choice = await select<'keep' | 'overwrite' | 'merge' | 'abort'>({
    message: `Resolve conflict: ${input.target}`,
    choices: [
      { name: 'Keep existing file', value: 'keep' },
      { name: 'Overwrite with template', value: 'overwrite' },
      { name: 'Merge in editor', value: 'merge' },
      { name: 'Abort replication', value: 'abort' },
    ],
  });

  if (choice === 'keep') return { action: 'skip' };
  if (choice === 'overwrite') return { action: 'write' };
  if (choice === 'abort') return { action: 'abort' };

  const merged = await editor({
    message: 'Edit merged content (remove conflict markers when done)',
    default: buildMergeTemplate(input.existing, input.incoming),
  });

  if (merged === undefined || merged === null) {
    return { action: 'abort' };
  }

  return { action: 'merge', content: merged };
}

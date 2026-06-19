import { select } from '@inquirer/prompts';
import type { ConflictPolicy } from '../types';

export async function resolveConflict(
  policy: ConflictPolicy,
  target: string,
): Promise<'write' | 'skip' | 'abort'> {
  if (policy === 'force') return 'write';
  if (policy === 'skip') return 'skip';

  const answer = await select<'write' | 'skip' | 'abort'>({
    message: `File exists: ${target}`,
    choices: [
      { name: 'Overwrite', value: 'write' },
      { name: 'Skip', value: 'skip' },
      { name: 'Abort', value: 'abort' },
    ],
  });
  return answer;
}

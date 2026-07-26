import { resolveConflictByPolicy } from '../../src/core/conflicts';

const input = {
  target: '/tmp/file.txt',
  existing: 'keep me',
  incoming: 'overwrite me',
};

describe('resolveConflictByPolicy', () => {
  it('force always writes', async () => {
    expect(await resolveConflictByPolicy('force', input)).toEqual({ action: 'write' });
  });

  it('skip always skips', async () => {
    expect(await resolveConflictByPolicy('skip', input)).toEqual({ action: 'skip' });
  });

  it('throws for prompt in non-interactive policy', async () => {
    await expect(resolveConflictByPolicy('prompt', input)).rejects.toThrow(
      'Cannot resolve file conflicts in non-interactive mode',
    );
  });
});

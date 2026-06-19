import { resolveConflict } from '../../src/core/conflicts';

describe('resolveConflict', () => {
  it('force always writes', async () => {
    expect(await resolveConflict('force', '/x')).toBe('write');
  });

  it('skip always skips', async () => {
    expect(await resolveConflict('skip', '/x')).toBe('skip');
  });
});

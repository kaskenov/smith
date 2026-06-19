import { select } from '@inquirer/prompts';
import { resolveConflict } from '../../src/core/conflicts';

jest.mock('@inquirer/prompts', () => ({
  select: jest.fn(),
}));

describe('resolveConflict', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('force always writes', async () => {
    expect(await resolveConflict('force', '/x')).toBe('write');
  });

  it('skip always skips', async () => {
    expect(await resolveConflict('skip', '/x')).toBe('skip');
  });

  it('prompts when policy is prompt', async () => {
    jest.mocked(select).mockResolvedValue('abort');

    await expect(resolveConflict('prompt', '/tmp/file.txt')).resolves.toBe('abort');
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'File exists: /tmp/file.txt',
      }),
    );
  });
});

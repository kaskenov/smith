import { editor, select } from '@inquirer/prompts';
import { promptConflictResolution } from '../../src/terminal/promptConflict';

jest.mock('@inquirer/prompts', () => ({
  select: jest.fn(),
  editor: jest.fn(),
}));

const input = {
  target: '/tmp/file.txt',
  existing: 'keep me',
  incoming: 'overwrite me',
};

describe('promptConflictResolution', () => {
  const originalIsTTY = process.stdin.isTTY;

  afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
    jest.restoreAllMocks();
  });

  it('force and skip resolve without prompting', async () => {
    expect(await promptConflictResolution('force', input)).toEqual({ action: 'write' });
    expect(await promptConflictResolution('skip', input)).toEqual({ action: 'skip' });
    expect(select).not.toHaveBeenCalled();
  });

  it('throws in non-interactive prompt mode', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    await expect(promptConflictResolution('prompt', input)).rejects.toThrow(
      'Cannot resolve file conflicts in non-interactive mode',
    );
  });

  it('prompts with keep, overwrite, merge, and abort choices', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    jest.mocked(select).mockResolvedValue('abort');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(promptConflictResolution('prompt', input)).resolves.toEqual({ action: 'abort' });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Conflict: /tmp/file.txt'));
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Resolve conflict: /tmp/file.txt',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: 'keep' }),
          expect.objectContaining({ value: 'overwrite' }),
          expect.objectContaining({ value: 'merge' }),
          expect.objectContaining({ value: 'abort' }),
        ]),
      }),
    );
  });

  it('maps keep to skip action', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    jest.mocked(select).mockResolvedValue('keep');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(promptConflictResolution('prompt', input)).resolves.toEqual({ action: 'skip' });
  });

  it('maps overwrite to write action', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    jest.mocked(select).mockResolvedValue('overwrite');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(promptConflictResolution('prompt', input)).resolves.toEqual({ action: 'write' });
  });

  it('opens editor for merge and returns merged content', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    jest.mocked(select).mockResolvedValue('merge');
    jest.mocked(editor).mockResolvedValue('merged content');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(promptConflictResolution('prompt', input)).resolves.toEqual({
      action: 'merge',
      content: 'merged content',
    });
    expect(editor).toHaveBeenCalledWith(
      expect.objectContaining({
        default: expect.stringContaining('<<<<<<< existing (keep)'),
      }),
    );
  });

  it('aborts when editor is cancelled', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    jest.mocked(select).mockResolvedValue('merge');
    jest.mocked(editor).mockResolvedValue(undefined as unknown as string);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(promptConflictResolution('prompt', input)).resolves.toEqual({ action: 'abort' });
  });
});

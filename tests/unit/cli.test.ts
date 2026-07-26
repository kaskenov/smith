import { run } from '../../src/cli';
import { ReplicationAbortedError } from '../../src/core/errors';
import { runReplicate } from '../../src/commands/replicate';

jest.mock('../../src/commands/replicate', () => ({
  runReplicate: jest.fn(),
}));

jest.mock('../../src/package/registry', () => ({
  ...jest.requireActual('../../src/package/registry'),
  notifyIfNewerVersion: jest.fn().mockResolvedValue(undefined),
}));

describe('cli', () => {
  beforeEach(() => {
    process.exitCode = undefined;
    jest.restoreAllMocks();
  });

  it('sets exit code 0 when replicate is aborted by user', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const replicateMock = runReplicate as jest.MockedFunction<typeof runReplicate>;
    replicateMock.mockRejectedValueOnce(new ReplicationAbortedError());

    await run(['replicate', '--name', 'Button', '--template', 'component']);

    expect(process.exitCode).toBe(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('parses replicate flags without cac', async () => {
    const replicateMock = runReplicate as jest.MockedFunction<typeof runReplicate>;
    replicateMock.mockResolvedValueOnce(undefined as never);

    await run([
      'r',
      '--name',
      'Button',
      '--template',
      'component',
      '--path',
      'src',
      '--preset',
      'core',
      '--force',
    ]);

    expect(replicateMock).toHaveBeenCalledWith({
      name: 'Button',
      template: 'component',
      path: 'src',
      force: true,
      skip: false,
      preset: 'core',
    });
  });

  it('rejects unknown top-level commands', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await run(['nope']);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith('Unknown command: nope');
    expect(logSpy).toHaveBeenCalled();
  });

  it('requires name and template for replicate', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await run(['replicate', '--name', 'Button']);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith('Missing required flags: --name and --template');
    expect(logSpy).toHaveBeenCalled();
  });

  it('rejects unknown replicate flags', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await run(['replicate', '--name', 'Button', '--template', 'component', '--nope']);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith('Unknown option: --nope');
  });
});

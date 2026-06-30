import { run } from '../../src/cli';
import { ReplicationAbortedError } from '../../src/core/replicateTree';
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
});

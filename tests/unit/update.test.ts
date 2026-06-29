import { fetchLatestVersion, PACKAGE_NAME } from '../../src/package/registry';
import { readPackageVersion } from '../../src/package/version';
import { runUpdate } from '../../src/commands/update';

jest.mock('../../src/package/registry', () => ({
  ...jest.requireActual('../../src/package/registry'),
  fetchLatestVersion: jest.fn(),
}));

jest.mock('../../src/package/version', () => ({
  readPackageVersion: jest.fn(),
}));

describe('runUpdate', () => {
  const fetchLatestVersionMock = fetchLatestVersion as jest.MockedFunction<typeof fetchLatestVersion>;
  const readPackageVersionMock = readPackageVersion as jest.MockedFunction<typeof readPackageVersion>;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports when already on latest', async () => {
    fetchLatestVersionMock.mockResolvedValue('2.0.0');
    readPackageVersionMock.mockReturnValue('2.0.0');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runUpdate();

    expect(logSpy).toHaveBeenCalledWith(
      `You are already on the latest version of ${PACKAGE_NAME}: 2.0.0.`,
    );
  });

  it('prints update progress when a newer version exists', async () => {
    fetchLatestVersionMock.mockResolvedValue('3.0.0');
    readPackageVersionMock.mockReturnValue('2.0.0');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runUpdate();

    expect(logSpy).toHaveBeenCalledWith(
      `Updating ${PACKAGE_NAME} from version 2.0.0 to 3.0.0...`,
    );
    expect(logSpy).toHaveBeenCalledWith('Update completed successfully.');
  });

  it('logs registry failures without throwing', async () => {
    fetchLatestVersionMock.mockRejectedValue(new Error('network down'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(runUpdate()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith('Failed to update:', expect.any(Error));
  });
});

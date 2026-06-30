import { refreshInstalledSmithTooling } from '../../src/install/refreshInstalled';
import { detectGlobalPackageManager, formatGlobalUpdateCommand } from '../../src/package/detectPackageManager';
import { runGlobalPackageUpdate } from '../../src/package/globalUpdate';
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

jest.mock('../../src/package/detectPackageManager', () => ({
  ...jest.requireActual('../../src/package/detectPackageManager'),
  detectGlobalPackageManager: jest.fn(),
}));

jest.mock('../../src/package/globalUpdate', () => ({
  runGlobalPackageUpdate: jest.fn(),
}));

jest.mock('../../src/install/refreshInstalled', () => ({
  refreshInstalledSmithTooling: jest.fn().mockResolvedValue(undefined),
}));

describe('runUpdate', () => {
  const fetchLatestVersionMock = fetchLatestVersion as jest.MockedFunction<typeof fetchLatestVersion>;
  const readPackageVersionMock = readPackageVersion as jest.MockedFunction<typeof readPackageVersion>;
  const detectGlobalPackageManagerMock = detectGlobalPackageManager as jest.MockedFunction<
    typeof detectGlobalPackageManager
  >;
  const runGlobalPackageUpdateMock = runGlobalPackageUpdate as jest.MockedFunction<
    typeof runGlobalPackageUpdate
  >;
  const refreshInstalledSmithToolingMock = refreshInstalledSmithTooling as jest.MockedFunction<
    typeof refreshInstalledSmithTooling
  >;

  afterEach(() => {
    process.exitCode = undefined;
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
    expect(runGlobalPackageUpdateMock).not.toHaveBeenCalled();
  });

  it('updates via the detected package manager and refreshes tooling', async () => {
    fetchLatestVersionMock.mockResolvedValue('3.0.0');
    readPackageVersionMock.mockReturnValue('2.0.0');
    detectGlobalPackageManagerMock.mockReturnValue('pnpm');
    runGlobalPackageUpdateMock.mockReturnValue('pnpm');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runUpdate();

    expect(logSpy).toHaveBeenCalledWith(
      `Updating ${PACKAGE_NAME} from version 2.0.0 to 3.0.0...`,
    );
    expect(logSpy).toHaveBeenCalledWith(
      `Running: ${formatGlobalUpdateCommand(PACKAGE_NAME, '3.0.0', 'pnpm')}`,
    );
    expect(runGlobalPackageUpdateMock).toHaveBeenCalledWith(PACKAGE_NAME, '3.0.0', 'pnpm');
    expect(refreshInstalledSmithToolingMock).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Open a new shell and run smith --version to verify.');
  });

  it('logs registry failures without throwing', async () => {
    fetchLatestVersionMock.mockRejectedValue(new Error('network down'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(runUpdate()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith('Failed to update:', expect.any(Error));
    expect(process.exitCode).toBe(1);
  });
});

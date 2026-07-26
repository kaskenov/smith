import { spawnSync } from 'node:child_process';

import { runGlobalPackageUpdate } from '../../src/package/globalUpdate';

jest.mock('node:child_process', () => ({
  spawnSync: jest.fn(),
}));

describe('runGlobalPackageUpdate', () => {
  const spawnSyncMock = spawnSync as jest.MockedFunction<typeof spawnSync>;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs pnpm add -g for pnpm installs', () => {
    spawnSyncMock.mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

    const manager = runGlobalPackageUpdate('@kaskenov/smith', '3.0.0', 'pnpm');

    expect(manager).toBe('pnpm');
    expect(spawnSyncMock).toHaveBeenCalledWith(
      'pnpm',
      ['add', '-g', '@kaskenov/smith@3.0.0'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });

  it('throws when the package manager command fails', () => {
    spawnSyncMock.mockReturnValue({ status: 1 } as ReturnType<typeof spawnSync>);

    expect(() => runGlobalPackageUpdate('@kaskenov/smith', '3.0.0', 'npm')).toThrow(
      'npm install -g @kaskenov/smith@3.0.0 failed with exit code 1',
    );
  });

  it('throws with unknown exit code when status is null without error', () => {
    spawnSyncMock.mockReturnValue({ status: null } as ReturnType<typeof spawnSync>);

    expect(() => runGlobalPackageUpdate('@kaskenov/smith', '3.0.0', 'npm')).toThrow(
      'npm install -g @kaskenov/smith@3.0.0 failed with exit code unknown',
    );
  });

  it('detects package manager when manager arg is omitted', () => {
    spawnSyncMock.mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);
    process.env.npm_config_user_agent = 'pnpm/10.0.0 npm/? node/v22.0.0';

    const manager = runGlobalPackageUpdate('@kaskenov/smith', '3.0.0');
    expect(['pnpm', 'npm', 'yarn', 'bun']).toContain(manager);
    expect(spawnSyncMock).toHaveBeenCalled();
  });

  it('throws when spawn returns an error', () => {
    spawnSyncMock.mockReturnValue({
      status: null,
      error: new Error('spawn ENOENT'),
    } as ReturnType<typeof spawnSync>);

    expect(() => runGlobalPackageUpdate('@kaskenov/smith', '3.0.0', 'yarn')).toThrow(
      'yarn global add @kaskenov/smith@3.0.0 failed: spawn ENOENT',
    );
  });

  it('runs bun install -g for bun installs', () => {
    spawnSyncMock.mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

    runGlobalPackageUpdate('@kaskenov/smith', '3.0.0', 'bun');

    expect(spawnSyncMock).toHaveBeenCalledWith(
      'bun',
      ['install', '-g', '@kaskenov/smith@3.0.0'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });
});

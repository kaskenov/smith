import {
  detectGlobalPackageManager,
  formatGlobalUpdateCommand,
} from '../../src/package/detectPackageManager';
import { findSmithPackageRoot } from '../../src/package/packageRoot';

jest.mock('../../src/package/packageRoot', () => ({
  findSmithPackageRoot: jest.fn(),
}));

describe('detectGlobalPackageManager', () => {
  const findSmithPackageRootMock = findSmithPackageRoot as jest.MockedFunction<typeof findSmithPackageRoot>;
  const originalUserAgent = process.env.npm_config_user_agent;

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
    jest.restoreAllMocks();
  });

  it('detects pnpm from npm_config_user_agent', () => {
    process.env.npm_config_user_agent = 'pnpm/10.0.0 npm/? node/v22.0.0';
    findSmithPackageRootMock.mockReturnValue('/usr/lib/node_modules/@kaskenov/smith');

    expect(detectGlobalPackageManager()).toBe('pnpm');
  });

  it('detects pnpm from the install path', () => {
    delete process.env.npm_config_user_agent;
    findSmithPackageRootMock.mockReturnValue(
      '/Users/me/.local/share/pnpm/global/5/node_modules/.pnpm/@kaskenov+smith@2.0.0/node_modules/@kaskenov/smith',
    );

    expect(detectGlobalPackageManager()).toBe('pnpm');
  });

  it('falls back to npm for a standard global install path', () => {
    delete process.env.npm_config_user_agent;
    findSmithPackageRootMock.mockReturnValue('/usr/local/lib/node_modules/@kaskenov/smith');

    expect(detectGlobalPackageManager()).toBe('npm');
  });

  it('detects yarn and bun from install paths', () => {
    delete process.env.npm_config_user_agent;
    findSmithPackageRootMock.mockReturnValue('/Users/me/.yarn/global/node_modules/@kaskenov/smith');
    expect(detectGlobalPackageManager()).toBe('yarn');

    findSmithPackageRootMock.mockReturnValue('/Users/me/.bun/install/global/node_modules/@kaskenov/smith');
    expect(detectGlobalPackageManager()).toBe('bun');
  });
});

describe('formatGlobalUpdateCommand', () => {
  it('formats pnpm and npm update commands', () => {
    expect(formatGlobalUpdateCommand('@kaskenov/smith', '3.0.0', 'pnpm')).toBe(
      'pnpm add -g @kaskenov/smith@3.0.0',
    );
    expect(formatGlobalUpdateCommand('@kaskenov/smith', '3.0.0', 'npm')).toBe(
      'npm install -g @kaskenov/smith@3.0.0',
    );
  });
});

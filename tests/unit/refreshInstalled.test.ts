import { refreshInstalledSmithTooling } from '../../src/install/refreshInstalled';
import { installMcp } from '../../src/install/installMcp';
import { installSkills } from '../../src/install/installSkills';

jest.mock('../../src/install/installMcp', () => ({
  installMcp: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/install/installSkills', () => ({
  installSkills: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/install/paths', () => ({
  getMcpConfigTarget: jest.fn((agent: string, scope: string) => `${agent}-${scope}-mcp.json`),
  getSkillsDir: jest.fn((agent: string, scope: string) => `${agent}-${scope}-skills`),
}));

jest.mock('../../src/install/jsonConfig', () => ({
  readJsonFile: jest.fn((path: string) => {
    if (path.startsWith('cursor-local')) {
      return { mcpServers: { smith: { command: 'node' } } };
    }
    return {};
  }),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn((path: string) => String(path).includes('cursor-local-skills/smith')),
}));

describe('refreshInstalledSmithTooling', () => {
  const installMcpMock = installMcp as jest.MockedFunction<typeof installMcp>;
  const installSkillsMock = installSkills as jest.MockedFunction<typeof installSkills>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses process.cwd when cwd is omitted', async () => {
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/tmp/default-cwd');
    await refreshInstalledSmithTooling();
    expect(installMcpMock).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: '/tmp/default-cwd' }),
    );
    cwdSpy.mockRestore();
  });

  it('refreshes only installed MCP and skill locations', async () => {
    await refreshInstalledSmithTooling('/tmp/project');

    expect(installMcpMock).toHaveBeenCalledWith({
      local: true,
      cursor: true,
      claude: false,
      qwen: false,
      force: true,
      cwd: '/tmp/project',
    });
    expect(installSkillsMock).toHaveBeenCalledWith({
      local: true,
      cursor: true,
      claude: false,
      qwen: false,
      force: true,
      cwd: '/tmp/project',
    });
  });

  it('refreshes global installs when present', async () => {
    const { readJsonFile } = jest.requireMock('../../src/install/jsonConfig') as {
      readJsonFile: jest.Mock;
    };
    const { existsSync } = jest.requireMock('node:fs') as { existsSync: jest.Mock };

    readJsonFile.mockImplementation((path: string) => {
      if (path.startsWith('qwen-global')) {
        return { mcpServers: { smith: { command: 'node' } } };
      }
      return {};
    });
    existsSync.mockImplementation((path: string) => String(path).includes('qwen-global-skills/smith'));

    await refreshInstalledSmithTooling('/tmp/project');

    expect(installMcpMock).toHaveBeenCalledWith({
      global: true,
      cursor: false,
      claude: false,
      qwen: true,
      force: true,
      cwd: '/tmp/project',
    });
    expect(installSkillsMock).toHaveBeenCalledWith({
      global: true,
      cursor: false,
      claude: false,
      qwen: true,
      force: true,
      cwd: '/tmp/project',
    });
  });
});

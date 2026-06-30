import { refreshInstalledSmithTooling } from '../../src/install/refreshInstalled';
import { runInstallMcp } from '../../src/commands/install/mcp';
import { runInstallSkills } from '../../src/commands/install/skills';

jest.mock('../../src/commands/install/mcp', () => ({
  runInstallMcp: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/commands/install/skills', () => ({
  runInstallSkills: jest.fn().mockResolvedValue(undefined),
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
  const runInstallMcpMock = runInstallMcp as jest.MockedFunction<typeof runInstallMcp>;
  const runInstallSkillsMock = runInstallSkills as jest.MockedFunction<typeof runInstallSkills>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes only installed MCP and skill locations', async () => {
    await refreshInstalledSmithTooling('/tmp/project');

    expect(runInstallMcpMock).toHaveBeenCalledWith({
      local: true,
      cursor: true,
      claude: false,
      qwen: false,
      force: true,
      cwd: '/tmp/project',
    });
    expect(runInstallSkillsMock).toHaveBeenCalledWith({
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

    expect(runInstallMcpMock).toHaveBeenCalledWith({
      global: true,
      cursor: false,
      claude: false,
      qwen: true,
      force: true,
      cwd: '/tmp/project',
    });
    expect(runInstallSkillsMock).toHaveBeenCalledWith({
      global: true,
      cursor: false,
      claude: false,
      qwen: true,
      force: true,
      cwd: '/tmp/project',
    });
  });
});

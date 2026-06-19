import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runInstallMcp } from '../../src/commands/install/mcp';
import { SMITH_MCP_SERVER_KEY } from '../../src/install/constants';
import { resolveSmithMcpEntry } from '../../src/install/resolveSmithMcpEntry';
import { writeJsonFile } from '../../src/install/jsonConfig';
import * as brandModule from '../../src/terminal/brand';

describe('runInstallMcp integration', () => {
  const tmpRoots: string[] = [];

  afterEach(() => {
    jest.restoreAllMocks();
    for (const root of tmpRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function makeTmpRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'smith-install-mcp-'));
    tmpRoots.push(root);
    return root;
  }

  it('cursor local writes .cursor/mcp.json with smith entry', async () => {
    const tmpRoot = makeTmpRoot();
    const brandSpy = jest
      .spyOn(brandModule, 'brandSmith')
      .mockImplementation((text) => `[brand] ${text}`);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, cursor: true });

    const mcpPath = join(tmpRoot, '.cursor/mcp.json');
    expect(existsSync(mcpPath)).toBe(true);
    const config = JSON.parse(readFileSync(mcpPath, 'utf8'));
    expect(config.mcpServers[SMITH_MCP_SERVER_KEY]).toEqual(resolveSmithMcpEntry());
    expect(brandSpy).toHaveBeenCalledWith(`smith installed MCP at ${mcpPath}`);
  });

  it('claude local writes .mcp.json and .claude/settings.local.json', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, claude: true });

    const mcpPath = join(tmpRoot, '.mcp.json');
    const settingsPath = join(tmpRoot, '.claude/settings.local.json');

    expect(existsSync(mcpPath)).toBe(true);
    expect(existsSync(settingsPath)).toBe(true);

    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf8'));
    expect(mcpConfig.mcpServers[SMITH_MCP_SERVER_KEY]).toEqual(resolveSmithMcpEntry());

    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.enableAllProjectMcpServers).toBe(true);
    expect(settings.enabledMcpjsonServers).toContain(SMITH_MCP_SERVER_KEY);
  });

  it('qwen local writes .qwen/settings.json with smith entry', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, qwen: true });

    const settingsPath = join(tmpRoot, '.qwen', 'settings.json');
    expect(existsSync(settingsPath)).toBe(true);
    const config = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(config.mcpServers[SMITH_MCP_SERVER_KEY]).toEqual(resolveSmithMcpEntry());
  });

  it('qwen merge preserves existing settings keys', async () => {
    const tmpRoot = makeTmpRoot();
    const settingsPath = join(tmpRoot, '.qwen', 'settings.json');
    writeJsonFile(settingsPath, {
      permissions: { allow: ['Bash(ls)'] },
      mcpServers: { other: { command: 'npx', args: ['other-mcp'] } },
    });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, qwen: true });

    const config = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(config.permissions).toEqual({ allow: ['Bash(ls)'] });
    expect(config.mcpServers.other).toEqual({ command: 'npx', args: ['other-mcp'] });
    expect(config.mcpServers[SMITH_MCP_SERVER_KEY]).toEqual(resolveSmithMcpEntry());
  });

  it('installs MCP for all agents locally by default', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot });

    expect(existsSync(join(tmpRoot, '.cursor/mcp.json'))).toBe(true);
    expect(existsSync(join(tmpRoot, '.mcp.json'))).toBe(true);
    expect(existsSync(join(tmpRoot, '.claude/settings.local.json'))).toBe(true);
    expect(existsSync(join(tmpRoot, '.qwen/settings.json'))).toBe(true);
  });

  it('merge preserves existing playwright server in mcp.json', async () => {
    const tmpRoot = makeTmpRoot();
    const mcpPath = join(tmpRoot, '.cursor/mcp.json');
    const playwrightEntry = { command: 'npx', args: ['@playwright/mcp@latest'] };
    writeJsonFile(mcpPath, { mcpServers: { playwright: playwrightEntry } });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, cursor: true });

    const config = JSON.parse(readFileSync(mcpPath, 'utf8'));
    expect(config.mcpServers.playwright).toEqual(playwrightEntry);
    expect(config.mcpServers[SMITH_MCP_SERVER_KEY]).toEqual(resolveSmithMcpEntry());
  });

  it('does not write files in dry-run mode', async () => {
    const tmpRoot = makeTmpRoot();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, dryRun: true });

    expect(existsSync(join(tmpRoot, '.cursor/mcp.json'))).toBe(false);
    expect(existsSync(join(tmpRoot, '.mcp.json'))).toBe(false);
    expect(existsSync(join(tmpRoot, '.claude/settings.local.json'))).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Would write ${join(tmpRoot, '.cursor/mcp.json')}`,
      expect.any(String),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      `Would write ${join(tmpRoot, '.mcp.json')}`,
      expect.any(String),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      `Would write ${join(tmpRoot, '.claude/settings.local.json')}`,
      expect.any(String),
    );
  });

  it('throws on conflict without force', async () => {
    const tmpRoot = makeTmpRoot();
    const mcpPath = join(tmpRoot, '.cursor/mcp.json');
    writeJsonFile(mcpPath, {
      mcpServers: { [SMITH_MCP_SERVER_KEY]: { command: 'other', args: ['mcp'] } },
    });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(runInstallMcp({ cwd: tmpRoot, cursor: true })).rejects.toThrow(
      /configured differently/,
    );

    const config = JSON.parse(readFileSync(mcpPath, 'utf8'));
    expect(config.mcpServers[SMITH_MCP_SERVER_KEY]).toEqual({ command: 'other', args: ['mcp'] });
  });

  it('is idempotent when smith MCP is already installed for cursor', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runInstallMcp({ cwd: tmpRoot, cursor: true });
    logs.length = 0;
    await runInstallMcp({ cwd: tmpRoot, cursor: true });

    expect(logs.some((line) => line.includes('already installed'))).toBe(true);
  });

  it('is idempotent when smith MCP is already installed for claude local', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runInstallMcp({ cwd: tmpRoot, claude: true });
    logs.length = 0;
    await runInstallMcp({ cwd: tmpRoot, claude: true });

    expect(logs.some((line) => line.includes('already installed'))).toBe(true);
  });

  it('installs MCP for claude globally into ~/.claude.json', async () => {
    const tmpHome = makeTmpRoot();
    const homedirSpy = jest.spyOn(require('node:os'), 'homedir').mockReturnValue(tmpHome);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await runInstallMcp({ cwd: tmpHome, claude: true, global: true });

      const mcpPath = join(tmpHome, '.claude.json');
      expect(existsSync(mcpPath)).toBe(true);
      expect(JSON.parse(readFileSync(mcpPath, 'utf8')).mcpServers[SMITH_MCP_SERVER_KEY]).toEqual(
        resolveSmithMcpEntry(),
      );
    } finally {
      homedirSpy.mockRestore();
    }
  });

  it('uses process.cwd when cwd flag is omitted', async () => {
    const tmpRoot = makeTmpRoot();
    const previousCwd = process.cwd();
    process.chdir(tmpRoot);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await runInstallMcp({ cursor: true });
      expect(existsSync(join(tmpRoot, '.cursor/mcp.json'))).toBe(true);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it('merges claude local MCP when .mcp.json has no mcpServers key', async () => {
    const tmpRoot = makeTmpRoot();
    writeJsonFile(join(tmpRoot, '.mcp.json'), {});
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, claude: true });

    expect(JSON.parse(readFileSync(join(tmpRoot, '.mcp.json'), 'utf8')).mcpServers[SMITH_MCP_SERVER_KEY]).toEqual(
      resolveSmithMcpEntry(),
    );
  });
});

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runInstallList } from '../../src/commands/install/list';
import { runInstallMcp } from '../../src/commands/install/mcp';
import { runInstallSkills } from '../../src/commands/install/skills';
import {
  runUninstallMcp,
  runUninstallSkills,
} from '../../src/commands/uninstall/run';
import { SMITH_MCP_SERVER_KEY, SMITH_SKILL_NAMES } from '../../src/install/constants';
import { writeJsonFile } from '../../src/install/jsonConfig';

describe('install uninstall round-trip', () => {
  const tmpRoots: string[] = [];

  afterEach(() => {
    jest.restoreAllMocks();
    for (const root of tmpRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function makeTmpRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'smith-install-uninstall-'));
    tmpRoots.push(root);
    return root;
  }

  it('installs then uninstalls MCP and skills, preserving unrelated playwright server', async () => {
    const tmpRoot = makeTmpRoot();
    const mcpPath = join(tmpRoot, '.cursor/mcp.json');
    const playwrightEntry = { command: 'npx', args: ['@playwright/mcp@latest'] };
    writeJsonFile(mcpPath, { mcpServers: { playwright: playwrightEntry } });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, cursor: true });
    await runInstallSkills({ cwd: tmpRoot, cursor: true });

    for (const name of SMITH_SKILL_NAMES) {
      expect(existsSync(join(tmpRoot, '.cursor/skills', name, 'SKILL.md'))).toBe(true);
    }

    let mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf8'));
    expect(mcpConfig.mcpServers[SMITH_MCP_SERVER_KEY]).toBeDefined();
    expect(mcpConfig.mcpServers.playwright).toEqual(playwrightEntry);

    await runUninstallMcp({ cwd: tmpRoot, cursor: true });
    await runUninstallSkills({ cwd: tmpRoot, cursor: true });

    mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf8'));
    expect(mcpConfig.mcpServers[SMITH_MCP_SERVER_KEY]).toBeUndefined();
    expect(mcpConfig.mcpServers.playwright).toEqual(playwrightEntry);

    for (const name of SMITH_SKILL_NAMES) {
      expect(existsSync(join(tmpRoot, '.cursor/skills', name))).toBe(false);
    }
  });

  it('uninstalls claude local MCP and settings enablement', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, claude: true });

    const mcpPath = join(tmpRoot, '.mcp.json');
    const settingsPath = join(tmpRoot, '.claude/settings.local.json');
    expect(JSON.parse(readFileSync(mcpPath, 'utf8')).mcpServers[SMITH_MCP_SERVER_KEY]).toBeDefined();
    expect(JSON.parse(readFileSync(settingsPath, 'utf8')).enabledMcpjsonServers).toContain(
      SMITH_MCP_SERVER_KEY,
    );

    await runUninstallMcp({ cwd: tmpRoot, claude: true });

    expect(JSON.parse(readFileSync(mcpPath, 'utf8')).mcpServers[SMITH_MCP_SERVER_KEY]).toBeUndefined();
    expect(JSON.parse(readFileSync(settingsPath, 'utf8')).enabledMcpjsonServers).not.toContain(
      SMITH_MCP_SERVER_KEY,
    );
  });

  it('runInstallList reports installed state before and after uninstall', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runInstallList({ cwd: tmpRoot, cursor: true });
    expect(logs.some((line) => line.includes('cursor local:'))).toBe(true);
    expect(logs.some((line) => line.includes('MCP smith: no'))).toBe(true);
    expect(logs.some((line) => line.includes('skills: (none)'))).toBe(true);

    logs.length = 0;
    await runInstallMcp({ cwd: tmpRoot, cursor: true });
    await runInstallSkills({ cwd: tmpRoot, cursor: true });

    await runInstallList({ cwd: tmpRoot, cursor: true });
    expect(logs.some((line) => line.includes('MCP smith: yes'))).toBe(true);
    expect(logs.some((line) => line.includes('skills: smith'))).toBe(true);

    logs.length = 0;
    await runUninstallMcp({ cwd: tmpRoot, cursor: true });
    await runUninstallSkills({ cwd: tmpRoot, cursor: true });

    await runInstallList({ cwd: tmpRoot, cursor: true });
    expect(logs.some((line) => line.includes('MCP smith: no'))).toBe(true);
    expect(logs.some((line) => line.includes('skills: (none)'))).toBe(true);
  });

  it('dry-run uninstall does not modify files', async () => {
    const tmpRoot = makeTmpRoot();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, cursor: true });
    await runInstallSkills({ cwd: tmpRoot, cursor: true });

    await runUninstallMcp({ cwd: tmpRoot, cursor: true, dryRun: true });
    await runUninstallSkills({ cwd: tmpRoot, cursor: true, dryRun: true });

    expect(existsSync(join(tmpRoot, '.cursor/mcp.json'))).toBe(true);
    expect(existsSync(join(tmpRoot, '.cursor/skills/smith/SKILL.md'))).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Would write ${join(tmpRoot, '.cursor/mcp.json')}`,
      expect.any(String),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      `Would remove skill ${join(tmpRoot, '.cursor/skills/smith')}`,
    );
  });

  it('reports MCP not installed when uninstalling without prior install', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runUninstallMcp({ cwd: tmpRoot, cursor: true });

    expect(logs.some((line) => line.includes('not installed'))).toBe(true);
  });

  it('reports skills not installed when uninstalling without prior install', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runUninstallSkills({ cwd: tmpRoot, cursor: true });

    expect(logs.some((line) => line.includes('skills not installed'))).toBe(true);
  });

  it('dry-run uninstall MCP when not installed does not log writes', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runUninstallMcp({ cwd: tmpRoot, cursor: true, dryRun: true });

    expect(logs.some((line) => line.startsWith('Would write'))).toBe(false);
  });

  it('uninstalls qwen MCP after install', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallMcp({ cwd: tmpRoot, qwen: true });
    const settingsPath = join(tmpRoot, '.qwen/settings.json');
    expect(JSON.parse(readFileSync(settingsPath, 'utf8')).mcpServers[SMITH_MCP_SERVER_KEY]).toBeDefined();

    await runUninstallMcp({ cwd: tmpRoot, qwen: true });

    expect(JSON.parse(readFileSync(settingsPath, 'utf8')).mcpServers[SMITH_MCP_SERVER_KEY]).toBeUndefined();
  });

  it('dry-run uninstall claude local MCP logs both config files', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runInstallMcp({ cwd: tmpRoot, claude: true });
    logs.length = 0;

    await runUninstallMcp({ cwd: tmpRoot, claude: true, dryRun: true });

    expect(logs.some((line) => line.includes(join(tmpRoot, '.mcp.json')))).toBe(true);
    expect(logs.some((line) => line.includes(join(tmpRoot, '.claude/settings.local.json')))).toBe(true);
  });

  it('reports claude MCP not installed when neither mcp nor settings reference smith', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runUninstallMcp({ cwd: tmpRoot, claude: true });

    expect(logs.some((line) => line.includes('not installed'))).toBe(true);
  });

  it('uninstalls claude settings when mcp entry was already removed manually', async () => {
    const tmpRoot = makeTmpRoot();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runInstallMcp({ cwd: tmpRoot, claude: true });
    writeJsonFile(join(tmpRoot, '.mcp.json'), { mcpServers: {} });
    logs.length = 0;

    await runUninstallMcp({ cwd: tmpRoot, claude: true });

    expect(JSON.parse(readFileSync(join(tmpRoot, '.claude/settings.local.json'), 'utf8')).enabledMcpjsonServers).not.toContain(
      SMITH_MCP_SERVER_KEY,
    );
    expect(logs.some((line) => line.includes('uninstalled MCP'))).toBe(true);
  });

  it('uninstalls smith skill after install', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallSkills({ cwd: tmpRoot, cursor: true });
    await runUninstallSkills({ cwd: tmpRoot, cursor: true });

    expect(existsSync(join(tmpRoot, '.cursor/skills/smith'))).toBe(false);
  });

  it('uses process.cwd for list and uninstall when cwd flag is omitted', async () => {
    const tmpRoot = makeTmpRoot();
    const previousCwd = process.cwd();
    process.chdir(tmpRoot);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await runInstallMcp({ cursor: true });
      await runInstallList({ cursor: true });
      await runUninstallMcp({ cursor: true });

      expect(existsSync(join(tmpRoot, '.cursor/mcp.json'))).toBe(true);
      expect(JSON.parse(readFileSync(join(tmpRoot, '.cursor/mcp.json'), 'utf8')).mcpServers[SMITH_MCP_SERVER_KEY]).toBeUndefined();
    } finally {
      process.chdir(previousCwd);
    }
  });

  it('uninstalls MCP when config file has no mcpServers key', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    writeJsonFile(join(tmpRoot, '.cursor/mcp.json'), {});
    await runUninstallMcp({ cwd: tmpRoot, cursor: true });

    expect(JSON.parse(readFileSync(join(tmpRoot, '.cursor/mcp.json'), 'utf8'))).toEqual({});
  });
});

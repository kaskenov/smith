import { runInstall, parseInstallFlags } from '../../src/commands/install/router';
import * as mcpModule from '../../src/commands/install/mcp';
import * as skillsModule from '../../src/commands/install/skills';
import * as listModule from '../../src/commands/install/list';
import * as uninstallModule from '../../src/commands/install/uninstall';
import * as helpModule from '../../src/commands/install/help';

describe('runInstall router', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints install help for install --help', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printInstallHelp').mockImplementation(() => undefined);

    await runInstall(['install', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('routes install mcp to runInstallMcp with parsed flags', async () => {
    const mcpSpy = jest.spyOn(mcpModule, 'runInstallMcp').mockResolvedValue(undefined);

    await runInstall(['install', 'mcp', '--cursor', '--local', '--dry-run']);

    expect(mcpSpy).toHaveBeenCalledWith({
      cursor: true,
      local: true,
      dryRun: true,
    });
  });

  it('routes install skills to runInstallSkills', async () => {
    const skillsSpy = jest.spyOn(skillsModule, 'runInstallSkills').mockResolvedValue(undefined);

    await runInstall(['install', 'skills', '--claude', '--global']);

    expect(skillsSpy).toHaveBeenCalledWith({
      claude: true,
      global: true,
    });
  });

  it('routes install list to runInstallList', async () => {
    const listSpy = jest.spyOn(listModule, 'runInstallList').mockResolvedValue(undefined);

    await runInstall(['install', 'list', '--cursor']);

    expect(listSpy).toHaveBeenCalledWith({ cursor: true });
  });

  it('routes install uninstall mcp to runUninstallMcp', async () => {
    const uninstallSpy = jest.spyOn(uninstallModule, 'runUninstallMcp').mockResolvedValue(undefined);

    await runInstall(['install', 'uninstall', 'mcp', '--dry-run']);

    expect(uninstallSpy).toHaveBeenCalledWith({ dryRun: true });
  });

  it('routes install uninstall skills to runUninstallSkills', async () => {
    const uninstallSpy = jest
      .spyOn(uninstallModule, 'runUninstallSkills')
      .mockResolvedValue(undefined);

    await runInstall(['install', 'uninstall', 'skills', '--force']);

    expect(uninstallSpy).toHaveBeenCalledWith({ force: true });
  });

  it('prints mcp help for install mcp --help', async () => {
    const helpSpy = jest
      .spyOn(helpModule, 'printInstallMcpHelp')
      .mockImplementation(() => undefined);

    await runInstall(['install', 'mcp', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('sets exit code for unknown flags', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await runInstall(['install', 'mcp', '--nope']);

    expect(errorSpy).toHaveBeenCalledWith('Unknown option: --nope');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });

  it('prints install help for bare install', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printInstallHelp').mockImplementation(() => undefined);

    await runInstall(['install']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('prints skills help for install skills --help', async () => {
    const helpSpy = jest
      .spyOn(helpModule, 'printInstallSkillsHelp')
      .mockImplementation(() => undefined);

    await runInstall(['install', 'skills', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('prints uninstall help for install uninstall --help', async () => {
    const helpSpy = jest
      .spyOn(helpModule, 'printInstallUninstallHelp')
      .mockImplementation(() => undefined);

    await runInstall(['install', 'uninstall', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('prints install help for install list --help', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printInstallHelp').mockImplementation(() => undefined);

    await runInstall(['install', 'list', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('routes install mcp with --qwen flag', async () => {
    const mcpSpy = jest.spyOn(mcpModule, 'runInstallMcp').mockResolvedValue(undefined);

    await runInstall(['install', 'mcp', '--qwen', '--global']);

    expect(mcpSpy).toHaveBeenCalledWith({
      qwen: true,
      global: true,
    });
  });

  it('sets exit code for unknown install subcommand', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await runInstall(['install', 'nope']);

    expect(errorSpy).toHaveBeenCalledWith('Unknown install subcommand: nope');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });

  it('sets exit code when uninstall target is missing', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await runInstall(['install', 'uninstall']);

    expect(errorSpy).toHaveBeenCalledWith('Expected: smith install uninstall mcp|skills');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });

  it('sets exit code when install command prefix is missing', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await runInstall(['mcp']);

    expect(errorSpy).toHaveBeenCalledWith('Expected install command');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });

  it('ignores help flags while parsing install command flags', () => {
    expect(parseInstallFlags(['--cursor', '--help', '--dry-run'])).toEqual({
      cursor: true,
      dryRun: true,
    });
  });

  it('sets exit code for non-error throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const mcpSpy = jest.spyOn(mcpModule, 'runInstallMcp').mockRejectedValue('boom');

    await runInstall(['install', 'mcp']);

    expect(mcpSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('boom');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });
});

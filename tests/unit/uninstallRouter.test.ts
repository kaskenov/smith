import { runUninstall } from '../../src/commands/uninstall/router';
import * as uninstallModule from '../../src/commands/uninstall/run';
import * as helpModule from '../../src/commands/uninstall/help';

describe('runUninstall router', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('routes uninstall mcp to runUninstallMcp', async () => {
    const uninstallSpy = jest.spyOn(uninstallModule, 'runUninstallMcp').mockResolvedValue(undefined);

    await runUninstall(['uninstall', 'mcp', '--dry-run']);

    expect(uninstallSpy).toHaveBeenCalledWith({ dryRun: true });
  });

  it('routes uninstall skills to runUninstallSkills', async () => {
    const uninstallSpy = jest
      .spyOn(uninstallModule, 'runUninstallSkills')
      .mockResolvedValue(undefined);

    await runUninstall(['uninstall', 'skills', '--force']);

    expect(uninstallSpy).toHaveBeenCalledWith({ force: true });
  });

  it('prints uninstall help for uninstall --help', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printUninstallHelp').mockImplementation(() => undefined);

    await runUninstall(['uninstall', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('sets exit code for unknown uninstall subcommand', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await runUninstall(['uninstall', 'nope']);

    expect(errorSpy).toHaveBeenCalledWith('Unknown uninstall subcommand: nope');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });

  it('sets exit code when uninstall command prefix is missing', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await runUninstall(['mcp']);

    expect(errorSpy).toHaveBeenCalledWith('Expected uninstall command');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });

  it('prints uninstall mcp help for uninstall mcp --help', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printUninstallMcpHelp').mockImplementation(() => undefined);

    await runUninstall(['uninstall', 'mcp', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('prints uninstall skills help for uninstall skills --help', async () => {
    const helpSpy = jest
      .spyOn(helpModule, 'printUninstallSkillsHelp')
      .mockImplementation(() => undefined);

    await runUninstall(['uninstall', 'skills', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('prints uninstall help for unknown subcommand with --help', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printUninstallHelp').mockImplementation(() => undefined);

    await runUninstall(['uninstall', 'nope', '--help']);

    expect(helpSpy).toHaveBeenCalled();
  });

  it('sets exit code for non-error throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const uninstallSpy = jest.spyOn(uninstallModule, 'runUninstallMcp').mockRejectedValue('boom');

    await runUninstall(['uninstall', 'mcp']);

    expect(uninstallSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('boom');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });
});

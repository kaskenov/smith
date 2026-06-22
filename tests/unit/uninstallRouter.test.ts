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
});

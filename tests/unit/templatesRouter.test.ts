import { runTemplates } from '../../src/commands/templates/router';
import * as addModule from '../../src/commands/templates/add';
import * as helpModule from '../../src/commands/templates/help';
import * as initModule from '../../src/commands/templates/initConfig';
import * as listModule from '../../src/commands/templates/list';
import * as removeModule from '../../src/commands/templates/remove';
import * as updateModule from '../../src/commands/templates/update';

describe('runTemplates router', () => {
  const originalExitCode = process.exitCode;

  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = originalExitCode;
  });

  it('prints help for templates with no args', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printTemplatesHelp').mockImplementation(() => undefined);
    await runTemplates(['templates']);
    expect(helpSpy).toHaveBeenCalled();
  });

  it('prints help for templates --help and t alias', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printTemplatesHelp').mockImplementation(() => undefined);
    await runTemplates(['templates', '--help']);
    await runTemplates(['t', '-h']);
    expect(helpSpy).toHaveBeenCalledTimes(2);
  });

  it('prints help for subcommand --help', async () => {
    const helpSpy = jest.spyOn(helpModule, 'printTemplatesHelp').mockImplementation(() => undefined);
    await runTemplates(['templates', 'add', '--help']);
    expect(helpSpy).toHaveBeenCalled();
  });

  it('routes list', async () => {
    const listSpy = jest.spyOn(listModule, 'runTemplatesList').mockImplementation(() => undefined);
    await runTemplates(['templates', 'list']);
    expect(listSpy).toHaveBeenCalled();
  });

  it('routes init-config', async () => {
    const initSpy = jest
      .spyOn(initModule, 'runTemplatesInitConfig')
      .mockResolvedValue({ path: '/tmp/x', created: true });
    await runTemplates(['templates', 'init-config']);
    expect(initSpy).toHaveBeenCalled();
  });

  it('routes add with flags', async () => {
    const addSpy = jest.spyOn(addModule, 'runTemplatesAdd').mockResolvedValue(undefined);
    await runTemplates([
      'templates',
      'add',
      'app',
      '--from',
      '/tmp/src',
      '--path',
      'nested',
      '--ref',
      'main',
      '--force',
      '--acknowledge-executable-config',
    ]);
    expect(addSpy).toHaveBeenCalledWith({
      name: 'app',
      from: '/tmp/src',
      path: 'nested',
      ref: 'main',
      force: true,
      acknowledgeExecutableConfig: true,
    });
  });

  it('requires acknowledge flag for add (including TTY)', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const previous = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    try {
      await runTemplates(['templates', 'add', 'app', '--from', '/tmp/src']);
      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('--acknowledge-executable-config'),
      );
      expect(process.exitCode).toBe(1);
    } finally {
      Object.defineProperty(process.stdin, 'isTTY', { value: previous, configurable: true });
    }
  });

  it('errors when add is missing required args', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await runTemplates(['templates', 'add', 'only-name']);
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('Usage: smith templates add'),
    );
    expect(process.exitCode).toBe(1);
  });

  it('routes remove', async () => {
    const removeSpy = jest.spyOn(removeModule, 'runTemplatesRemove').mockResolvedValue(undefined);
    await runTemplates(['templates', 'remove', 'app', '--confirm']);
    expect(removeSpy).toHaveBeenCalledWith('app');
  });

  it('requires --confirm for remove', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await runTemplates(['templates', 'remove', 'app']);
    expect(errSpy).toHaveBeenCalledWith('templates remove requires --confirm');
    expect(process.exitCode).toBe(1);
  });

  it('errors when remove is missing name', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await runTemplates(['templates', 'remove']);
    expect(errSpy).toHaveBeenCalledWith('Usage: smith templates remove <name> --confirm');
    expect(process.exitCode).toBe(1);
  });

  it('routes update with and without name', async () => {
    const updateSpy = jest.spyOn(updateModule, 'runTemplatesUpdate').mockResolvedValue(undefined);
    await runTemplates(['templates', 'update', 'app', '--acknowledge-executable-config']);
    await runTemplates(['templates', 'update', '--acknowledge-executable-config']);
    expect(updateSpy).toHaveBeenNthCalledWith(1, 'app');
    expect(updateSpy).toHaveBeenNthCalledWith(2, undefined);
  });

  it('errors on unknown subcommand', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await runTemplates(['templates', 'nope']);
    expect(errSpy).toHaveBeenCalledWith('Unknown templates subcommand: nope');
    expect(process.exitCode).toBe(1);
  });

  it('errors when command is not templates', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await runTemplates(['install']);
    expect(errSpy).toHaveBeenCalledWith('Expected templates command');
    expect(process.exitCode).toBe(1);
  });

  it('stringifies non-Error throws', async () => {
    jest.spyOn(listModule, 'runTemplatesList').mockImplementation(() => {
      throw 'boom';
    });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await runTemplates(['templates', 'list']);
    expect(errSpy).toHaveBeenCalledWith('boom');
  });
});

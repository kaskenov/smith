import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runTemplatesInitConfig } from '../../src/commands/templates/initConfig';
import { runTemplatesRemove } from '../../src/commands/templates/remove';
import { runTemplatesUpdate } from '../../src/commands/templates/update';
import * as addService from '../../src/services/templates/add';
import { writeSources } from '../../src/core/templateSources';
import { getGlobalConfigPath, getGlobalTemplatesDir } from '../../src/paths/globalSmithHome';
import { updateTemplates } from '../../src/services/templates/update';

describe('templates update/remove/init-config', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('init-config creates then reports already exists', async () => {
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const first = await runTemplatesInitConfig();
    expect(first.created).toBe(true);
    expect(first.path).toBe(getGlobalConfigPath());
    expect(logs.some((line) => line.includes('init-config ->'))).toBe(true);

    const second = await runTemplatesInitConfig();
    expect(second.created).toBe(false);
    expect(logs.some((line) => line.includes('already exists'))).toBe(true);
  });

  it('removes global template and sources entry', async () => {
    mkdirSync(join(getGlobalTemplatesDir(), 'gone'), { recursive: true });
    writeFileSync(join(getGlobalTemplatesDir(), 'gone', 'a.txt'), 'x', 'utf8');
    writeSources({
      gone: {
        type: 'path',
        from: '/tmp/gone',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesRemove('gone');
    await expect(runTemplatesRemove('gone')).rejects.toThrow('Global template not found: gone');
  });

  it('updates one recorded template', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-upd-'));
    writeFileSync(join(source, 'a.txt'), 'a', 'utf8');
    writeSources({
      app: {
        type: 'path',
        from: source,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const addSpy = jest.spyOn(addService, 'addTemplate').mockResolvedValue({ targetDir: '/tmp/app' });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesUpdate('app');

    expect(addSpy).toHaveBeenCalledWith({
      name: 'app',
      from: source,
      path: undefined,
      ref: undefined,
      force: true,
    });

    rmSync(source, { recursive: true, force: true });
  });

  it('updates all recorded templates', async () => {
    writeSources({
      a: { type: 'path', from: '/tmp/a', updatedAt: 't' },
      b: { type: 'git', from: 'git@x/y.git', ref: 'main', updatedAt: 't' },
    });
    const addSpy = jest.spyOn(addService, 'addTemplate').mockResolvedValue({ targetDir: '/tmp/x' });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesUpdate();
    expect(addSpy).toHaveBeenCalledTimes(2);
  });

  it('throws when named template has no source record', async () => {
    await expect(runTemplatesUpdate('missing')).rejects.toThrow(
      'No recorded source for global template: missing',
    );
  });

  it('prints message when nothing to update and no globals', async () => {
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });
    await runTemplatesUpdate();
    expect(logs).toContain('No global templates to update.');
  });

  it('throws when globals exist but sources.json is empty', async () => {
    mkdirSync(join(getGlobalTemplatesDir(), 'orphan'), { recursive: true });
    await expect(runTemplatesUpdate()).rejects.toThrow(
      'No recorded sources in ~/.smith/sources.json',
    );
  });

  it('updateTemplates accepts options-only API with cwd', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-upd-opts-'));
    writeFileSync(join(source, 'a.txt'), 'a', 'utf8');
    writeSources({
      app: {
        type: 'path',
        from: source,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const addSpy = jest.spyOn(addService, 'addTemplate').mockResolvedValue({ targetDir: '/tmp/app' });

    await updateTemplates();
    await updateTemplates({ name: 'app', cwd: '/tmp/project' });

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'app', cwd: '/tmp/project', force: true }),
    );

    rmSync(source, { recursive: true, force: true });
  });
});

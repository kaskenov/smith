import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runTemplatesAdd } from '../../src/commands/templates/add';
import { getGlobalConfigPath, getGlobalTemplatesDir, readSources } from '../../src/core/globalTemplates';

describe('runTemplatesAdd', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('copies a local path into ~/.smith/templates and writes sources', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    mkdirSync(join(source, 'nested'), { recursive: true });
    writeFileSync(join(source, 'nested', '{{name}}.txt'), 'hello {{name}}', 'utf8');

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({
      name: 'frontend-app',
      from: source,
      path: 'nested',
    });

    const installed = join(getGlobalTemplatesDir(), 'frontend-app', '{{name}}.txt');
    expect(existsSync(installed)).toBe(true);
    expect(readFileSync(installed, 'utf8')).toBe('hello {{name}}');
    expect(existsSync(getGlobalConfigPath())).toBe(true);
    expect(readSources()['frontend-app']).toMatchObject({
      type: 'path',
      from: source,
      path: 'nested',
    });

    rmSync(source, { recursive: true, force: true });
  });

  it('refuses overwrite without --force', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    writeFileSync(join(source, 'a.txt'), 'a', 'utf8');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({ name: 'dup', from: source });
    await expect(runTemplatesAdd({ name: 'dup', from: source })).rejects.toThrow(
      'Global template already exists: dup',
    );

    rmSync(source, { recursive: true, force: true });
  });
});

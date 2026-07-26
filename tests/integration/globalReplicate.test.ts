import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReplicate } from '../../src/commands/replicate';
import { getGlobalConfigPath, getGlobalTemplatesDir } from '../../src/paths/globalSmithHome';
import * as brandModule from '../../src/terminal/brand';

describe('global-only replicate', () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    jest.restoreAllMocks();
  });

  it('replicates a global template without a project .smith using global variables', async () => {
    const workdir = mkdtempSync(join(tmpdir(), 'smith-work-'));
    const templateDir = join(getGlobalTemplatesDir(), 'frontend-app');
    mkdirSync(templateDir, { recursive: true });

    writeFileSync(
      getGlobalConfigPath(),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
  },
  before: async () => { global.__SMITH_GLOBAL_ORDER__.push('global-before'); },
  after: async () => { global.__SMITH_GLOBAL_ORDER__.push('global-after'); },
};`,
      'utf8',
    );

    writeFileSync(
      join(templateDir, 'config.js'),
      `module.exports = {
  before: async () => { global.__SMITH_GLOBAL_ORDER__.push('template-before'); },
  after: async () => { global.__SMITH_GLOBAL_ORDER__.push('template-after'); },
};`,
      'utf8',
    );

    writeFileSync(join(templateDir, '{{NAME_PASCAL}}.txt'), 'Hello {{NAME_PASCAL}}', 'utf8');

    const order: string[] = [];
    (global as typeof globalThis & { __SMITH_GLOBAL_ORDER__?: string[] }).__SMITH_GLOBAL_ORDER__ =
      order;

    jest.spyOn(brandModule, 'brandSmith').mockImplementation((text) => text);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    process.chdir(workdir);
    await runReplicate({
      name: 'my-app',
      template: 'frontend-app',
      force: true,
    });

    const out = join(workdir, 'MyApp.txt');
    expect(existsSync(out)).toBe(true);
    expect(readFileSync(out, 'utf8')).toBe('Hello MyApp');
    expect(order).toEqual([
      'global-before',
      'template-before',
      'template-after',
      'global-after',
    ]);

    rmSync(workdir, { recursive: true, force: true });
  });

  it('throws template not found when neither local nor global exists', async () => {
    const workdir = mkdtempSync(join(tmpdir(), 'smith-work-'));
    process.chdir(workdir);

    await expect(runReplicate({ name: 'X', template: 'missing' })).rejects.toThrow(
      'Template not found: missing. Available templates: (none)',
    );

    rmSync(workdir, { recursive: true, force: true });
  });
});

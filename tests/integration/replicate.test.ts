import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as brandModule from '../../src/terminal/brand';
import * as conflictsModule from '../../src/core/conflicts';
import * as replicateTreeModule from '../../src/core/replicateTree';
import { runReplicate } from '../../src/commands/replicate';

const createSmithConfigPath = require.resolve('../../dist/config/createSmithConfig');

function patchConfigRequires(root: string): void {
  const files = [
    join(root, '.smith', 'config.js'),
    join(root, '.smith', 'templates', 'component', 'config.js'),
  ];
  for (const file of files) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf8');
    writeFileSync(
      file,
      content.replace(
        /require\(['"][^'"]*createSmithConfig['"]\)/g,
        `require(${JSON.stringify(createSmithConfigPath)})`,
      ),
      'utf8',
    );
  }
}

describe('runReplicate integration', () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    jest.restoreAllMocks();
  });

  it('throws when no smith project is found', async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'smith-empty-'));
    process.chdir(emptyDir);

    await expect(runReplicate({ name: 'Button', template: 'component' })).rejects.toThrow(
      'No .smith directory found. Run from a smith project.',
    );

    rmSync(emptyDir, { recursive: true, force: true });
  });

  it('discovers root, merges configs, and runs full pipeline in order', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-'));
    const nestedCwd = join(root, 'apps', 'web');
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(nestedCwd, { recursive: true });
    mkdirSync(templateDir, { recursive: true });

    writeFileSync(
      join(templateDir, '{{name}}.txt'),
      'NAME={{NAME}}\nROOT={{ROOT}}\nLOCAL={{LOCAL}}',
      'utf8',
    );

    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {
    NAME: (ctx) => 'root-' + ctx.name,
    ROOT: () => 'root-var',
  },
  before: async () => { global.__SMITH_ORDER__.push('root-before'); },
  after: async () => { global.__SMITH_ORDER__.push('root-after'); },
};`,
      'utf8',
    );

    writeFileSync(
      join(templateDir, 'config.js'),
      `module.exports = {
  rootDir: 'generated',
  variables: {
    NAME: (ctx) => ctx.name.toUpperCase(),
    LOCAL: () => 'local-var',
  },
  before: async () => { global.__SMITH_ORDER__.push('local-before'); },
  after: async () => { global.__SMITH_ORDER__.push('local-after'); },
};`,
      'utf8',
    );

    const order: string[] = [];
    (global as typeof globalThis & { __SMITH_ORDER__?: string[] }).__SMITH_ORDER__ = order;

    const brandSpy = jest
      .spyOn(brandModule, 'brandSmith')
      .mockImplementation((text) => `[brand] ${text}`);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const originalReplicateTree = replicateTreeModule.replicateTree;
    jest
      .spyOn(replicateTreeModule, 'replicateTree')
      .mockImplementation(async (options) => {
        order.push('replicate');
        return originalReplicateTree(options);
      });

    process.chdir(nestedCwd);
    await runReplicate({ name: 'Button', template: 'component', skip: true });

    expect(order).toEqual(['root-before', 'local-before', 'replicate', 'local-after', 'root-after']);
    const outFile = join(root, 'generated', 'Button.txt');
    expect(readFileSync(outFile, 'utf8')).toBe('NAME=BUTTON\nROOT=root-var\nLOCAL=local-var');
    const outputPath = realpathSync(join(root, 'generated'));
    expect(brandSpy).toHaveBeenCalledWith(`smith replicated component -> ${outputPath}`);
    expect(consoleSpy).toHaveBeenCalledWith(`[brand] smith replicated component -> ${outputPath}`);

    rmSync(root, { recursive: true, force: true });
  });

  it('rolls back written files when pipeline fails after replication', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-'));
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(templateDir, { recursive: true });

    writeFileSync(join(templateDir, '{{name}}.txt'), 'NAME={{NAME}}', 'utf8');
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {
    NAME: (ctx) => ctx.name,
  },
};`,
      'utf8',
    );
    writeFileSync(
      join(templateDir, 'config.js'),
      `module.exports = {
  after: async () => { throw new Error('after failed'); },
};`,
      'utf8',
    );

    process.chdir(root);
    await expect(runReplicate({ name: 'Button', template: 'component', skip: true })).rejects.toThrow('after failed');
    expect(existsSync(join(root, 'Button.txt'))).toBe(false);

    rmSync(root, { recursive: true, force: true });
  });

  it('replicates nested dirs with multiple placeholders in folder names', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/nested-template');

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    process.chdir(fixtureRoot);
    await runReplicate({ name: 'my-button', template: 'feature', skip: true });

    const outFile = join(fixtureRoot, 'MyButton', 'my-button', 'my-button.txt');
    expect(readFileSync(outFile, 'utf8')).toBe(
      'NAME=my-button\nPASCAL=MyButton\nKEBAB=my-button\n',
    );

    rmSync(join(fixtureRoot, 'MyButton'), { recursive: true, force: true });
  });

  it('runs local hooks and appends to root index via smith.fs.append', async () => {
    const root = join(tmpdir(), `smith-hook-${Date.now()}`);
    cpSync(join(__dirname, '../fixtures/hook-template'), root, { recursive: true });
    patchConfigRequires(root);

    const order: string[] = [];
    (global as typeof globalThis & { __SMITH_ORDER__?: string[] }).__SMITH_ORDER__ = order;

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    process.chdir(root);
    await runReplicate({ name: 'button', template: 'component', skip: true });

    expect(order).toEqual(['root-before', 'local-before', 'local-after', 'root-after']);
    expect(readFileSync(join(root, 'button.txt'), 'utf8')).toBe('component Button\n');
    expect(readFileSync(join(root, 'src/index.ts'), 'utf8')).toBe(
      "export * from './existing';\nexport * from './Button';\n",
    );

    rmSync(root, { recursive: true, force: true });
  });

  it('rolls back files written before aborting on conflict', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-'));
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(join(templateDir, 'nested'), { recursive: true });

    writeFileSync(join(templateDir, 'a.txt'), 'A', 'utf8');
    writeFileSync(join(templateDir, 'nested', 'new.txt'), 'N', 'utf8');
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );
    writeFileSync(join(root, 'a.txt'), 'existing', 'utf8');

    jest.spyOn(conflictsModule, 'resolveConflict').mockResolvedValue('abort');

    process.chdir(root);
    await expect(runReplicate({ name: 'Button', template: 'component' })).rejects.toThrow(
      'Replication aborted by user',
    );
    expect(readFileSync(join(root, 'a.txt'), 'utf8')).toBe('existing');
    expect(existsSync(join(root, 'nested', 'new.txt'))).toBe(false);

    rmSync(root, { recursive: true, force: true });
  });

  it('lists available templates when requested template is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-'));
    const smithDir = join(root, '.smith');
    mkdirSync(join(smithDir, 'templates', 'component'), { recursive: true });
    mkdirSync(join(smithDir, 'templates', 'service'), { recursive: true });
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );

    process.chdir(root);
    await expect(runReplicate({ name: 'Button', template: 'missing' })).rejects.toThrow(
      'Template not found: missing. Available templates: component, service',
    );

    rmSync(root, { recursive: true, force: true });
  });

  it('reports no available templates when templates directory is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-no-templates-'));
    const smithDir = join(root, '.smith');
    mkdirSync(smithDir, { recursive: true });
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );

    process.chdir(root);
    await expect(runReplicate({ name: 'Button', template: 'missing' })).rejects.toThrow(
      'Template not found: missing. Available templates: (none)',
    );

    rmSync(root, { recursive: true, force: true });
  });

  it('honors rootDir from smith config', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-rootdir-'));
    const smithDir = join(root, '.smith');
    const packageDir = join(root, 'packages', 'app');
    const templateDir = join(packageDir, '.smith', 'templates', 'component');
    mkdirSync(smithDir, { recursive: true });
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.txt'), 'Hello {{name}}', 'utf8');
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  rootDir: 'packages/app',
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(root);
    await runReplicate({ name: 'Widget', template: 'component', force: true });

    expect(readFileSync(join(packageDir, 'Widget.txt'), 'utf8')).toBe('Hello Widget');
    rmSync(root, { recursive: true, force: true });
  });

  it('overwrites existing files when force is set', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-force-'));
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.txt'), 'new content', 'utf8');
    writeFileSync(join(root, 'Button.txt'), 'old content', 'utf8');
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(root);
    await runReplicate({ name: 'Button', template: 'component', force: true });

    expect(readFileSync(join(root, 'Button.txt'), 'utf8')).toBe('new content');
    rmSync(root, { recursive: true, force: true });
  });

  it('replicates only files from selected preset', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-preset-'));
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.vue'), 'vue {{name}}', 'utf8');
    writeFileSync(join(templateDir, '{{name}}.spec.ts'), 'spec {{name}}', 'utf8');
    writeFileSync(join(templateDir, '{{name}}.types.ts'), 'types {{name}}', 'utf8');
    writeFileSync(
      join(templateDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
  defaultPreset: 'core',
  presets: {
    core: {
      include: ['{{name}}.vue', '{{name}}.types.ts'],
    },
    full: {
      include: ['**/*'],
    },
  },
};`,
      'utf8',
    );
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(root);
    await runReplicate({ name: 'Button', template: 'component', force: true });

    expect(existsSync(join(root, 'Button.vue'))).toBe(true);
    expect(existsSync(join(root, 'Button.types.ts'))).toBe(true);
    expect(existsSync(join(root, 'Button.spec.ts'))).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });

  it('warns and replicates all files when presets exist but none selected', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-preset-warn-'));
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.vue'), 'vue', 'utf8');
    writeFileSync(join(templateDir, '{{name}}.spec.ts'), 'spec', 'utf8');
    writeFileSync(
      join(templateDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
  presets: {
    core: { include: ['{{name}}.vue'] },
  },
};`,
      'utf8',
    );
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(root);
    await runReplicate({ name: 'Button', template: 'component', force: true });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no preset selected'));
    expect(existsSync(join(root, 'Button.vue'))).toBe(true);
    expect(existsSync(join(root, 'Button.spec.ts'))).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });

  it('honors CLI preset override', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-int-preset-cli-'));
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.vue'), 'vue', 'utf8');
    writeFileSync(join(templateDir, '{{name}}.spec.ts'), 'spec', 'utf8');
    writeFileSync(
      join(templateDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
  defaultPreset: 'core',
  presets: {
    core: { include: ['{{name}}.vue'] },
    full: { include: ['**/*'] },
  },
};`,
      'utf8',
    );
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
};`,
      'utf8',
    );

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(root);
    await runReplicate({ name: 'Button', template: 'component', preset: 'full', force: true });

    expect(existsSync(join(root, 'Button.vue'))).toBe(true);
    expect(existsSync(join(root, 'Button.spec.ts'))).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });
});

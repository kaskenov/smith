import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as conflictsModule from '../../src/core/conflicts';
import { replicateTree } from '../../src/core/replicateTree';

describe('replicateTree', () => {
  it('replicates with renamed file and substituted content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-tree-'));
    const templateDir = join(__dirname, '../fixtures/basic-project/.smith/templates/component');
    const outputRoot = join(root, 'out');
    const result = await replicateTree({
      templateDir,
      outputRoot,
      vars: { name: 'Button', NAME: 'Button' },
      delimiters: ['{{', '}}'],
      policy: 'force',
    });
    const outFile = join(outputRoot, 'Button.txt');
    expect(result.written).toContain(outFile);
    expect(readFileSync(outFile, 'utf8')).toBe('Hello Button');
    rmSync(root, { recursive: true, force: true });
  });

  it('blocks output paths that escape output root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-tree-'));
    const templateDir = join(root, 'template');
    const outputRoot = join(root, 'out');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.txt'), 'Hello {{name}}', 'utf8');

    await expect(
      replicateTree({
        templateDir,
        outputRoot,
        vars: { name: '../outside' },
        delimiters: ['{{', '}}'],
        policy: 'force',
      }),
    ).rejects.toThrow('Unsafe output path escapes output root');

    expect(existsSync(join(root, 'outside.txt'))).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });

  it('skips template root config.js but keeps nested config.js files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-tree-'));
    const templateDir = join(root, 'template');
    const outputRoot = join(root, 'out');
    mkdirSync(join(templateDir, 'nested'), { recursive: true });
    writeFileSync(join(templateDir, 'config.js'), 'root config', 'utf8');
    writeFileSync(join(templateDir, '{{name}}.txt'), 'Hello {{name}}', 'utf8');
    writeFileSync(join(templateDir, 'nested', 'config.js'), 'nested config', 'utf8');

    const result = await replicateTree({
      templateDir,
      outputRoot,
      vars: { name: 'Button' },
      delimiters: ['{{', '}}'],
      policy: 'force',
    });

    expect(existsSync(join(outputRoot, 'config.js'))).toBe(false);
    expect(existsSync(join(outputRoot, 'nested', 'config.js'))).toBe(true);
    expect(result.written).toContain(join(outputRoot, 'nested', 'config.js'));
    rmSync(root, { recursive: true, force: true });
  });

  it('skips existing files when policy is skip', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-tree-skip-'));
    const templateDir = join(root, 'template');
    const outputRoot = join(root, 'out');
    mkdirSync(templateDir, { recursive: true });
    mkdirSync(outputRoot, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.txt'), 'Hello {{name}}', 'utf8');
    writeFileSync(join(outputRoot, 'Button.txt'), 'keep me', 'utf8');

    jest.spyOn(conflictsModule, 'resolveConflict').mockResolvedValue('skip');

    const result = await replicateTree({
      templateDir,
      outputRoot,
      vars: { name: 'Button' },
      delimiters: ['{{', '}}'],
      policy: 'skip',
    });

    expect(result.skipped).toContain(join(outputRoot, 'Button.txt'));
    expect(readFileSync(join(outputRoot, 'Button.txt'), 'utf8')).toBe('keep me');
    rmSync(root, { recursive: true, force: true });
  });

  it('replicates only files matched by preset include patterns', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-tree-preset-'));
    const templateDir = join(root, 'template');
    const outputRoot = join(root, 'out');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, '{{name}}.vue'), 'vue', 'utf8');
    writeFileSync(join(templateDir, '{{name}}.spec.ts'), 'spec', 'utf8');
    writeFileSync(join(templateDir, '{{name}}.types.ts'), 'types', 'utf8');

    const result = await replicateTree({
      templateDir,
      outputRoot,
      vars: { name: 'Button' },
      delimiters: ['{{', '}}'],
      policy: 'force',
      include: ['{{name}}.vue', '{{name}}.types.ts'],
    });

    expect(result.written).toHaveLength(2);
    expect(result.written).toEqual(
      expect.arrayContaining([
        join(outputRoot, 'Button.vue'),
        join(outputRoot, 'Button.types.ts'),
      ]),
    );
    expect(existsSync(join(outputRoot, 'Button.spec.ts'))).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });
});

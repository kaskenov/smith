import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRootConfig, loadTemplateConfig } from '../../src/config/loadConfig';
import { UnsafePathError } from '../../src/core/errors';
import * as pathSafety from '../../src/core/pathSafety';

describe('loadRootConfig', () => {
  it('returns defaults when root is null', async () => {
    await expect(loadRootConfig(null)).resolves.toEqual({
      placeholder: ['{{', '}}'],
      variables: {},
    });
  });

  it('loads .smith/config.js', async () => {
    const root = join(__dirname, '../fixtures/config-project');
    const config = await loadRootConfig(root);
    expect(
      config.variables.NAME_PASCAL({} as any, { format: { pascal: (v: string) => v } } as any),
    ).toBeDefined();
  });

  it('returns defaults when .smith directory is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-no-smith-dir-'));
    await expect(loadRootConfig(root)).resolves.toEqual({
      placeholder: ['{{', '}}'],
      variables: {},
    });
    rmSync(root, { recursive: true, force: true });
  });

  it('returns defaults when config.js is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-no-config-'));
    mkdirSync(join(root, '.smith'), { recursive: true });

    const config = await loadRootConfig(root);

    expect(config).toEqual({
      placeholder: ['{{', '}}'],
      variables: {},
    });

    rmSync(root, { recursive: true, force: true });
  });

  it('rejects .smith that is not a real directory', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-file-smith-cfg-'));
    writeFileSync(join(root, '.smith'), 'not-a-dir', 'utf8');
    await expect(loadRootConfig(root)).rejects.toThrow(/not a real directory/);
    rmSync(root, { recursive: true, force: true });
  });

  it('rejects .smith that escapes project root after resolve', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-escape-cfg-'));
    mkdirSync(join(root, '.smith'), { recursive: true });
    const spy = jest.spyOn(pathSafety, 'isInsideResolved').mockReturnValue(false);
    try {
      await expect(loadRootConfig(root)).rejects.toThrow(/escapes project root/);
    } finally {
      spy.mockRestore();
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('returns undefined when template config.js is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-no-template-config-'));
    const templateDir = join(root, 'template');
    mkdirSync(templateDir, { recursive: true });

    await expect(loadTemplateConfig(templateDir)).resolves.toBeUndefined();

    rmSync(root, { recursive: true, force: true });
  });

  it('reloads config after on-disk changes (no stale require cache)', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-config-cache-'));
    const smithDir = join(root, '.smith');
    mkdirSync(smithDir, { recursive: true });
    const file = join(smithDir, 'config.js');
    writeFileSync(
      file,
      'module.exports = { placeholder: ["{{", "}}"], variables: {}, rootDir: "one" };',
      'utf8',
    );

    const first = await loadRootConfig(root);
    expect(first.rootDir).toBe('one');

    writeFileSync(
      file,
      'module.exports = { placeholder: ["{{", "}}"], variables: {}, rootDir: "two" };',
      'utf8',
    );
    const second = await loadRootConfig(root);
    expect(second.rootDir).toBe('two');

    rmSync(root, { recursive: true, force: true });
  });

  it('rejects symlinked config.js', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-config-link-'));
    const smithDir = join(root, '.smith');
    mkdirSync(smithDir, { recursive: true });
    const real = join(root, 'outside.js');
    writeFileSync(real, 'module.exports = { placeholder: ["{{", "}}"], variables: {} };', 'utf8');
    try {
      symlinkSync(real, join(smithDir, 'config.js'));
    } catch {
      rmSync(root, { recursive: true, force: true });
      return;
    }

    await expect(loadRootConfig(root)).rejects.toThrow(UnsafePathError);
    rmSync(root, { recursive: true, force: true });
  });
});

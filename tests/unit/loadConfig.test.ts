import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRootConfig, loadTemplateConfig } from '../../src/config/loadConfig';

describe('loadRootConfig', () => {
  it('loads .smith/config.js', async () => {
    const root = join(__dirname, '../fixtures/config-project');
    const config = await loadRootConfig(root);
    expect(config.variables.NAME_PASCAL({} as any, { format: { pascal: (v: string) => v } } as any)).toBeDefined();
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

  it('returns undefined when template config.js is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-no-template-config-'));
    const templateDir = join(root, 'template');
    mkdirSync(templateDir, { recursive: true });

    await expect(loadTemplateConfig(templateDir)).resolves.toBeUndefined();

    rmSync(root, { recursive: true, force: true });
  });
});

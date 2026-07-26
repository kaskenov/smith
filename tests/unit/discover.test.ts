import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  discoverGlobalTemplateNames,
  discoverSmithRoot,
  discoverTemplateDir,
  discoverTemplates,
} from '../../src/services/discover';
import { getGlobalTemplatesDir } from '../../src/paths/globalSmithHome';

describe('discover façade', () => {
  it('discovers project root and templates', () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-discover-'));
    mkdirSync(join(root, '.smith', 'templates', 'component'), { recursive: true });
    writeFileSync(join(root, '.smith', 'config.js'), 'module.exports = {};', 'utf8');

    expect(discoverSmithRoot(root)).toBe(root);
    expect(discoverTemplates(root)).toEqual([{ name: 'component', source: 'local' }]);
    expect(discoverTemplateDir(root, 'component').source).toBe('local');

    rmSync(root, { recursive: true, force: true });
  });

  it('lists global template names', () => {
    mkdirSync(join(getGlobalTemplatesDir(), 'global-one'), { recursive: true });
    expect(discoverGlobalTemplateNames()).toContain('global-one');
  });
});

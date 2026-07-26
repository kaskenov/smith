import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { replicate, resolveOutputBase } from '../../src/services/replicate';

describe('resolveOutputBase', () => {
  it('uses project rootDir over global', () => {
    expect(resolveOutputBase('/proj', '/cwd', 'global-src', 'project-src')).toBe(
      join('/proj', 'project-src'),
    );
  });

  it('falls back to global rootDir when project omits it', () => {
    expect(resolveOutputBase('/proj', '/cwd', 'global-src', undefined)).toBe(
      join('/proj', 'global-src'),
    );
  });

  it('uses discovered root when neither rootDir is set', () => {
    expect(resolveOutputBase('/proj', '/cwd', undefined, undefined)).toBe('/proj');
  });

  it('uses cwd when there is no project root', () => {
    expect(resolveOutputBase(null, '/cwd', 'global-src', undefined)).toBe('/cwd');
  });
});

describe('replicate honors global rootDir', () => {
  it('writes under global rootDir when project config omits rootDir', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-global-root-'));
    const smithDir = join(root, '.smith');
    const templateDir = join(smithDir, 'templates', 'component');
    mkdirSync(templateDir, { recursive: true });
    mkdirSync(join(root, 'from-global'), { recursive: true });

    writeFileSync(join(templateDir, '{{name}}.txt'), 'Hello {{name}}', 'utf8');
    writeFileSync(
      join(smithDir, 'config.js'),
      `module.exports = { placeholder: ['{{', '}}'] };`,
      'utf8',
    );

    const previousHome = process.env.SMITH_HOME;
    const home = mkdtempSync(join(tmpdir(), 'smith-home-'));
    process.env.SMITH_HOME = home;
    mkdirSync(join(home), { recursive: true });
    writeFileSync(
      join(home, 'config.js'),
      `module.exports = { rootDir: 'from-global', placeholder: ['{{', '}}'], variables: {} };`,
      'utf8',
    );

    try {
      const result = await replicate({
        name: 'Widget',
        template: 'component',
        force: true,
        cwd: root,
      });
      expect(result.outputPath).toBe(join(root, 'from-global'));
      expect(readFileSync(join(root, 'from-global', 'Widget.txt'), 'utf8')).toBe('Hello Widget');
    } finally {
      if (previousHome === undefined) delete process.env.SMITH_HOME;
      else process.env.SMITH_HOME = previousHome;
      rmSync(root, { recursive: true, force: true });
      rmSync(home, { recursive: true, force: true });
    }
  });
});

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertValidTemplateName,
  listTemplatesWithSource,
  removeGlobalTemplate,
  resolveTemplateDir,
} from '../../src/core/resolveTemplate';
import { readSources, writeSources } from '../../src/core/templateSources';
import {
  getGlobalSmithDir,
  getGlobalTemplatesDir,
  listTemplateNamesInDir,
} from '../../src/paths/globalSmithHome';

describe('globalTemplates', () => {
  it('resolves local template before global with same name', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-project-'));
    mkdirSync(join(project, '.smith', 'templates', 'shared'), { recursive: true });
    mkdirSync(join(getGlobalTemplatesDir(), 'shared'), { recursive: true });
    writeFileSync(join(project, '.smith', 'templates', 'shared', 'file.txt'), 'local', 'utf8');
    writeFileSync(join(getGlobalTemplatesDir(), 'shared', 'file.txt'), 'global', 'utf8');

    const resolved = resolveTemplateDir(project, 'shared');
    expect(resolved.source).toBe('local');
    expect(resolved.templateDir).toBe(join(project, '.smith', 'templates', 'shared'));

    rmSync(project, { recursive: true, force: true });
  });

  it('falls back to global template when local missing', () => {
    mkdirSync(join(getGlobalTemplatesDir(), 'frontend-app'), { recursive: true });
    writeFileSync(join(getGlobalTemplatesDir(), 'frontend-app', 'app.txt'), 'ok', 'utf8');

    const resolved = resolveTemplateDir(null, 'frontend-app');
    expect(resolved.source).toBe('global');
    expect(resolved.templateDir).toBe(join(getGlobalTemplatesDir(), 'frontend-app'));
  });

  it('lists local and global templates with source markers', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-project-'));
    mkdirSync(join(project, '.smith', 'templates', 'component'), { recursive: true });
    mkdirSync(join(getGlobalTemplatesDir(), 'frontend-app'), { recursive: true });
    mkdirSync(join(getGlobalTemplatesDir(), 'component'), { recursive: true });

    expect(listTemplatesWithSource(project)).toEqual([
      { name: 'component', source: 'local' },
      { name: 'frontend-app', source: 'global' },
    ]);

    rmSync(project, { recursive: true, force: true });
  });

  it('reads and writes sources.json', () => {
    writeSources({
      app: {
        type: 'path',
        from: '/tmp/app',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(readSources()).toEqual({
      app: {
        type: 'path',
        from: '/tmp/app',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('returns empty sources for invalid JSON and non-object JSON', () => {
    writeFileSync(join(getGlobalSmithDir(), 'sources.json'), '{not-json', 'utf8');
    expect(readSources()).toEqual({});

    writeFileSync(join(getGlobalSmithDir(), 'sources.json'), 'null', 'utf8');
    expect(readSources()).toEqual({});

    writeFileSync(join(getGlobalSmithDir(), 'sources.json'), '"string"', 'utf8');
    expect(readSources()).toEqual({});
  });

  it('uses homedir when SMITH_HOME is unset', () => {
    const previous = process.env.SMITH_HOME;
    delete process.env.SMITH_HOME;
    try {
      expect(getGlobalSmithDir()).toBe(join(homedir(), '.smith'));
    } finally {
      process.env.SMITH_HOME = previous;
    }
  });

  it('filters non-directories from template listings', () => {
    const dir = mkdtempSync(join(tmpdir(), 'smith-list-dir-'));
    mkdirSync(join(dir, 'keep'), { recursive: true });
    writeFileSync(join(dir, 'skip.txt'), 'x', 'utf8');
    expect(listTemplateNamesInDir(dir)).toEqual(['keep']);
    rmSync(dir, { recursive: true, force: true });
  });

  it('skips symlink entries when listing template dirs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'smith-list-symlink-'));
    const real = mkdtempSync(join(tmpdir(), 'smith-list-real-'));
    mkdirSync(join(dir, 'keep'), { recursive: true });
    try {
      symlinkSync(real, join(dir, 'linked'));
    } catch {
      rmSync(dir, { recursive: true, force: true });
      rmSync(real, { recursive: true, force: true });
      return;
    }
    expect(listTemplateNamesInDir(dir)).toEqual(['keep']);
    rmSync(dir, { recursive: true, force: true });
    rmSync(real, { recursive: true, force: true });
  });

  it('rejects symlink template roots in resolveTemplateDir', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-symlink-tpl-'));
    const outside = mkdtempSync(join(tmpdir(), 'smith-outside-tpl-'));
    mkdirSync(join(project, '.smith', 'templates'), { recursive: true });
    writeFileSync(join(outside, 'secret.txt'), 'secret', 'utf8');
    try {
      symlinkSync(outside, join(project, '.smith', 'templates', 'evil'));
    } catch {
      rmSync(project, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
      return;
    }

    expect(() => resolveTemplateDir(project, 'evil')).toThrow(/symlink/);
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  it('removes template dir and/or sources entry', () => {
    mkdirSync(join(getGlobalTemplatesDir(), 'both'), { recursive: true });
    writeSources({
      both: { type: 'path', from: '/tmp/both', updatedAt: 't' },
      onlySource: { type: 'path', from: '/tmp/only', updatedAt: 't' },
    });

    expect(removeGlobalTemplate('both')).toBe(true);
    expect(removeGlobalTemplate('onlySource')).toBe(true);
    expect(removeGlobalTemplate('missing')).toBe(false);
    expect(readSources()).toEqual({});
  });

  it('validates template names', () => {
    expect(() => assertValidTemplateName('ok')).not.toThrow();
    expect(() => assertValidTemplateName('')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('.')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('..')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('a/b')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('a\\b')).toThrow('Invalid template name');
  });
});

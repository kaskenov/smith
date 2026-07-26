import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertValidTemplateName,
  isValidTemplateName,
  listTemplatesWithSource,
  removeGlobalTemplate,
  resolveTemplateDir,
} from '../../src/core/resolveTemplate';
import * as pathSafety from '../../src/core/pathSafety';
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

    writeFileSync(join(getGlobalSmithDir(), 'sources.json'), '[]', 'utf8');
    expect(readSources()).toEqual({});

    writeFileSync(
      join(getGlobalSmithDir(), 'sources.json'),
      JSON.stringify({
        'bad/name': { type: 'path', from: '/tmp/x', updatedAt: 't' },
        ok: { type: 'path', from: '/tmp/ok', updatedAt: 't' },
        broken: { type: 'ftp', from: '/tmp/x', updatedAt: 't' },
        incomplete: { type: 'path' },
        emptyFrom: { type: 'path', from: '', updatedAt: 't' },
        badRef: { type: 'git', from: 'https://x', ref: 1, updatedAt: 't' },
        badPath: { type: 'path', from: '/tmp/x', path: 2, updatedAt: 't' },
        badUpdatedAt: { type: 'path', from: '/tmp/x', updatedAt: 3 },
        asArray: [{ type: 'path', from: '/tmp/x', updatedAt: 't' }],
      }),
      'utf8',
    );
    expect(readSources()).toEqual({
      ok: { type: 'path', from: '/tmp/ok', updatedAt: 't' },
    });
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
    mkdirSync(join(dir, '-invalid'), { recursive: true });
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
    const templates = join(project, '.smith', 'templates');
    mkdirSync(join(templates, 'real'), { recursive: true });
    writeFileSync(join(templates, 'real', 'a.txt'), 'a', 'utf8');
    try {
      // In-tree symlink so containment passes; acceptTemplateDir still rejects.
      symlinkSync(join(templates, 'real'), join(templates, 'evil'));
    } catch {
      rmSync(project, { recursive: true, force: true });
      return;
    }

    expect(() => resolveTemplateDir(project, 'evil')).toThrow(/symlink/);
    rmSync(project, { recursive: true, force: true });
  });

  it('rejects project .smith that is not a real directory', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-file-smith-'));
    writeFileSync(join(project, '.smith'), 'not-a-dir', 'utf8');
    expect(() => resolveTemplateDir(project, 'any')).toThrow(/not a real directory/);
    rmSync(project, { recursive: true, force: true });
  });

  it('rejects .smith that escapes project root after resolve', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-escape-smith-'));
    mkdirSync(join(project, '.smith', 'templates'), { recursive: true });
    const spy = jest.spyOn(pathSafety, 'isInsideResolved').mockReturnValue(false);
    try {
      expect(() => resolveTemplateDir(project, 'any')).toThrow(/escapes project root/);
    } finally {
      spy.mockRestore();
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('rejects templates that escape .smith after resolve', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-escape-tpls-'));
    mkdirSync(join(project, '.smith', 'templates', 'ok'), { recursive: true });
    const spy = jest
      .spyOn(pathSafety, 'isInsideResolved')
      .mockReturnValueOnce(true) // .smith vs project
      .mockReturnValueOnce(false); // templates vs .smith
    try {
      expect(() => resolveTemplateDir(project, 'ok')).toThrow(/escapes \.smith/);
    } finally {
      spy.mockRestore();
      rmSync(project, { recursive: true, force: true });
    }
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
    expect(isValidTemplateName('ok')).toBe(true);
    expect(isValidTemplateName('-nope')).toBe(false);
    expect(() => assertValidTemplateName('ok')).not.toThrow();
    expect(() => assertValidTemplateName('frontend-app')).not.toThrow();
    expect(() => assertValidTemplateName('A_b.1')).not.toThrow();
    expect(() => assertValidTemplateName('')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('.')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('..')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('a/b')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('a\\b')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('-leading')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('has space')).toThrow('Invalid template name');
    expect(() => assertValidTemplateName('nul\0')).toThrow('Invalid template name');
  });

  it('rejects templates directory symlink under project', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-tpl-link-'));
    const outside = mkdtempSync(join(tmpdir(), 'smith-tpl-out-'));
    mkdirSync(join(project, '.smith'), { recursive: true });
    mkdirSync(join(outside, 'component'), { recursive: true });
    writeFileSync(join(outside, 'component', 'x.txt'), 'x', 'utf8');
    try {
      symlinkSync(outside, join(project, '.smith', 'templates'));
    } catch {
      rmSync(project, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
      return;
    }

    expect(() => resolveTemplateDir(project, 'component')).toThrow(/symlink|templates/);
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  it('rejects path traversal and empty names in resolveTemplateDir', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-traverse-'));
    mkdirSync(join(project, '.smith', 'templates'), { recursive: true });
    const secret = mkdtempSync(join(tmpdir(), 'smith-secret-'));
    writeFileSync(join(secret, 'config.js'), 'module.exports = {};', 'utf8');

    expect(() => resolveTemplateDir(project, '../../secret')).toThrow(/Invalid template name/);
    expect(() => resolveTemplateDir(project, '')).toThrow(/Invalid template name/);
    expect(() => resolveTemplateDir(project, '..')).toThrow(/Invalid template name/);

    rmSync(project, { recursive: true, force: true });
    rmSync(secret, { recursive: true, force: true });
  });

  it('rejects resolved template dirs that escape templates root', () => {
    const project = mkdtempSync(join(tmpdir(), 'smith-contain-'));
    mkdirSync(join(project, '.smith', 'templates', 'ok'), { recursive: true });
    const isInsideSpy = jest.spyOn(pathSafety, 'isInside').mockReturnValue(false);
    try {
      expect(() => resolveTemplateDir(project, 'ok')).toThrow(/escapes templates root/);
    } finally {
      isInsideSpy.mockRestore();
      rmSync(project, { recursive: true, force: true });
    }
  });
});

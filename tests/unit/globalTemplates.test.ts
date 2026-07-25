import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getGlobalTemplatesDir,
  listTemplatesWithSource,
  readSources,
  resolveTemplateDir,
  writeSources,
} from '../../src/core/globalTemplates';

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
});

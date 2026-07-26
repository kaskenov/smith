import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runList } from '../../src/commands/list';
import { getGlobalTemplatesDir } from '../../src/paths/globalSmithHome';

describe('runList', () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'smith-list-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('lists global templates when not in a smith project', () => {
    mkdirSync(join(getGlobalTemplatesDir(), 'frontend-app'), { recursive: true });
    process.chdir(tempDir);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    runList();

    expect(logs).toEqual(['frontend-app (global)']);
  });

  it('lists template folder names with sources sorted alphabetically', () => {
    const templatesDir = join(tempDir, '.smith', 'templates');
    mkdirSync(join(templatesDir, 'ui'), { recursive: true });
    mkdirSync(join(templatesDir, 'component'), { recursive: true });
    mkdirSync(join(getGlobalTemplatesDir(), 'frontend-app'), { recursive: true });
    writeFileSync(join(templatesDir, 'ui', '{{name}}.vue'), 'ui', 'utf8');
    writeFileSync(join(templatesDir, 'component', '{{name}}.txt'), 'component', 'utf8');

    process.chdir(tempDir);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    runList();

    expect(logs).toEqual([
      'component (local)',
      'frontend-app (global)',
      'ui (local)',
    ]);
  });

  it('prints empty message when no templates exist', () => {
    mkdirSync(join(tempDir, '.smith', 'templates'), { recursive: true });
    process.chdir(tempDir);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    runList();

    expect(logs).toEqual(['No templates in project or ~/.smith/templates/']);
  });
});

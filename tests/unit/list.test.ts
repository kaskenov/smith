import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runList } from '../../src/commands/list';

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

  it('throws when not in a smith project', () => {
    process.chdir(tempDir);
    expect(() => runList()).toThrow('No .smith directory found. Run from a smith project.');
  });

  it('lists template folder names sorted alphabetically', () => {
    const templatesDir = join(tempDir, '.smith', 'templates');
    mkdirSync(join(templatesDir, 'ui'), { recursive: true });
    mkdirSync(join(templatesDir, 'component'), { recursive: true });
    writeFileSync(join(templatesDir, 'ui', '{{name}}.vue'), 'ui', 'utf8');
    writeFileSync(join(templatesDir, 'component', '{{name}}.txt'), 'component', 'utf8');

    process.chdir(tempDir);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    runList();

    expect(logs).toEqual(['component', 'ui']);
  });

  it('prints empty message when templates directory has no folders', () => {
    mkdirSync(join(tempDir, '.smith', 'templates'), { recursive: true });
    process.chdir(tempDir);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    runList();

    expect(logs).toEqual(['No templates in .smith/templates/']);
  });
});

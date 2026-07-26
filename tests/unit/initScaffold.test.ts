import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInit } from '../../src/commands/init';
import { createProjectConfig, createTemplate, initProject } from '../../src/services/scaffold';

describe('runInit / scaffold', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bootstraps .smith and reports created paths', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-init-'));
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runInit(root);

    expect(existsSync(join(root, '.smith', 'config.js'))).toBe(true);
    expect(existsSync(join(root, '.smith', 'templates'))).toBe(true);
    expect(readFileSync(join(root, '.smith', 'config.js'), 'utf8')).toContain('NAME_PASCAL');
    expect(logs.some((line) => line.includes('smith init ->'))).toBe(true);

    await runInit(root);
    expect(logs.some((line) => line.includes('already exists'))).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });

  it('defaults cwd to process.cwd()', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-init-cwd-'));
    const previous = process.cwd();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(root);
    try {
      await runInit();
      expect(existsSync(join(root, '.smith', 'config.js'))).toBe(true);
    } finally {
      process.chdir(previous);
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('createProjectConfig and createTemplate require an existing .smith', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-scaffold-missing-'));
    await expect(createProjectConfig(root)).rejects.toThrow('No .smith directory found.');
    await expect(createTemplate(root, 'x')).rejects.toThrow('No .smith directory found.');
    rmSync(root, { recursive: true, force: true });
  });

  it('createProjectConfig reports existing config', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-scaffold-cfg-'));
    await initProject(root);
    const again = await createProjectConfig(root);
    expect(again.created).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });

  it('createTemplate writes custom files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-scaffold-tpl-'));
    mkdirSync(join(root, '.smith', 'templates'), { recursive: true });
    writeFileSync(join(root, '.smith', 'config.js'), 'module.exports = {};', 'utf8');
    const result = await createTemplate(root, 'svc', [{ path: 'a.txt', content: 'A' }]);
    expect(result.files).toHaveLength(1);
    expect(existsSync(join(root, '.smith', 'templates', 'svc', 'a.txt'))).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });
});

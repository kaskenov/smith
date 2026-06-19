import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runInstallSkills } from '../../src/commands/install/skills';
import { runUninstallSkills } from '../../src/commands/install/uninstall';
import * as brandModule from '../../src/terminal/brand';

describe('runInstallSkills integration', () => {
  const tmpRoots: string[] = [];

  afterEach(() => {
    jest.restoreAllMocks();
    for (const root of tmpRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function makeTmpRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'smith-install-skills-'));
    tmpRoots.push(root);
    return root;
  }

  it('installs bundled skills to all agents locally by default', async () => {
    const tmpRoot = makeTmpRoot();
    const brandSpy = jest
      .spyOn(brandModule, 'brandSmith')
      .mockImplementation((text) => `[brand] ${text}`);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallSkills({ cwd: tmpRoot });

    expect(existsSync(join(tmpRoot, '.cursor/skills/smith-replicate/SKILL.md'))).toBe(true);
    expect(existsSync(join(tmpRoot, '.claude/skills/smith-replicate/SKILL.md'))).toBe(true);
    expect(existsSync(join(tmpRoot, '.qwen/skills/smith-replicate/SKILL.md'))).toBe(true);
    expect(brandSpy).toHaveBeenCalledWith(`smith installed skills to ${join(tmpRoot, '.cursor/skills')}`);
    expect(brandSpy).toHaveBeenCalledWith(`smith installed skills to ${join(tmpRoot, '.claude/skills')}`);
    expect(brandSpy).toHaveBeenCalledWith(`smith installed skills to ${join(tmpRoot, '.qwen/skills')}`);
    expect(consoleSpy).toHaveBeenCalledTimes(3);
  });

  it('installs skills to claude only when --claude is set', async () => {
    const tmpRoot = makeTmpRoot();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallSkills({ cwd: tmpRoot, claude: true });

    expect(existsSync(join(tmpRoot, '.claude/skills/smith-config/SKILL.md'))).toBe(true);
    expect(existsSync(join(tmpRoot, '.cursor/skills'))).toBe(false);
  });

  it('does not write files in dry-run mode', async () => {
    const tmpRoot = makeTmpRoot();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runInstallSkills({ cwd: tmpRoot, dryRun: true });

    expect(existsSync(join(tmpRoot, '.cursor/skills'))).toBe(false);
    expect(existsSync(join(tmpRoot, '.claude/skills'))).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(`Would install skills to ${join(tmpRoot, '.cursor/skills')}`);
    expect(consoleSpy).toHaveBeenCalledWith(`Would install skills to ${join(tmpRoot, '.claude/skills')}`);
    expect(consoleSpy).toHaveBeenCalledWith(`Would install skills to ${join(tmpRoot, '.qwen/skills')}`);
  });

  it('uses process.cwd when cwd flag is omitted', async () => {
    const tmpRoot = makeTmpRoot();
    const previousCwd = process.cwd();
    process.chdir(tmpRoot);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await runInstallSkills({ cursor: true });
      expect(existsSync(join(tmpRoot, '.cursor/skills/smith-replicate/SKILL.md'))).toBe(true);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it('uses process.cwd when uninstalling skills without cwd flag', async () => {
    const tmpRoot = makeTmpRoot();
    const previousCwd = process.cwd();
    process.chdir(tmpRoot);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await runInstallSkills({ cursor: true });
      await runUninstallSkills({ cursor: true });
      expect(existsSync(join(tmpRoot, '.cursor/skills/smith-replicate'))).toBe(false);
    } finally {
      process.chdir(previousCwd);
    }
  });
});

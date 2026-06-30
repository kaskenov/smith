import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { resolveProjectContext, resolveSmithBannerContext } from '../../src/terminal/bannerContext';
import * as registryModule from '../../src/package/registry';

describe('bannerContext', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'smith-banner-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('returns no project context outside a smith project', () => {
    expect(resolveProjectContext(tempDir)).toBeUndefined();
  });

  it('shows project context inside a smith project', () => {
    const smithDir = join(tempDir, '.smith', 'templates', 'component');
    mkdirSync(smithDir, { recursive: true });
    writeFileSync(join(smithDir, '{{name}}.txt'), 'hello', 'utf8');

    expect(resolveProjectContext(tempDir)).toBe(
      `Project: ${basename(tempDir)} · templates: component`,
    );
  });

  it('uses process.cwd when no cwd is passed', () => {
    const smithDir = join(tempDir, '.smith', 'templates', 'component');
    mkdirSync(smithDir, { recursive: true });
    writeFileSync(join(smithDir, '{{name}}.txt'), 'hello', 'utf8');
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    expect(resolveProjectContext()).toBe(
      `Project: ${basename(tempDir)} · templates: component`,
    );

    cwdSpy.mockRestore();
  });

  it('shows (none) when a smith project has no templates', () => {
    mkdirSync(join(tempDir, '.smith', 'templates'), { recursive: true });

    expect(resolveProjectContext(tempDir)).toBe(
      `Project: ${basename(tempDir)} · templates: (none)`,
    );
  });

  it('includes update nudge when a newer version exists', async () => {
    const previousSkip = process.env.SMITH_SKIP_UPDATE_CHECK;
    delete process.env.SMITH_SKIP_UPDATE_CHECK;
    jest.spyOn(registryModule, 'findNewerVersion').mockResolvedValue('9.9.9');

    try {
      const context = await resolveSmithBannerContext({ checkForUpdate: true, cwd: tempDir });
      expect(context.updateAvailable).toBe('9.9.9');
    } finally {
      if (previousSkip === undefined) {
        delete process.env.SMITH_SKIP_UPDATE_CHECK;
      } else {
        process.env.SMITH_SKIP_UPDATE_CHECK = previousSkip;
      }
    }
  });

  it('omits update nudge when already on latest', async () => {
    const previousSkip = process.env.SMITH_SKIP_UPDATE_CHECK;
    delete process.env.SMITH_SKIP_UPDATE_CHECK;
    jest.spyOn(registryModule, 'findNewerVersion').mockResolvedValue(null);

    try {
      const context = await resolveSmithBannerContext({ checkForUpdate: true, cwd: tempDir });
      expect(context.updateAvailable).toBeUndefined();
    } finally {
      if (previousSkip === undefined) {
        delete process.env.SMITH_SKIP_UPDATE_CHECK;
      } else {
        process.env.SMITH_SKIP_UPDATE_CHECK = previousSkip;
      }
    }
  });

  it('skips update check when SMITH_SKIP_UPDATE_CHECK is set', async () => {
    const findNewerSpy = jest.spyOn(registryModule, 'findNewerVersion');

    const context = await resolveSmithBannerContext({ checkForUpdate: true, cwd: tempDir });

    expect(context.updateAvailable).toBeUndefined();
    expect(findNewerSpy).not.toHaveBeenCalled();
  });
});

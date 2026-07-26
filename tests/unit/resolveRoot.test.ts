import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findSmithRoot } from '../../src/core/resolveRoot';

describe('findSmithRoot', () => {
  let base: string;

  beforeEach(() => {
    base = mkdtempSync(join(tmpdir(), 'smith-root-'));
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  it('finds .smith walking up from nested cwd', () => {
    mkdirSync(join(base, '.smith'), { recursive: true });
    const nested = join(base, 'apps', 'web');
    mkdirSync(nested, { recursive: true });
    expect(findSmithRoot(nested)).toBe(base);
  });

  it('returns null when .smith not found', () => {
    expect(findSmithRoot(base)).toBeNull();
  });

  it('ignores .smith when it is a symlink', () => {
    const outside = mkdtempSync(join(tmpdir(), 'smith-outside-'));
    writeFileSync(join(outside, 'config.js'), 'module.exports = {};', 'utf8');
    try {
      symlinkSync(outside, join(base, '.smith'));
    } catch {
      rmSync(outside, { recursive: true, force: true });
      return;
    }
    expect(findSmithRoot(base)).toBeNull();
    rmSync(outside, { recursive: true, force: true });
  });
});

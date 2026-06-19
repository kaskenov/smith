import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
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
});

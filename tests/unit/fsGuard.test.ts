import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UnsafePathError } from '../../src/core/errors';
import {
  assertNotSymlink,
  assertSafeFileInside,
  isRealDirectory,
  isRealFile,
} from '../../src/core/fsGuard';
import * as pathSafety from '../../src/core/pathSafety';

describe('fsGuard', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'smith-fsguard-'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(root, { recursive: true, force: true });
  });

  it('accepts regular files inside the root', () => {
    const file = join(root, 'ok.txt');
    writeFileSync(file, 'ok');
    expect(() => assertSafeFileInside(root, file)).not.toThrow();
    expect(isRealFile(file)).toBe(true);
    expect(isRealDirectory(root)).toBe(true);
  });

  it('rejects paths outside the root', () => {
    const outside = join(root, '..', 'outside.txt');
    writeFileSync(outside, 'x');
    expect(() => assertSafeFileInside(root, outside)).toThrow(UnsafePathError);
  });

  it('rejects directories as files', () => {
    const dir = join(root, 'dir');
    mkdirSync(dir);
    expect(() => assertSafeFileInside(root, dir)).toThrow(/not a regular file/);
  });

  it('rejects when resolved path escapes the root', () => {
    const file = join(root, 'ok.txt');
    writeFileSync(file, 'ok');
    jest.spyOn(pathSafety, 'isInsideResolved').mockReturnValue(false);
    expect(() => assertSafeFileInside(root, file)).toThrow(/escapes/);
  });

  it('treats missing paths as not real files or directories', () => {
    expect(isRealFile(join(root, 'missing.txt'))).toBe(false);
    expect(isRealDirectory(join(root, 'missing'))).toBe(false);
  });

  it('treats symlinks as neither real files nor directories', () => {
    const target = join(root, 'target.txt');
    writeFileSync(target, 'x');
    const link = join(root, 'link.txt');
    try {
      symlinkSync(target, link);
    } catch {
      return;
    }
    expect(isRealFile(link)).toBe(false);
    expect(isRealDirectory(link)).toBe(false);
    expect(() => assertNotSymlink(link)).toThrow(/symlink/);
    expect(() => assertNotSymlink(join(root, 'missing'))).not.toThrow();
  });
});

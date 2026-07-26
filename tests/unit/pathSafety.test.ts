import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const existsSync = jest.fn();
const realpathSync = jest.fn();

jest.mock('node:fs', () => {
  const actual = jest.requireActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: (...args: Parameters<typeof actual.existsSync>) => existsSync(...args),
    realpathSync: (...args: Parameters<typeof actual.realpathSync>) => realpathSync(...args),
  };
});

import { isInside, isInsideResolved, resolveForContainment } from '../../src/core/pathSafety';

describe('pathSafety', () => {
  const actualFs = jest.requireActual<typeof import('node:fs')>('node:fs');
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'smith-path-safety-'));
    existsSync.mockImplementation((path) => actualFs.existsSync(path as string));
    realpathSync.mockImplementation((path) => actualFs.realpathSync(path as string));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  it('isInside rejects paths that escape the parent', () => {
    expect(isInside(join(root, 'a', 'b'), join(root, 'a'))).toBe(true);
    expect(isInside(join(root, 'b'), join(root, 'a'))).toBe(false);
  });

  it('isInsideResolved follows symlinks when resolving containment', () => {
    const realParent = join(root, 'real');
    const viaLink = join(root, 'link');
    mkdirSync(realParent, { recursive: true });
    writeFileSync(join(realParent, 'file.txt'), 'x');
    try {
      symlinkSync(realParent, viaLink);
    } catch {
      return;
    }

    expect(isInsideResolved(join(viaLink, 'file.txt'), realParent)).toBe(true);
    expect(isInsideResolved(join(root, 'other.txt'), realParent)).toBe(false);
  });

  it('resolveForContainment falls back when realpathSync throws', () => {
    const file = join(root, 'file.txt');
    writeFileSync(file, 'x');
    realpathSync.mockImplementation(() => {
      throw new Error('ELOOP');
    });

    expect(resolveForContainment(file)).toBe(file);
  });

  it('resolveForContainment falls back with missing segments when realpathSync throws', () => {
    mkdirSync(join(root, 'dir'), { recursive: true });
    realpathSync.mockImplementation(() => {
      throw new Error('ELOOP');
    });

    const missing = join(root, 'dir', 'nested.txt');
    expect(resolveForContainment(missing)).toBe(missing);
  });

  it('resolveForContainment joins missing segments onto resolved parents', () => {
    mkdirSync(join(root, 'dir'), { recursive: true });
    const missing = join(root, 'dir', 'nested', 'file.txt');
    expect(resolveForContainment(missing)).toContain('file.txt');
  });

  it('resolveForContainment stops at filesystem root when nothing exists', () => {
    existsSync.mockReturnValue(false);
    expect(resolveForContainment('/missing/nested')).toBe('/missing/nested');
  });

  it('resolveForContainment returns the root path when the root itself is missing', () => {
    existsSync.mockReturnValue(false);
    expect(resolveForContainment('/')).toBe('/');
  });
});

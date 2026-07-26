import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRollback } from '../../src/core/rollback';

describe('createRollback', () => {
  it('deletes tracked files that were newly created', () => {
    const dir = mkdtempSync(join(tmpdir(), 'smith-rb-'));
    const file = join(dir, 'a.txt');
    writeFileSync(file, 'x');
    const rb = createRollback();
    rb.track(file, null);
    rb.rollback();
    expect(existsSync(file)).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });

  it('skips delete when a tracked new file is already gone', () => {
    const dir = mkdtempSync(join(tmpdir(), 'smith-rb-'));
    const file = join(dir, 'missing.txt');
    const rb = createRollback();
    rb.track(file, null);
    rb.rollback();
    expect(existsSync(file)).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });

  it('restores prior content for overwritten files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'smith-rb-'));
    const file = join(dir, 'a.txt');
    writeFileSync(file, 'original');
    const rb = createRollback();
    rb.track(file, 'original');
    writeFileSync(file, 'overwritten');
    rb.rollback();
    expect(readFileSync(file, 'utf8')).toBe('original');
    rmSync(dir, { recursive: true, force: true });
  });

  it('removes empty directories created under the output root', () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-rb-dirs-'));
    const nested = join(root, 'out', 'deep', 'nested');
    mkdirSync(nested, { recursive: true });
    const file = join(nested, 'a.txt');
    writeFileSync(file, 'x');

    const rb = createRollback({ cleanEmptyDirsUpTo: join(root, 'out') });
    rb.track(file, null);
    rb.rollback();

    expect(existsSync(file)).toBe(false);
    expect(existsSync(join(root, 'out', 'deep'))).toBe(false);
    expect(existsSync(join(root, 'out'))).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });

  it('removes empty ensureDir-tracked directories without recursive delete', () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-rb-ensuredir-'));
    const out = join(root, 'out');
    const nested = join(out, 'created');
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(nested, 'extra.txt'), 'keep-me');

    const rb = createRollback({ cleanEmptyDirsUpTo: out });
    rb.track(nested, null, { isDirectory: true });
    rb.rollback();

    // Directory still has content — empty rmdir must leave it alone.
    expect(existsSync(join(nested, 'extra.txt'))).toBe(true);
    expect(existsSync(nested)).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });

  it('rolls back empty ensureDir-created directories and prunes empty output root', () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-rb-ensuredir-empty-'));
    const out = join(root, 'out');
    const nested = join(out, 'created');
    mkdirSync(nested, { recursive: true });

    const rb = createRollback({ cleanEmptyDirsUpTo: out });
    rb.track(nested, null, { isDirectory: true });
    rb.rollback();

    expect(existsSync(nested)).toBe(false);
    expect(existsSync(out)).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });

  it('leaves non-empty directories in place while pruning', () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-rb-keep-'));
    const nested = join(root, 'out', 'deep');
    mkdirSync(nested, { recursive: true });
    const file = join(nested, 'a.txt');
    writeFileSync(file, 'x');
    writeFileSync(join(nested, 'keep.txt'), 'stay');

    const rb = createRollback({ cleanEmptyDirsUpTo: join(root, 'out') });
    rb.track(file, null);
    rb.rollback();

    expect(existsSync(join(nested, 'keep.txt'))).toBe(true);
    expect(readdirSync(nested)).toEqual(['keep.txt']);
    rmSync(root, { recursive: true, force: true });
  });
});

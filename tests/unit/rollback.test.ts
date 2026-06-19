import { mkdtempSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRollback } from '../../src/core/rollback';

describe('createRollback', () => {
  it('deletes tracked files on rollback', () => {
    const dir = mkdtempSync(join(tmpdir(), 'smith-rb-'));
    const file = join(dir, 'a.txt');
    writeFileSync(file, 'x');
    const rb = createRollback();
    rb.track(file);
    rb.rollback();
    expect(existsSync(file)).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });
});

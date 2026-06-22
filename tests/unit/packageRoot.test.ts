import { getBundledDir } from '../../src/install/packageRoot';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('getBundledDir', () => {
  it('finds bundled/ with smith skills', () => {
    const dir = getBundledDir();
    expect(existsSync(join(dir, 'skills', 'smith', 'SKILL.md'))).toBe(true);
  });
});

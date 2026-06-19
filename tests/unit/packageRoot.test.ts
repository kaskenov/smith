import { getBundledDir } from '../../src/install/packageRoot';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('getBundledDir', () => {
  it('finds bundled/ with smith skills', () => {
    const dir = getBundledDir();
    expect(existsSync(join(dir, 'skills', 'smith-replicate', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(dir, 'skills', 'smith-templates', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(dir, 'skills', 'smith-config', 'SKILL.md'))).toBe(true);
  });
});

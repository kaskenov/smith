import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { getBundledDir } from '../../src/install/packageRoot';

describe('getBundledDir errors', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws when bundled skills cannot be found', () => {
    jest.spyOn(require('node:fs'), 'existsSync').mockReturnValue(false);

    expect(() => getBundledDir()).toThrow(
      'Bundled smith skills not found. Reinstall @kaskenov/smith or run pnpm build.',
    );
    expect(existsSync).toHaveBeenCalled();
    expect(jest.mocked(existsSync).mock.calls.some(([target]) => String(target).endsWith(join('bundled', 'skills', 'smith', 'SKILL.md')))).toBe(true);
  });
});

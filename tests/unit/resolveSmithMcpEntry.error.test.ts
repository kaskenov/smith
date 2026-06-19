import { resolveSmithMcpEntry } from '../../src/install/resolveSmithMcpEntry';

describe('resolveSmithMcpEntry errors', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws when package root cannot be found', () => {
    jest.spyOn(require('node:fs'), 'existsSync').mockReturnValue(false);

    expect(() => resolveSmithMcpEntry('/tmp/smith-missing-package-root')).toThrow(
      'smith package root not found',
    );
  });
});

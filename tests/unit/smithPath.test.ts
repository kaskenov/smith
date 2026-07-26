import { resolveSmithTemplateFile, resolveUnderSmithDir } from '../../src/core/smithPath';
import { UnsafePathError } from '../../src/core/errors';

describe('smithPath', () => {
  const root = '/tmp/proj';

  it('resolves paths under .smith/', () => {
    expect(resolveUnderSmithDir(root, 'config.js')).toBe('/tmp/proj/.smith/config.js');
  });

  it('resolves template files under templates/<name>/', () => {
    expect(resolveSmithTemplateFile(root, 'svc', 'a.txt')).toBe(
      '/tmp/proj/.smith/templates/svc/a.txt',
    );
    expect(resolveSmithTemplateFile(root, 'svc', 'nested/ok.txt')).toBe(
      '/tmp/proj/.smith/templates/svc/nested/ok.txt',
    );
  });

  it('rejects createTemplate-style path collapse escapes', () => {
    expect(() => resolveSmithTemplateFile(root, 'svc', '../../config.js')).toThrow(
      UnsafePathError,
    );
    expect(() => resolveSmithTemplateFile(root, 'svc', '../other/x.txt')).toThrow(
      /must stay inside templates\/svc/,
    );
  });

  it('rejects absolute template file paths', () => {
    expect(() => resolveSmithTemplateFile(root, 'svc', '/etc/passwd')).toThrow(
      /relative to the template/,
    );
  });
});

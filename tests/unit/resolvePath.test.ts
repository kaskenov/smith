import { assertRelativeConfigPath, resolveOutputPath } from '../../src/core/resolvePath';
import { UsageError } from '../../src/core/errors';

describe('assertRelativeConfigPath', () => {
  it('allows relative and undefined values', () => {
    expect(() => assertRelativeConfigPath(undefined, 'rootDir')).not.toThrow();
    expect(() => assertRelativeConfigPath('src', 'rootDir')).not.toThrow();
  });

  it('rejects absolute values', () => {
    expect(() => assertRelativeConfigPath('/tmp/evil', 'rootDir')).toThrow(UsageError);
    expect(() => assertRelativeConfigPath('/tmp/evil', 'rootDir')).toThrow(
      /rootDir must be relative/,
    );
  });
});

describe('resolveOutputPath', () => {
  const ctx = { cwd: '/project/apps/web', root: '/project', defaultOutput: '/project' };

  it('uses default when omitted', () => {
    expect(resolveOutputPath(undefined, ctx)).toBe('/project');
  });

  it('resolves cwd-relative when starts with dot', () => {
    expect(resolveOutputPath('./src/components', ctx)).toBe('/project/apps/web/src/components');
  });

  it('resolves root-relative otherwise', () => {
    expect(resolveOutputPath('src/components', ctx)).toBe('/project/src/components');
  });

  it('rejects absolute paths by default', () => {
    expect(() => resolveOutputPath('/tmp/out', ctx)).toThrow(UsageError);
  });

  it('allows absolute paths when allowAbsolute is set', () => {
    expect(resolveOutputPath('/tmp/out', { ...ctx, allowAbsolute: true })).toBe('/tmp/out');
  });
});

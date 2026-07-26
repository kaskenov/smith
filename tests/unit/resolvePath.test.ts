import {
  assertRelativeConfigPath,
  hasParentPathSegment,
  resolveOutputPath,
} from '../../src/core/resolvePath';
import { UsageError } from '../../src/core/errors';

describe('hasParentPathSegment', () => {
  it('detects .. segments', () => {
    expect(hasParentPathSegment('../out')).toBe(true);
    expect(hasParentPathSegment('foo/../../bar')).toBe(true);
    expect(hasParentPathSegment('foo\\..\\bar')).toBe(true);
    expect(hasParentPathSegment('src/out')).toBe(false);
    expect(hasParentPathSegment('./out')).toBe(false);
  });
});

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

  it('rejects .. segments', () => {
    expect(() => assertRelativeConfigPath('../evil', 'rootDir')).toThrow(/must not contain '\.\.'/);
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

  it('rejects .. segments by default', () => {
    expect(() => resolveOutputPath('../../outside', ctx)).toThrow(/must not contain '\.\.'/);
    expect(() => resolveOutputPath('foo/../../outside', ctx)).toThrow(/must not contain '\.\.'/);
  });

  it('allows absolute paths when allowAbsolute is set', () => {
    expect(resolveOutputPath('/tmp/out', { ...ctx, allowAbsolute: true })).toBe('/tmp/out');
  });

  it('allows .. escape when allowAbsolute is set', () => {
    expect(resolveOutputPath('../../../outside', { ...ctx, allowAbsolute: true })).toBe('/outside');
  });

  it('rejects cwd-relative paths that resolve outside root', () => {
    expect(() =>
      resolveOutputPath('./out', {
        cwd: '/elsewhere',
        root: '/project',
        defaultOutput: '/project',
      }),
    ).toThrow(/escapes project root/);
  });
});

import { resolveOutputPath } from '../../src/core/resolvePath';

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

  it('keeps absolute paths', () => {
    expect(resolveOutputPath('/tmp/out', ctx)).toBe('/tmp/out');
  });
});

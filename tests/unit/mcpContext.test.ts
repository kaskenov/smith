import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireSmithRoot, resolveSmithPath } from '../../src/mcp/context';

describe('requireSmithRoot', () => {
  let base: string;

  beforeEach(() => {
    base = mkdtempSync(join(tmpdir(), 'smith-mcp-root-'));
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  it('returns project root when .smith exists', () => {
    mkdirSync(join(base, '.smith'), { recursive: true });
    const nested = join(base, 'apps', 'web');
    mkdirSync(nested, { recursive: true });
    expect(requireSmithRoot(nested)).toBe(base);
  });

  it('throws when .smith is missing', () => {
    expect(() => requireSmithRoot(base)).toThrow('No .smith directory found.');
  });
});

describe('resolveSmithPath', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'smith-mcp-path-'));
    mkdirSync(join(root, '.smith', 'templates', 'component'), { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('resolves a path under .smith', () => {
    expect(resolveSmithPath(root, 'templates/component')).toBe(
      join(root, '.smith', 'templates', 'component'),
    );
  });

  it('rejects parent traversal', () => {
    expect(() => resolveSmithPath(root, '../outside')).toThrow('Path traversal is not allowed.');
    expect(() => resolveSmithPath(root, 'templates/../../outside')).toThrow(
      'Path traversal is not allowed.',
    );
  });

  it('rejects absolute paths', () => {
    expect(() => resolveSmithPath(root, join(root, '.smith', 'config.js'))).toThrow(
      'Path must be relative to .smith/',
    );
  });

  it('rejects deeply normalized traversal targets', () => {
    expect(() => resolveSmithPath(root, '../../../../etc/passwd')).toThrow(
      'Path traversal is not allowed.',
    );
  });

  it('rejects resolved paths that fall outside .smith', () => {
    jest.isolateModules(() => {
      jest.doMock('node:path', () => {
        const actual = jest.requireActual<typeof import('node:path')>('node:path');
        return {
          ...actual,
          relative: () => '../outside',
        };
      });

      const { resolveSmithPath: resolveWithMock } = require('../../src/mcp/context') as typeof import('../../src/mcp/context');
      expect(() => resolveWithMock(root, 'safe/file.txt')).toThrow('Path must be inside .smith/');
    });
  });
});

import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSmith } from '../../src/smith/createSmith';

describe('createSmith', () => {
  let root: string;
  let output: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'smith-helper-'));
    output = join(root, 'out');
    mkdirSync(output, { recursive: true });
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('writes inside output root', () => {
    const smith = createSmith(
      { name: 'x', path: output, template: 't', cwd: root, root },
      { templateDir: join(root, 'tpl'), allowedRoots: [output, root] },
    );
    smith.fs.write(join(output, 'a.txt'), 'hi');
    expect(readFileSync(join(output, 'a.txt'), 'utf8')).toBe('hi');
  });

  it('throws when writing outside allowed roots', () => {
    const smith = createSmith(
      { name: 'x', path: output, template: 't', cwd: root, root },
      { templateDir: join(root, 'tpl'), allowedRoots: [output] },
    );
    expect(() => smith.fs.write('/tmp/forbidden.txt', 'nope')).toThrow(/outside allowed/);
  });
});

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
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

  it('supports append, copy, ensureDir, exists, template read, and path helpers', () => {
    const templateDir = join(root, 'tpl');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, 'partial.txt'), 'partial');
    writeFileSync(join(root, 'source.txt'), 'source');

    const smith = createSmith(
      { name: 'x', path: output, template: 't', cwd: root, root },
      { templateDir, allowedRoots: [output, root] },
    );

    smith.fs.ensureDir(join(output, 'nested'));
    smith.fs.append(join(output, 'log.txt'), 'line1\n');
    smith.fs.append(join(output, 'log.txt'), 'line2\n');
    smith.fs.copy(join(root, 'source.txt'), join(output, 'copied.txt'));

    expect(smith.fs.exists(join(output, 'copied.txt'))).toBe(true);
    expect(readFileSync(join(output, 'log.txt'), 'utf8')).toBe('line1\nline2\n');
    expect(smith.fs.read(join(output, 'copied.txt'))).toBe('source');
    expect(smith.template.read('partial.txt')).toBe('partial');

    const nestedFile = join(output, 'nested', 'file.txt');
    expect(smith.path.isInside(nestedFile, output)).toBe(true);
    expect(smith.path.fromRoot('a', 'b')).toBe(join(root, 'a', 'b'));
    expect(smith.path.fromCwd('a', 'b')).toBe(join(root, 'a', 'b'));
    expect(smith.path.toOutput('a', 'b')).toBe(join(output, 'a', 'b'));
    expect(smith.path.relative(output, nestedFile)).toBe('nested/file.txt');
    expect(smith.path.join('a', 'b')).toBe(join('a', 'b'));
    expect(smith.path.resolve('a', 'b')).toBe(join(process.cwd(), 'a', 'b'));
  });

  it('throws when copying outside allowed roots', () => {
    const smith = createSmith(
      { name: 'x', path: output, template: 't', cwd: root, root },
      { templateDir: join(root, 'tpl'), allowedRoots: [output] },
    );
    writeFileSync(join(root, 'source.txt'), 'source');

    expect(() => smith.fs.copy(join(root, 'source.txt'), '/tmp/forbidden.txt')).toThrow(
      /outside allowed/,
    );
  });
});

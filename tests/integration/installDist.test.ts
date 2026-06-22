import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cli = join(__dirname, '../../dist/cli.js');

describe('install from built dist', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'smith-dist-install-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('installs skills via dist/cli.js', () => {
    execFileSync('node', [cli, 'install', 'skills', '--local'], {
      cwd: root,
      encoding: 'utf8',
    });

    expect(existsSync(join(root, '.cursor', 'skills', 'smith', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(root, '.claude', 'skills', 'smith', 'SKILL.md'))).toBe(true);
  });
});

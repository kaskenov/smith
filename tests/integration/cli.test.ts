import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cli = join(__dirname, '../../src/cli.ts');
const bin = join(__dirname, '../../bin/smith.js');

function runCli(args: string[]): string {
  return execFileSync('node', ['-r', 'ts-node/register/transpile-only', cli, ...args], {
    encoding: 'utf8',
  });
}

function runBin(args: string[]): string {
  return execFileSync('node', [bin, ...args], { encoding: 'utf8' });
}

describe('cli smoke', () => {
  it('prints version', () => {
    const out = runCli(['--version']);
    expect(out).toContain('Never Send A Human To Do A Machine');
    expect(out).toContain('v');
  });

  it('prints version via bin entry', () => {
    const out = runBin(['--version']);
    expect(out).toContain('Never Send A Human To Do A Machine');
    expect(out).toContain('v');
  });

  it('prints help', () => {
    const out = runCli(['--help']);
    expect(out).toContain('replicate');
    expect(out).toContain('Global flags:');
    expect(out).toContain('Documentation:');
    expect(out).toContain('smith list');
  });

  it('prints replicate help with flag descriptions', () => {
    const out = runCli(['replicate', '--help']);
    expect(out).toContain('--name <name>');
    expect(out).toContain('--template <template>');
    expect(out).toContain('--path <path>');
    expect(out).toContain('Documentation:');
  });

  it('lists templates in a smith project', () => {
    const root = mkdtempSync(join(tmpdir(), 'smith-cli-list-'));
    try {
      const templatesDir = join(root, '.smith', 'templates', 'component');
      mkdirSync(templatesDir, { recursive: true });
      writeFileSync(join(templatesDir, '{{name}}.txt'), 'hello', 'utf8');
      const out = execFileSync('node', [join(__dirname, '../../dist/cli.js'), 'list'], {
        cwd: root,
        encoding: 'utf8',
      });
      expect(out.trim()).toBe('component');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('prints install help with skill names', () => {
    const out = runCli(['install', '--help']);
    expect(out).toContain('smith install skills');
    expect(out).toContain('Subcommands:');
    expect(out).toContain('Documentation:');
    expect(out).toContain('mcp');
  });

  it('install mcp --local --dry-run prints planned writes', () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'smith-cli-mcp-'));
    try {
      const out = execFileSync(
        'node',
        [join(__dirname, '../../dist/cli.js'), 'install', 'mcp', '--local', '--dry-run'],
        { cwd: tmpRoot, encoding: 'utf8' },
      );
      expect(out).toContain('Would write');
      expect(out).toContain('cli.js');
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

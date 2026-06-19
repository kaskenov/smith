import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
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
    expect(out).toContain('smith v');
  });

  it('prints version via bin entry', () => {
    const out = runBin(['--version']);
    expect(out).toContain('smith v');
  });

  it('prints help', () => {
    const out = runCli(['--help']);
    expect(out).toContain('replicate');
    expect(out).toContain('Global flags:');
    expect(out).toContain('Examples:');
  });

  it('prints replicate help with flag descriptions', () => {
    const out = runCli(['replicate', '--help']);
    expect(out).toContain('--name <name>');
    expect(out).toContain('--template <template>');
    expect(out).toContain('--path <path>');
    expect(out).toContain('Examples:');
  });

  it('prints install help with skill names', () => {
    const out = runCli(['install', '--help']);
    expect(out).toContain('smith-replicate');
    expect(out).toContain('install mcp');
    expect(out).toContain('install skills');
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

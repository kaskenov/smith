import { execFileSync } from 'node:child_process';
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
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runVersion } from '../../src/commands/version';

describe('runVersion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints package version and description', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
      version: string;
      description: string;
    };
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    runVersion();

    expect(logs[0]).toContain(`smith v${pkg.version}`);
    expect(logs[0]).toContain(pkg.description);
  });
});

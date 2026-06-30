import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runVersion } from '../../src/commands/version';
import { SMITH_TAGLINE } from '../../src/terminal/brand';
import * as bannerContextModule from '../../src/terminal/bannerContext';

describe('runVersion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints smith banner with description, project context, version, and update nudge', async () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
      version: string;
      description: string;
    };
    jest.spyOn(bannerContextModule, 'resolveSmithBannerContext').mockResolvedValue({
      projectContext: 'Project: demo · templates: component',
      updateAvailable: '9.9.9',
    });
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runVersion();

    expect(logs[0]).toContain(SMITH_TAGLINE);
    expect(logs[0]).toContain(pkg.description);
    expect(logs[0]).toContain('Project: demo · templates: component');
    expect(logs[0]).toContain(`v${pkg.version}`);
    expect(logs[0]).toContain('Update available: v9.9.9 → smith update');
  });
});

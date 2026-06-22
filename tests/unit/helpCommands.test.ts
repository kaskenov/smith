import {
  printGlobalHelp,
  printInstallHelp,
  printInstallMcpHelp,
  printInstallSkillsHelp,
  printUninstallHelp,
  printReplicateHelp,
} from '../../src/commands/help';

describe('help commands', () => {
  let logs: string[];

  beforeEach(() => {
    logs = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints global help', () => {
    printGlobalHelp();

    expect(logs.join('\n')).toContain('smith — I replicate');
    expect(logs.join('\n')).toContain('smith install --local');
    expect(logs.join('\n')).toContain('smith replicate --name Button --template component');
  });

  it('prints replicate help', () => {
    printReplicateHelp();

    expect(logs.join('\n')).toContain('smith replicate — create from template');
    expect(logs.join('\n')).toContain('--force');
    expect(logs.join('\n')).toContain('--skip');
  });

  it('prints install help', () => {
    printInstallHelp();

    expect(logs.join('\n')).toContain('smith install — agent tooling');
    expect(logs.join('\n')).toContain('--qwen');
    expect(logs.join('\n')).toContain('smith install skills');
  });

  it('prints install mcp help', () => {
    printInstallMcpHelp();

    expect(logs.join('\n')).toContain('smith install mcp — MCP server config');
    expect(logs.join('\n')).toContain('smith install mcp --qwen --local --dry-run');
  });

  it('prints install skills help', () => {
    printInstallSkillsHelp();

    expect(logs.join('\n')).toContain('smith install skills — optional agent skill');
    expect(logs.join('\n')).toContain('smith install skills --claude --dry-run');
  });

  it('prints uninstall help', () => {
    printUninstallHelp();

    expect(logs.join('\n')).toContain('smith uninstall — remove agent tooling');
    expect(logs.join('\n')).toContain('smith uninstall skills --qwen --dry-run');
  });
});

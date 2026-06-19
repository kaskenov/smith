import {
  printGlobalHelp,
  printInstallHelp,
  printInstallMcpHelp,
  printInstallSkillsHelp,
  printInstallUninstallHelp,
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
    expect(logs.join('\n')).toContain('smith install mcp --local');
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
    expect(logs.join('\n')).toContain('smith-replicate, smith-templates, smith-config');
  });

  it('prints install mcp help', () => {
    printInstallMcpHelp();

    expect(logs.join('\n')).toContain('smith install mcp — MCP server config');
    expect(logs.join('\n')).toContain('smith install mcp --qwen --local --dry-run');
  });

  it('prints install skills help', () => {
    printInstallSkillsHelp();

    expect(logs.join('\n')).toContain('smith install skills — agent skills');
    expect(logs.join('\n')).toContain('smith install skills --claude --dry-run');
  });

  it('prints install uninstall help', () => {
    printInstallUninstallHelp();

    expect(logs.join('\n')).toContain('smith install uninstall — remove agent tooling');
    expect(logs.join('\n')).toContain('smith install uninstall skills --qwen --dry-run');
  });
});

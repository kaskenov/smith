import {
  printGlobalDocs,
  printGlobalHelp,
  printInstallDocs,
  printInstallHelp,
  printInstallMcpDocs,
  printInstallMcpHelp,
  printInstallSkillsDocs,
  printInstallSkillsHelp,
  printListDocs,
  printListHelp,
  printReplicateDocs,
  printReplicateHelp,
  printUninstallDocs,
  printUninstallHelp,
  printUninstallMcpDocs,
  printUninstallMcpHelp,
  printUninstallSkillsDocs,
  printUninstallSkillsHelp,
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

  it('prints global help with documentation', async () => {
    await printGlobalHelp();

    const output = logs.join('\n');
    expect(output).toContain('Never Send A Human To Do A Machine');
    expect(output).toContain('Documentation:');
    expect(output).toContain('smith list');
    expect(output).toContain('Project setup');
    expect(output).not.toContain('Examples:');
  });

  it('prints replicate help with documentation', () => {
    printReplicateHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith replicate — create from template');
    expect(output).toContain('--force');
    expect(output).toContain('Documentation:');
    expect(output).toContain('Nested templates');
    expect(output).not.toContain('Examples:');
  });

  it('prints list help with documentation', () => {
    printListHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith list — project templates');
    expect(output).toContain('Documentation:');
    expect(output).toContain('smith install list');
    expect(output).not.toContain('Examples:');
  });

  it('prints install help with documentation', () => {
    printInstallHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith install — agent tooling');
    expect(output).toContain('--qwen');
    expect(output).toContain('Documentation:');
    expect(output).toContain('MCP config paths');
    expect(output).not.toContain('Examples:');
  });

  it('prints install mcp help with documentation', () => {
    printInstallMcpHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith install mcp — MCP server config');
    expect(output).toContain('Documentation:');
    expect(output).not.toContain('Examples:');
  });

  it('prints install skills help with documentation', () => {
    printInstallSkillsHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith install skills — optional agent skill');
    expect(output).toContain('Documentation:');
    expect(output).not.toContain('Examples:');
  });

  it('prints uninstall help with documentation', () => {
    printUninstallHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith uninstall — remove agent tooling');
    expect(output).toContain('Documentation:');
    expect(output).not.toContain('Examples:');
  });

  it('prints uninstall mcp help with documentation', () => {
    printUninstallMcpHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith uninstall mcp — remove MCP server config');
    expect(output).toContain('Documentation:');
    expect(output).not.toContain('Examples:');
  });

  it('prints uninstall skills help with documentation', () => {
    printUninstallSkillsHelp();

    const output = logs.join('\n');
    expect(output).toContain('smith uninstall skills — remove agent skills');
    expect(output).toContain('Documentation:');
    expect(output).not.toContain('Examples:');
  });

  it('re-exports documentation helpers from docs', () => {
    printGlobalDocs();
    printReplicateDocs();
    printListDocs();
    printInstallDocs();
    printInstallMcpDocs();
    printInstallSkillsDocs();
    printUninstallDocs();
    printUninstallMcpDocs();
    printUninstallSkillsDocs();

    const output = logs.join('\n');
    expect(output).toContain('Documentation:');
    expect(output).toContain('Project setup');
    expect(output).toContain('MCP config paths');
  });
});

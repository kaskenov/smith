export function printDocSection(title: string, lines: string[]): void {
  console.log(title);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  console.log('');
}

export function printGlobalDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Project setup', [
    'Create .smith/ at the project root:',
    '  .smith/config.js',
    '  .smith/templates/<template>/...',
    '',
    'Root config uses createSmithConfig for shared variables, placeholders, and hooks.',
    'Template folders can add config.js to override rootDir, variables, and local hooks.',
  ]);
  printDocSection('List templates', [
    'smith list',
    '',
    'Lists template folder names under .smith/templates/ in the current smith project.',
  ]);
  printDocSection('Replicate', [
    'smith replicate --name <name> --template <template> [--path <path>] [--preset <preset>] [--force] [--skip]',
    'smith r ...',
    '',
    '--name      Source value for template variables (required)',
    '--template  Template folder under .smith/templates/ (required)',
    '--path      Output root directory',
    '--preset    Preset name from template config',
    '--force     Overwrite existing files',
    '--skip      Keep existing files',
    '',
    'Hook order: root before → template before → replicate → template after → root after.',
    'See: smith replicate --help',
  ]);
  printDocSection('Install agent tooling', [
    'smith install [--local|--global] [--cursor|--claude|--qwen] [--force] [--dry-run]',
    'smith install mcp ...',
    'smith install skills ...',
    'smith install list ...',
    '',
    'Installs the smith MCP server and optional agent skills for Cursor, Claude Code, and Qwen Code.',
    'Default: all agents, project scope (--local).',
    'See: smith install --help',
  ]);
  printDocSection('Uninstall', [
    'smith uninstall mcp [--local|--global] [--cursor|--claude|--qwen] [--dry-run]',
    'smith uninstall skills ...',
    '',
    'Removes smith MCP config or agent skills from selected agents and scope.',
    'See: smith uninstall --help',
  ]);
  printDocSection('Update', [
    'smith update',
    '',
    'Updates @kaskenov/smith and refreshes installed MCP and skills when a newer version is available.',
  ]);
}

export function printReplicateDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Generates files from a template folder under .smith/templates/.',
    'Placeholder substitution runs in file names and file contents.',
  ]);
  printDocSection('Required flags', [
    '--name <name>       Value exposed to template variables (e.g. Button, card-item)',
    '--template <name>   Template folder name under .smith/templates/',
  ]);
  printDocSection('Optional flags', [
    '--path <path>       Override output root for generated files',
    '--preset <preset>   Preset from template config (include/exclude file patterns)',
    '--force             Overwrite conflicting files',
    '--skip              Keep existing conflicting files',
  ]);
  printDocSection('Template config', [
    'Each template may define .smith/templates/<template>/config.js.',
    'Local config merges with root .smith/config.js.',
    'Variables with the same key are overridden by the template.',
    'Use defaultPreset and presets in config to filter which files replicate.',
  ]);
  printDocSection('Nested templates', [
    'Templates can use nested folders and placeholders in directory names, e.g.:',
    '  templates/feature/{{NAME_PASCAL}}/{{NAME_KEBAB}}/{{name}}.txt',
  ]);
  printDocSection('Discover templates', [
    'smith list',
    '',
    'Lists available template folders in the current smith project.',
  ]);
}

export function printListDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Usage', [
    'smith list',
    '',
    'Walks up from the current directory to find .smith/ and prints template folder names',
    'from .smith/templates/, sorted alphabetically.',
  ]);
  printDocSection('Output', [
    'One template name per line. If no templates exist, prints a short empty message.',
    'If not inside a smith project, exits with an error.',
  ]);
  printDocSection('Related commands', [
    'smith replicate --name <name> --template <template>',
    'smith install list   (shows installed MCP/skills, not project templates)',
  ]);
}

export function printInstallDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Installs smith MCP server config and optional agent skills.',
    'Targets Cursor, Claude Code, and Qwen Code unless narrowed with agent flags.',
  ]);
  printDocSection('Subcommands', [
    'mcp      Install smith MCP server (default when subcommand omitted)',
    'skills   Copy optional smith agent skill into agent skill directories',
    'list     Show installed MCP entries and skills per agent/scope',
  ]);
  printDocSection('Scope', [
    '--local   Project scope (default): .cursor/, .claude/, .qwen/ under cwd',
    '--global  User home scope: ~/.cursor/, ~/.claude/, ~/.qwen/',
  ]);
  printDocSection('MCP config paths', [
    'Cursor local:  .cursor/mcp.json',
    'Cursor global: ~/.cursor/mcp.json',
    'Claude local:  .mcp.json + .claude/settings.local.json',
    'Claude global: ~/.claude.json',
    'Qwen local:    .qwen/settings.json (mcpServers)',
    'Qwen global:   ~/.qwen/settings.json',
  ]);
  printDocSection('Skills', [
    'smith install skills copies the bundled smith skill (replicate, templates, config, MCP reference).',
    'Cursor:  .cursor/skills/ or ~/.cursor/skills/',
    'Claude:  .claude/skills/ or ~/.claude/skills/',
    'Qwen:    .qwen/skills/ or ~/.qwen/skills/',
  ]);
  printDocSection('Verify install', [
    'Cursor: reload window, check MCP settings',
    'Claude: /mcp in a new session',
    'Qwen:   qwen mcp list',
    'smith install list --local',
  ]);
}

export function printInstallMcpDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Registers the smith MCP server (smith mcp stdio) in agent MCP config files.',
    'Uses an absolute path to node + dist/cli.js so GUI apps can spawn the server reliably.',
  ]);
  printDocSection('Usage', [
    'smith install [flags]',
    'smith install mcp [flags]',
  ]);
  printDocSection('Flags', [
    '--cursor --claude --qwen   Target one agent (default: all)',
    '--local --global           Project or user scope',
    '--force                    Overwrite existing smith MCP entry',
    '--dry-run                  Print planned writes without changing files',
  ]);
}

export function printInstallSkillsDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Copies the optional smith agent skill for better discovery of replicate, templates, and MCP tools.',
    'MCP alone is usually enough; skills help agent onboarding.',
  ]);
  printDocSection('Usage', [
    'smith install skills [--cursor|--claude|--qwen] [--local|--global] [--force] [--dry-run]',
  ]);
  printDocSection('Skill installed', [
    'smith — replicate, templates, config, and MCP tool reference',
  ]);
}

export function printUninstallDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Removes smith MCP server config or agent skills from selected agents and scope.',
  ]);
  printDocSection('Subcommands', [
    'mcp      Remove smith MCP server entry from agent config',
    'skills   Remove smith skill directories',
  ]);
  printDocSection('Flags', [
    '--cursor --claude --qwen   Target one agent (default: all)',
    '--local --global           Project or user scope',
    '--dry-run                  Print actions without modifying files',
  ]);
}

export function printUninstallMcpDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Removes the smith MCP server entry from agent MCP config for the selected scope.',
  ]);
  printDocSection('Usage', [
    'smith uninstall mcp [--cursor|--claude|--qwen] [--local|--global] [--dry-run]',
  ]);
}

export function printUninstallSkillsDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Removes smith skill directories from agent skill paths for the selected scope.',
  ]);
  printDocSection('Usage', [
    'smith uninstall skills [--cursor|--claude|--qwen] [--local|--global] [--dry-run]',
  ]);
}

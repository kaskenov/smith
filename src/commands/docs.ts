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
    'Create .smith/ at the project root (or run smith init):',
    '  .smith/config.js',
    '  .smith/templates/<template>/...',
    '',
    'Root config uses createSmithConfig (@kaskenov/smith/config) for shared variables, placeholders, and hooks.',
    'Template folders can add config.js to override rootDir, variables, and local hooks.',
  ]);
  printDocSection('Global templates', [
    'User store at ~/.smith/:',
    '  config.js              shared variables (NAME_PASCAL, NAME_KEBAB, ...)',
    '  templates/<template>/  global templates',
    '  sources.json           recorded add --from metadata',
    '',
    'smith templates add <name> --from <path|git>',
    'smith templates list | remove | update | init-config',
    'See: smith templates --help',
  ]);
  printDocSection('List templates', [
    'smith list',
    '',
    'Lists local project templates and global ~/.smith/templates (source marked).',
  ]);
  printDocSection('Replicate', [
    'smith replicate --name <name> --template <template> [--path <path>] [--preset <preset>] [--force] [--skip]',
    'smith r ...',
    '',
    '--name      Source value for template variables (required)',
    '--template  Local or global template name (required)',
    '--path      Output root directory',
    '--preset    Preset name from template config',
    '--force     Overwrite existing files',
    '--skip      Keep existing files',
    '',
    'Resolves local .smith/templates first, then ~/.smith/templates.',
    'Works without a project .smith/ when the template is global.',
    'Config merge: global → project → template.',
    'Hook order: global before → project before → template before → replicate → afters reverse.',
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
    'smith uninstall list ...',
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
    'Generates files from a local or global template folder.',
    'Placeholder substitution runs in file names and file contents.',
  ]);
  printDocSection('Required flags', [
    '--name <name>       Value exposed to template variables (e.g. Button, card-item)',
    '--template <name>   Local (.smith/templates) or global (~/.smith/templates) name',
  ]);
  printDocSection('Optional flags', [
    '--path <path>       Override output root for generated files',
    '--preset <preset>   Preset from template config (include/exclude file patterns)',
    '--force             Overwrite conflicting files',
    '--skip              Keep existing conflicting files',
  ]);
  printDocSection('Conflict resolution', [
    'When a destination file already exists and neither --force nor --skip is set,',
    'smith shows a 3-way preview (existing, incoming, unified diff) and prompts:',
    '  Keep existing file | Overwrite with template | Merge in editor | Abort',
    'Merge opens your $EDITOR with git-style conflict markers to combine both versions.',
    'In non-interactive mode (no TTY), use --force or --skip.',
  ]);
  printDocSection('Config merge', [
    'Layers: ~/.smith/config.js → project .smith/config.js → template config.js.',
    'Later layers override variables, placeholder, rootDir, and presets.',
    'Hooks: global before → project before → template before → replicate → afters reverse.',
    'A project .smith/ is optional when using a global template.',
  ]);
  printDocSection('Nested templates', [
    'Templates can use nested folders and placeholders in directory names, e.g.:',
    '  templates/feature/{{NAME_PASCAL}}/{{NAME_KEBAB}}/{{name}}.txt',
  ]);
  printDocSection('Discover templates', [
    'smith list',
    'smith templates list',
  ]);
}

export function printListDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Usage', [
    'smith list',
    '',
    'Lists project templates (if inside a smith project) and global ~/.smith/templates.',
    'Local names win when both exist.',
  ]);
  printDocSection('Output', [
    'One line per template: <name> (local|global).',
    'If none exist, prints a short empty message.',
  ]);
  printDocSection('Related commands', [
    'smith templates add <name> --from <path|git>',
    'smith replicate --name <name> --template <template>',
    'smith install list   (shows installed MCP/skills, not project templates)',
  ]);
}

export function printTemplatesDocs(): void {
  console.log('Documentation:');
  console.log('');
  printDocSection('Overview', [
    'Manages the user-global template store under ~/.smith/.',
    'Global config.js provides shared variables such as NAME_PASCAL and NAME_KEBAB.',
  ]);
  printDocSection('Add', [
    'smith templates add <name> --from <path|git> [--path <sub>] [--ref <ref>] [--force]',
    '',
    '--from path   Copy an existing directory (including npm package folders)',
    '--from git    Shallow-clone a git URL, then copy the template folder',
    '--path        Subdirectory inside the source that is the template',
    '--ref         Git branch or tag',
    '--force       Overwrite an existing global template',
  ]);
  printDocSection('Other subcommands', [
    'list          Local + global templates with source markers',
    'remove        Delete a global template and its sources.json entry',
    'update        Re-fetch from recorded sources (one name or all)',
    'init-config   Write ~/.smith/config.js starter if missing',
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
    'list     Show installed MCP/skills status (same as install list)',
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

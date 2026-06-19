import { brandSmith } from '../../terminal/brand';

const AGENT_FLAGS = `  --cursor            Target Cursor only (default: all agents)
  --claude            Target Claude Code only (default: all agents)
  --qwen              Target Qwen Code only (default: all agents)`;

export function printInstallHelp(): void {
  console.log(brandSmith('smith install — agent tooling'));
  console.log('');
  console.log('Usage:');
  console.log('  smith install <subcommand> [flags]');
  console.log('');
  console.log('Subcommands:');
  console.log('  mcp                 Install smith MCP server config');
  console.log('  skills              Install smith agent skills');
  console.log('  list                Show installed MCP and skills');
  console.log('  uninstall mcp       Remove smith MCP server config');
  console.log('  uninstall skills    Remove smith agent skills');
  console.log('');
  console.log('Shared flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --force             Overwrite conflicting MCP config');
  console.log('  --dry-run           Print actions without writing files');
  console.log('  -h, --help          Show help');
  console.log('');
  console.log('Skills installed together:');
  console.log('  smith-replicate, smith-templates, smith-config');
  console.log('');
  console.log('Examples:');
  console.log('  smith install mcp --local');
  console.log('  smith install skills --qwen --global');
  console.log('  smith install list --claude');
  console.log('  smith install uninstall mcp --dry-run');
}

export function printInstallMcpHelp(): void {
  console.log(brandSmith('smith install mcp — MCP server config'));
  console.log('');
  console.log('Usage:');
  console.log('  smith install mcp [--cursor|--claude|--qwen] [--local|--global] [--force] [--dry-run]');
  console.log('');
  console.log('Flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --force             Overwrite conflicting smith MCP entry');
  console.log('  --dry-run           Print config without writing files');
  console.log('  -h, --help          Show install mcp help');
  console.log('');
  console.log('Examples:');
  console.log('  smith install mcp --local');
  console.log('  smith install mcp --qwen --local --dry-run');
  console.log('  smith install mcp --cursor --global --force');
}

export function printInstallSkillsHelp(): void {
  console.log(brandSmith('smith install skills — agent skills'));
  console.log('');
  console.log('Usage:');
  console.log('  smith install skills [--cursor|--claude|--qwen] [--local|--global] [--force] [--dry-run]');
  console.log('');
  console.log('Flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --force             Overwrite existing skill directories');
  console.log('  --dry-run           Print target paths without copying skills');
  console.log('  -h, --help          Show install skills help');
  console.log('');
  console.log('Skills installed together:');
  console.log('  smith-replicate, smith-templates, smith-config');
  console.log('');
  console.log('Examples:');
  console.log('  smith install skills --local');
  console.log('  smith install skills --qwen --global');
  console.log('  smith install skills --claude --dry-run');
}

export function printInstallUninstallHelp(): void {
  console.log(brandSmith('smith install uninstall — remove agent tooling'));
  console.log('');
  console.log('Usage:');
  console.log('  smith install uninstall mcp [flags]');
  console.log('  smith install uninstall skills [flags]');
  console.log('');
  console.log('Flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --dry-run           Print actions without modifying files');
  console.log('  -h, --help          Show uninstall help');
  console.log('');
  console.log('Examples:');
  console.log('  smith install uninstall mcp --local');
  console.log('  smith install uninstall skills --qwen --dry-run');
}

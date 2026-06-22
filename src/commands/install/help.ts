import { brandSmith } from '../../terminal/brand';

const AGENT_FLAGS = `  --cursor            Target Cursor only (default: all agents)
  --claude            Target Claude Code only (default: all agents)
  --qwen              Target Qwen Code only (default: all agents)`;

export function printInstallHelp(): void {
  console.log(brandSmith('smith install — agent tooling'));
  console.log('');
  console.log('Usage:');
  console.log('  smith install [flags]              Install smith MCP (default)');
  console.log('  smith install <subcommand> [flags]');
  console.log('');
  console.log('Subcommands:');
  console.log('  mcp                 Install smith MCP server config (same as default)');
  console.log('  skills              Install optional smith agent skill');
  console.log('  list                Show installed MCP and skills');
  console.log('');
  console.log('Shared flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --force             Overwrite conflicting MCP config or skill directory');
  console.log('  --dry-run           Print actions without writing files');
  console.log('  -h, --help          Show help');
  console.log('');
  console.log('Optional skill:');
  console.log('  smith — agent guide for smith projects (install with: smith install skills)');
  console.log('');
  console.log('Examples:');
  console.log('  smith install --local');
  console.log('  smith install mcp --qwen --global');
  console.log('  smith install skills --cursor');
  console.log('  smith install list --claude');
}

export function printInstallMcpHelp(): void {
  console.log(brandSmith('smith install mcp — MCP server config'));
  console.log('');
  console.log('Usage:');
  console.log('  smith install [flags]');
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
  console.log('  smith install --local');
  console.log('  smith install mcp --qwen --local --dry-run');
  console.log('  smith install mcp --cursor --global --force');
}

export function printInstallSkillsHelp(): void {
  console.log(brandSmith('smith install skills — optional agent skill'));
  console.log('');
  console.log('Usage:');
  console.log('  smith install skills [--cursor|--claude|--qwen] [--local|--global] [--force] [--dry-run]');
  console.log('');
  console.log('Flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --force             Overwrite existing skill directory');
  console.log('  --dry-run           Print target paths without copying skill');
  console.log('  -h, --help          Show install skills help');
  console.log('');
  console.log('Skill installed:');
  console.log('  smith — replicate, templates, config, and MCP tool reference');
  console.log('');
  console.log('Examples:');
  console.log('  smith install skills --local');
  console.log('  smith install skills --qwen --global');
  console.log('  smith install skills --claude --dry-run');
}

import { brandSmith } from '../../terminal/brand';

const AGENT_FLAGS = `  --cursor            Target Cursor only (default: all agents)
  --claude            Target Claude Code only (default: all agents)
  --qwen              Target Qwen Code only (default: all agents)`;

export function printUninstallHelp(): void {
  console.log(brandSmith('smith uninstall — remove agent tooling'));
  console.log('');
  console.log('Usage:');
  console.log('  smith uninstall <subcommand> [flags]');
  console.log('');
  console.log('Subcommands:');
  console.log('  mcp                 Remove smith MCP server config');
  console.log('  skills              Remove smith agent skills');
  console.log('');
  console.log('Shared flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --dry-run           Print actions without modifying files');
  console.log('  -h, --help          Show help');
  console.log('');
  console.log('Examples:');
  console.log('  smith uninstall mcp --local');
  console.log('  smith uninstall skills --qwen --dry-run');
}

export function printUninstallMcpHelp(): void {
  console.log(brandSmith('smith uninstall mcp — remove MCP server config'));
  console.log('');
  console.log('Usage:');
  console.log('  smith uninstall mcp [--cursor|--claude|--qwen] [--local|--global] [--dry-run]');
  console.log('');
  console.log('Flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --dry-run           Print actions without modifying files');
  console.log('  -h, --help          Show uninstall mcp help');
  console.log('');
  console.log('Examples:');
  console.log('  smith uninstall mcp --local');
  console.log('  smith uninstall mcp --cursor --global --dry-run');
}

export function printUninstallSkillsHelp(): void {
  console.log(brandSmith('smith uninstall skills — remove agent skills'));
  console.log('');
  console.log('Usage:');
  console.log('  smith uninstall skills [--cursor|--claude|--qwen] [--local|--global] [--dry-run]');
  console.log('');
  console.log('Flags:');
  console.log(AGENT_FLAGS);
  console.log('  --local             Project scope (default)');
  console.log('  --global            User home scope');
  console.log('  --dry-run           Print actions without modifying files');
  console.log('  -h, --help          Show uninstall skills help');
  console.log('');
  console.log('Examples:');
  console.log('  smith uninstall skills --local');
  console.log('  smith uninstall skills --claude --dry-run');
}

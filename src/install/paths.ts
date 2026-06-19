import { homedir } from 'node:os';
import { join } from 'node:path';
import type { InstallAgent, InstallScope, InstallFlags } from './types';

const AGENT_DIRS: Record<InstallAgent, string> = {
  cursor: '.cursor',
  claude: '.claude',
  qwen: '.qwen',
};

export function resolveScope(flags: InstallFlags): InstallScope {
  if (flags.global && flags.local) {
    throw new Error('Use either --global or --local, not both.');
  }
  if (flags.global) return 'global';
  return 'local';
}

function getAgentBaseDir(agent: InstallAgent, scope: InstallScope, cwd: string): string {
  const dirName = AGENT_DIRS[agent];
  return scope === 'global' ? join(homedir(), dirName) : join(cwd, dirName);
}

export function getSkillsDir(agent: InstallAgent, scope: InstallScope, cwd: string): string {
  return join(getAgentBaseDir(agent, scope, cwd), 'skills');
}

export function getMcpConfigTarget(agent: InstallAgent, scope: InstallScope, cwd: string): string {
  if (agent === 'cursor') {
    return join(getAgentBaseDir('cursor', scope, cwd), 'mcp.json');
  }
  if (agent === 'claude') {
    return scope === 'global' ? join(homedir(), '.claude.json') : join(cwd, '.mcp.json');
  }
  return join(getAgentBaseDir('qwen', scope, cwd), 'settings.json');
}

export function getClaudeSettingsLocalPath(cwd: string): string {
  return join(cwd, '.claude', 'settings.local.json');
}

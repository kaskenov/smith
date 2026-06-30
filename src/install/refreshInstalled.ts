import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { runInstallMcp } from '../commands/install/mcp';
import { runInstallSkills } from '../commands/install/skills';
import { ALL_INSTALL_AGENTS } from './agents';
import { SMITH_MCP_SERVER_KEY, SMITH_SKILL_NAMES } from './constants';
import { readJsonFile } from './jsonConfig';
import type { McpConfigFile } from './mcpConfigFile';
import { getMcpConfigTarget, getSkillsDir } from './paths';
import type { InstallAgent, InstallFlags, InstallScope } from './types';

function isSmithMcpInstalled(agent: InstallAgent, scope: InstallScope, cwd: string): boolean {
  const mcpPath = getMcpConfigTarget(agent, scope, cwd);
  const config = readJsonFile<McpConfigFile>(mcpPath, {});
  return config.mcpServers?.[SMITH_MCP_SERVER_KEY] !== undefined;
}

function hasInstalledSkills(agent: InstallAgent, scope: InstallScope, cwd: string): boolean {
  const skillsDir = getSkillsDir(agent, scope, cwd);
  return SMITH_SKILL_NAMES.some((name) => existsSync(join(skillsDir, name)));
}

function agentFlags(agents: InstallAgent[]): InstallFlags {
  return {
    cursor: agents.includes('cursor'),
    claude: agents.includes('claude'),
    qwen: agents.includes('qwen'),
  };
}

function scopeFlags(scope: InstallScope): InstallFlags {
  return scope === 'global' ? { global: true } : { local: true };
}

export async function refreshInstalledSmithTooling(cwd = process.cwd()): Promise<void> {
  const scopes: InstallScope[] = ['local', 'global'];

  for (const scope of scopes) {
    const mcpAgents = ALL_INSTALL_AGENTS.filter((agent) => isSmithMcpInstalled(agent, scope, cwd));
    if (mcpAgents.length > 0) {
      await runInstallMcp({
        ...scopeFlags(scope),
        ...agentFlags(mcpAgents),
        force: true,
        cwd,
      });
    }

    const skillAgents = ALL_INSTALL_AGENTS.filter((agent) => hasInstalledSkills(agent, scope, cwd));
    if (skillAgents.length > 0) {
      await runInstallSkills({
        ...scopeFlags(scope),
        ...agentFlags(skillAgents),
        force: true,
        cwd,
      });
    }
  }
}

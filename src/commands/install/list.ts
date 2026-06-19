import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { resolveAgents } from '../../install/agents';
import { SMITH_MCP_SERVER_KEY, SMITH_SKILL_NAMES } from '../../install/constants';
import { readJsonFile } from '../../install/jsonConfig';
import type { McpConfigFile } from '../../install/mcpConfigFile';
import { getMcpConfigTarget, getSkillsDir, resolveScope } from '../../install/paths';
import type { InstallAgent, InstallFlags, InstallScope } from '../../install/types';

function isSmithMcpInstalled(agent: InstallAgent, scope: InstallScope, cwd: string): boolean {
  const mcpPath = getMcpConfigTarget(agent, scope, cwd);
  const config = readJsonFile<McpConfigFile>(mcpPath, {});
  return config.mcpServers?.[SMITH_MCP_SERVER_KEY] !== undefined;
}

function getInstalledSkills(agent: InstallAgent, scope: InstallScope, cwd: string): string[] {
  const skillsDir = getSkillsDir(agent, scope, cwd);
  return SMITH_SKILL_NAMES.filter((name) => existsSync(join(skillsDir, name)));
}

export async function runInstallList(flags: InstallFlags): Promise<void> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);

  for (const agent of agents) {
    const mcpInstalled = isSmithMcpInstalled(agent, scope, cwd);
    const skills = getInstalledSkills(agent, scope, cwd);

    console.log(`${agent} ${scope}:`);
    console.log(`  MCP smith: ${mcpInstalled ? 'yes' : 'no'}`);
    if (skills.length === 0) {
      console.log('  skills: (none)');
    } else {
      console.log(`  skills: ${skills.join(', ')}`);
    }
  }
}

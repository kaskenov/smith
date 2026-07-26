import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { SMITH_MCP_SERVER_KEY, SMITH_SKILL_NAMES } from './constants';
import { readJsonFile } from './jsonConfig';
import type { McpConfigFile } from './mcpConfigFile';
import { getMcpConfigTarget, getSkillsDir } from './paths';
import type { InstallAgent, InstallScope } from './types';

export function isSmithMcpInstalled(agent: InstallAgent, scope: InstallScope, cwd: string): boolean {
  const mcpPath = getMcpConfigTarget(agent, scope, cwd);
  const config = readJsonFile<McpConfigFile>(mcpPath, {});
  return config.mcpServers?.[SMITH_MCP_SERVER_KEY] !== undefined;
}

export function getInstalledSkills(agent: InstallAgent, scope: InstallScope, cwd: string): string[] {
  const skillsDir = getSkillsDir(agent, scope, cwd);
  return SMITH_SKILL_NAMES.filter((name) => existsSync(join(skillsDir, name)));
}

export function hasInstalledSkills(agent: InstallAgent, scope: InstallScope, cwd: string): boolean {
  return getInstalledSkills(agent, scope, cwd).length > 0;
}

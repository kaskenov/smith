import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { resolveAgents } from '../../install/agents';
import { removeClaudeMcpEnablement } from '../../install/claudeSettings';
import { SMITH_MCP_SERVER_KEY, SMITH_SKILL_NAMES } from '../../install/constants';
import { readJsonFile, writeJsonFile } from '../../install/jsonConfig';
import { defaultMcpConfigFile, type McpConfigFile } from '../../install/mcpConfigFile';
import { removeMcpServer } from '../../install/mergeMcpConfig';
import {
  getClaudeSettingsLocalPath,
  getMcpConfigTarget,
  getSkillsDir,
  resolveScope,
} from '../../install/paths';
import type { InstallAgent, InstallFlags, InstallScope } from '../../install/types';
import { brandSmith } from '../../terminal/brand';

export async function runUninstallMcp(flags: InstallFlags): Promise<void> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);

  for (const agent of agents) {
    await uninstallMcpForAgent(agent, scope, cwd, flags);
  }
}

async function uninstallMcpForAgent(
  agent: InstallAgent,
  scope: InstallScope,
  cwd: string,
  flags: InstallFlags,
): Promise<void> {
  const mcpPath = getMcpConfigTarget(agent, scope, cwd);
  const existing = readJsonFile<McpConfigFile>(mcpPath, defaultMcpConfigFile(agent, scope));
  const mcpServers = existing.mcpServers ?? {};
  const removeResult = removeMcpServer(mcpServers, SMITH_MCP_SERVER_KEY);

  if (agent === 'claude' && scope === 'local') {
    await uninstallClaudeLocalMcp(mcpPath, cwd, flags, existing, removeResult);
    return;
  }

  const output: McpConfigFile = { ...existing, mcpServers: removeResult.merged };

  if (flags.dryRun) {
    if (removeResult.changed) {
      console.log(`Would write ${mcpPath}`, JSON.stringify(output, null, 2));
    }
    return;
  }

  if (!removeResult.changed) {
    console.log(brandSmith(`smith MCP not installed at ${mcpPath}`));
    return;
  }

  writeJsonFile(mcpPath, output);
  console.log(brandSmith(`smith uninstalled MCP from ${mcpPath}`));
}

async function uninstallClaudeLocalMcp(
  mcpPath: string,
  cwd: string,
  flags: InstallFlags,
  existing: McpConfigFile,
  removeResult: ReturnType<typeof removeMcpServer>,
): Promise<void> {
  const mcpOutput: McpConfigFile = { ...existing, mcpServers: removeResult.merged };

  const settingsPath = getClaudeSettingsLocalPath(cwd);
  const existingSettings = readJsonFile<Record<string, unknown>>(settingsPath, {});
  const settingsOutput = removeClaudeMcpEnablement(existingSettings, SMITH_MCP_SERVER_KEY);
  const settingsChanged =
    JSON.stringify(existingSettings) !== JSON.stringify(settingsOutput);

  if (flags.dryRun) {
    if (removeResult.changed) {
      console.log(`Would write ${mcpPath}`, JSON.stringify(mcpOutput, null, 2));
    }
    if (settingsChanged) {
      console.log(`Would write ${settingsPath}`, JSON.stringify(settingsOutput, null, 2));
    }
    return;
  }

  if (!removeResult.changed && !settingsChanged) {
    console.log(brandSmith(`smith MCP not installed at ${mcpPath}`));
    return;
  }

  if (removeResult.changed) {
    writeJsonFile(mcpPath, mcpOutput);
  }
  if (settingsChanged) {
    writeJsonFile(settingsPath, settingsOutput);
  }

  console.log(brandSmith(`smith uninstalled MCP from ${mcpPath}`));
}

export async function runUninstallSkills(flags: InstallFlags): Promise<void> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);

  for (const agent of agents) {
    const skillsDir = getSkillsDir(agent, scope, cwd);
    let removedAny = false;

    for (const name of SMITH_SKILL_NAMES) {
      const skillPath = join(skillsDir, name);
      if (!existsSync(skillPath)) {
        continue;
      }

      if (flags.dryRun) {
        console.log(`Would remove skill ${skillPath}`);
        continue;
      }

      rmSync(skillPath, { recursive: true, force: true });
      removedAny = true;
    }

    if (flags.dryRun) {
      continue;
    }

    if (removedAny) {
      console.log(brandSmith(`smith uninstalled skills from ${skillsDir}`));
    } else {
      console.log(brandSmith(`smith skills not installed at ${skillsDir}`));
    }
  }
}

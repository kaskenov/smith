import { resolveAgents } from '../../install/agents';
import { mergeClaudeMcpEnablement } from '../../install/claudeSettings';
import { SMITH_MCP_SERVER_KEY } from '../../install/constants';
import { readJsonFile, writeJsonFile } from '../../install/jsonConfig';
import { defaultMcpConfigFile, type McpConfigFile } from '../../install/mcpConfigFile';
import { mergeMcpServers, type McpServerConfig } from '../../install/mergeMcpConfig';
import {
  getClaudeSettingsLocalPath,
  getMcpConfigTarget,
  resolveScope,
} from '../../install/paths';
import { resolveSmithMcpEntry } from '../../install/resolveSmithMcpEntry';
import type { InstallAgent, InstallFlags, InstallScope } from '../../install/types';
import { brandSmith } from '../../terminal/brand';

function smithEntry(): McpServerConfig {
  return resolveSmithMcpEntry();
}

function checkConflict(
  result: { conflict: boolean },
  path: string,
  force?: boolean,
): void {
  if (result.conflict && !force) {
    throw new Error(
      `MCP server '${SMITH_MCP_SERVER_KEY}' at ${path} is configured differently. Use --force to overwrite.`,
    );
  }
}

export async function runInstallMcp(flags: InstallFlags): Promise<void> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);
  const entry = smithEntry();

  for (const agent of agents) {
    await installMcpForAgent(agent, scope, cwd, flags, entry);
  }
}

async function installMcpForAgent(
  agent: InstallAgent,
  scope: InstallScope,
  cwd: string,
  flags: InstallFlags,
  entry: McpServerConfig,
): Promise<void> {
  const mcpPath = getMcpConfigTarget(agent, scope, cwd);

  if (agent === 'claude' && scope === 'local') {
    await installClaudeLocalMcp(mcpPath, cwd, flags, entry);
    return;
  }

  const isClaudeGlobal = agent === 'claude' && scope === 'global';
  const existing = readJsonFile<McpConfigFile>(
    mcpPath,
    isClaudeGlobal ? {} : defaultMcpConfigFile(agent, scope),
  );
  const mcpServers = existing.mcpServers ?? {};
  const mergeResult = mergeMcpServers(mcpServers, SMITH_MCP_SERVER_KEY, entry, {
    force: flags.force,
  });

  checkConflict(mergeResult, mcpPath, flags.force);

  const output: McpConfigFile = { ...existing, mcpServers: mergeResult.merged };

  if (flags.dryRun) {
    console.log(`Would write ${mcpPath}`, JSON.stringify(output, null, 2));
    return;
  }

  if (!mergeResult.changed) {
    console.log(brandSmith(`smith MCP already installed at ${mcpPath}`));
    return;
  }

  writeJsonFile(mcpPath, output);
  console.log(brandSmith(`smith installed MCP at ${mcpPath}`));
}

async function installClaudeLocalMcp(
  mcpPath: string,
  cwd: string,
  flags: InstallFlags,
  entry: McpServerConfig,
): Promise<void> {
  const existingMcp = readJsonFile<McpConfigFile>(mcpPath, { mcpServers: {} });
  const mcpServers = existingMcp.mcpServers ?? {};
  const mergeResult = mergeMcpServers(mcpServers, SMITH_MCP_SERVER_KEY, entry, {
    force: flags.force,
  });

  checkConflict(mergeResult, mcpPath, flags.force);

  const mcpOutput: McpConfigFile = { ...existingMcp, mcpServers: mergeResult.merged };

  const settingsPath = getClaudeSettingsLocalPath(cwd);
  const existingSettings = readJsonFile<Record<string, unknown>>(settingsPath, {});
  const settingsOutput = mergeClaudeMcpEnablement(existingSettings, SMITH_MCP_SERVER_KEY);
  const settingsChanged =
    JSON.stringify(existingSettings) !== JSON.stringify(settingsOutput);

  if (flags.dryRun) {
    console.log(`Would write ${mcpPath}`, JSON.stringify(mcpOutput, null, 2));
    console.log(`Would write ${settingsPath}`, JSON.stringify(settingsOutput, null, 2));
    return;
  }

  if (!mergeResult.changed && !settingsChanged) {
    console.log(brandSmith(`smith MCP already installed at ${mcpPath}`));
    return;
  }

  if (mergeResult.changed) {
    writeJsonFile(mcpPath, mcpOutput);
  }
  if (settingsChanged) {
    writeJsonFile(settingsPath, settingsOutput);
  }

  console.log(brandSmith(`smith installed MCP at ${mcpPath}`));
}

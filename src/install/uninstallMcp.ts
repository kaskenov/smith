import { resolveAgents } from './agents';
import { removeClaudeMcpEnablement } from './claudeSettings';
import { SMITH_MCP_SERVER_KEY } from './constants';
import { readJsonFile, writeJsonFile } from './jsonConfig';
import { defaultMcpConfigFile, type McpConfigFile } from './mcpConfigFile';
import { removeMcpServer } from './mergeMcpConfig';
import {
  getClaudeSettingsLocalPath,
  getMcpConfigTarget,
  resolveScope,
} from './paths';
import type { InstallAgent, InstallFlags, InstallScope } from './types';

export type UninstallMcpAction =
  | { type: 'written'; path: string }
  | { type: 'dry-run'; path: string; content: unknown }
  | { type: 'not-installed'; path: string };

export async function uninstallMcp(flags: InstallFlags): Promise<UninstallMcpAction[]> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);
  const actions: UninstallMcpAction[] = [];

  for (const agent of agents) {
    actions.push(...(await uninstallMcpForAgent(agent, scope, cwd, flags)));
  }

  return actions;
}

async function uninstallMcpForAgent(
  agent: InstallAgent,
  scope: InstallScope,
  cwd: string,
  flags: InstallFlags,
): Promise<UninstallMcpAction[]> {
  const mcpPath = getMcpConfigTarget(agent, scope, cwd);
  const existing = readJsonFile<McpConfigFile>(mcpPath, defaultMcpConfigFile(agent, scope));
  const mcpServers = existing.mcpServers ?? {};
  const removeResult = removeMcpServer(mcpServers, SMITH_MCP_SERVER_KEY);

  if (agent === 'claude' && scope === 'local') {
    return uninstallClaudeLocalMcp(mcpPath, cwd, flags, existing, removeResult);
  }

  const output: McpConfigFile = { ...existing, mcpServers: removeResult.merged };

  if (flags.dryRun) {
    return removeResult.changed ? [{ type: 'dry-run', path: mcpPath, content: output }] : [];
  }

  if (!removeResult.changed) {
    return [{ type: 'not-installed', path: mcpPath }];
  }

  writeJsonFile(mcpPath, output);
  return [{ type: 'written', path: mcpPath }];
}

async function uninstallClaudeLocalMcp(
  mcpPath: string,
  cwd: string,
  flags: InstallFlags,
  existing: McpConfigFile,
  removeResult: ReturnType<typeof removeMcpServer>,
): Promise<UninstallMcpAction[]> {
  const mcpOutput: McpConfigFile = { ...existing, mcpServers: removeResult.merged };

  const settingsPath = getClaudeSettingsLocalPath(cwd);
  const existingSettings = readJsonFile<Record<string, unknown>>(settingsPath, {});
  const settingsOutput = removeClaudeMcpEnablement(existingSettings, SMITH_MCP_SERVER_KEY);
  const settingsChanged =
    JSON.stringify(existingSettings) !== JSON.stringify(settingsOutput);

  if (flags.dryRun) {
    const actions: UninstallMcpAction[] = [];
    if (removeResult.changed) {
      actions.push({ type: 'dry-run', path: mcpPath, content: mcpOutput });
    }
    if (settingsChanged) {
      actions.push({ type: 'dry-run', path: settingsPath, content: settingsOutput });
    }
    return actions;
  }

  if (!removeResult.changed && !settingsChanged) {
    return [{ type: 'not-installed', path: mcpPath }];
  }

  if (removeResult.changed) {
    writeJsonFile(mcpPath, mcpOutput);
  }
  if (settingsChanged) {
    writeJsonFile(settingsPath, settingsOutput);
  }

  // Report against MCP path once (settings may also change for Claude local).
  return [{ type: 'written', path: mcpPath }];
}

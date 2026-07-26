import { resolveAgents } from './agents';
import { mergeClaudeMcpEnablement } from './claudeSettings';
import { SMITH_MCP_SERVER_KEY } from './constants';
import { UsageError } from '../core/errors';
import { readJsonFile, writeJsonFile } from './jsonConfig';
import { defaultMcpConfigFile, type McpConfigFile } from './mcpConfigFile';
import { mergeMcpServers, type McpServerConfig } from './mergeMcpConfig';
import {
  getClaudeSettingsLocalPath,
  getMcpConfigTarget,
  resolveScope,
} from './paths';
import { resolveSmithMcpEntry } from './resolveSmithMcpEntry';
import type { InstallAgent, InstallFlags, InstallScope } from './types';

export type InstallMcpAction =
  | { type: 'written'; path: string }
  | { type: 'unchanged'; path: string }
  | { type: 'dry-run'; path: string; content: unknown };

function smithEntry(): McpServerConfig {
  return resolveSmithMcpEntry();
}

function checkConflict(
  result: { conflict: boolean },
  path: string,
  force?: boolean,
): void {
  if (result.conflict && !force) {
    throw new UsageError(
      `MCP server '${SMITH_MCP_SERVER_KEY}' at ${path} is configured differently. Use --force to overwrite.`,
    );
  }
}

export async function installMcp(flags: InstallFlags): Promise<InstallMcpAction[]> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);
  const entry = smithEntry();
  const actions: InstallMcpAction[] = [];

  for (const agent of agents) {
    actions.push(...(await installMcpForAgent(agent, scope, cwd, flags, entry)));
  }

  return actions;
}

async function installMcpForAgent(
  agent: InstallAgent,
  scope: InstallScope,
  cwd: string,
  flags: InstallFlags,
  entry: McpServerConfig,
): Promise<InstallMcpAction[]> {
  const mcpPath = getMcpConfigTarget(agent, scope, cwd);

  if (agent === 'claude' && scope === 'local') {
    return installClaudeLocalMcp(mcpPath, cwd, flags, entry);
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
    return [{ type: 'dry-run', path: mcpPath, content: output }];
  }

  if (!mergeResult.changed) {
    return [{ type: 'unchanged', path: mcpPath }];
  }

  writeJsonFile(mcpPath, output);
  return [{ type: 'written', path: mcpPath }];
}

async function installClaudeLocalMcp(
  mcpPath: string,
  cwd: string,
  flags: InstallFlags,
  entry: McpServerConfig,
): Promise<InstallMcpAction[]> {
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
    const actions: InstallMcpAction[] = [
      { type: 'dry-run', path: mcpPath, content: mcpOutput },
      { type: 'dry-run', path: settingsPath, content: settingsOutput },
    ];
    return actions;
  }

  if (!mergeResult.changed && !settingsChanged) {
    return [{ type: 'unchanged', path: mcpPath }];
  }

  if (mergeResult.changed) {
    writeJsonFile(mcpPath, mcpOutput);
  }
  if (settingsChanged) {
    writeJsonFile(settingsPath, settingsOutput);
  }

  return [{ type: 'written', path: mcpPath }];
}

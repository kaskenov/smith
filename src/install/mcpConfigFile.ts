import type { InstallAgent, InstallScope } from './types';
import type { McpServerConfig } from './mergeMcpConfig';

export interface McpConfigFile {
  mcpServers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

export function defaultMcpConfigFile(agent: InstallAgent, scope: InstallScope): McpConfigFile {
  if (agent === 'cursor') return { mcpServers: {} };
  if (agent === 'claude' && scope === 'local') return { mcpServers: {} };
  return {};
}

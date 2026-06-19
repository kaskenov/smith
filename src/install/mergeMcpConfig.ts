export interface McpServerConfig {
  command?: string;
  args?: string[];
  [key: string]: unknown;
}

export interface McpMergeResult {
  merged: Record<string, McpServerConfig>;
  changed: boolean;
  conflict: boolean;
}

export interface McpRemoveResult {
  merged: Record<string, McpServerConfig>;
  changed: boolean;
}

function configsEqual(a: McpServerConfig, b: McpServerConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeMcpServers(
  existing: Record<string, McpServerConfig>,
  key: string,
  entry: McpServerConfig,
  opts: { force?: boolean },
): McpMergeResult {
  const current = existing[key];
  if (current === undefined) {
    return {
      merged: { ...existing, [key]: entry },
      changed: true,
      conflict: false,
    };
  }
  if (configsEqual(current, entry)) {
    return {
      merged: existing,
      changed: false,
      conflict: false,
    };
  }
  if (!opts.force) {
    return {
      merged: existing,
      changed: false,
      conflict: true,
    };
  }
  return {
    merged: { ...existing, [key]: entry },
    changed: true,
    conflict: false,
  };
}

export function removeMcpServer(
  existing: Record<string, McpServerConfig>,
  key: string,
): McpRemoveResult {
  return removeMcpServers(existing, [key]);
}

export function removeMcpServers(
  existing: Record<string, McpServerConfig>,
  keys: string[],
): McpRemoveResult {
  const merged = { ...existing };
  let changed = false;
  for (const key of keys) {
    if (key in merged) {
      delete merged[key];
      changed = true;
    }
  }
  return { merged, changed };
}

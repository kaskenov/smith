export function mergeClaudeMcpEnablement(
  existing: Record<string, unknown>,
  serverKey: string,
): Record<string, unknown> {
  const enabledMcpjsonServers = Array.isArray(existing.enabledMcpjsonServers)
    ? [...(existing.enabledMcpjsonServers as unknown[])]
    : [];

  if (!enabledMcpjsonServers.includes(serverKey)) {
    enabledMcpjsonServers.push(serverKey);
  }

  return {
    ...existing,
    enableAllProjectMcpServers: true,
    enabledMcpjsonServers,
  };
}

export function removeClaudeMcpEnablement(
  existing: Record<string, unknown>,
  serverKey: string,
): Record<string, unknown> {
  if (!Array.isArray(existing.enabledMcpjsonServers)) {
    return { ...existing };
  }

  const enabledMcpjsonServers = (existing.enabledMcpjsonServers as unknown[]).filter(
    (key) => key !== serverKey,
  );

  return {
    ...existing,
    enabledMcpjsonServers,
  };
}

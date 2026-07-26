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

  // Allowlist-only: do not set enableAllProjectMcpServers (widens trust beyond smith).
  return {
    ...existing,
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

  const next: Record<string, unknown> = {
    ...existing,
    enabledMcpjsonServers,
  };

  // If smith was the only allowlisted server and enable-all was on, clear the
  // broad flag so uninstall does not leave every project MCP enabled.
  if (
    existing.enableAllProjectMcpServers === true &&
    enabledMcpjsonServers.length === 0
  ) {
    delete next.enableAllProjectMcpServers;
  }

  return next;
}

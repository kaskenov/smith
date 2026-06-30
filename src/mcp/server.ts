import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { notifyIfNewerVersion } from '../package/registry';
import { readPackageVersion } from '../package/version';
import { registerTools } from './tools';

export async function runMcpServer(): Promise<void> {
  const currentVersion = readPackageVersion();
  if (process.env.SMITH_SKIP_UPDATE_CHECK !== '1') {
    void notifyIfNewerVersion(currentVersion);
  }

  const server = new McpServer({ name: 'smith', version: currentVersion });
  registerTools(server);
  await server.connect(new StdioServerTransport());
}

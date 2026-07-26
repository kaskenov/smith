import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readPackageVersion } from '../package/version';
import { registerTools } from './tools';

export async function runMcpServer(): Promise<void> {
  // Do not call notifyIfNewerVersion here — stdout/stderr noise breaks StdioServerTransport.
  const currentVersion = readPackageVersion();
  const server = new McpServer({ name: 'smith', version: currentVersion });
  registerTools(server);
  await server.connect(new StdioServerTransport());
}

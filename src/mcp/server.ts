import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools';

interface PackageJson {
  version: string;
}

function readPackageVersion(): string {
  const pkgPath = join(__dirname, '../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
  return pkg.version;
}

export async function runMcpServer(): Promise<void> {
  const server = new McpServer({ name: 'smith', version: readPackageVersion() });
  registerTools(server);
  await server.connect(new StdioServerTransport());
}

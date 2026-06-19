import { runMcpServer } from '../mcp/server';

export async function runMcpCommand(): Promise<void> {
  await runMcpServer();
}

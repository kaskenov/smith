import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerActionTools } from './actions';
import { registerReadTools } from './read';
import { registerScaffoldTools } from './scaffold';

export function registerTools(server: McpServer): void {
  registerReadTools(server);
  registerActionTools(server);
  registerScaffoldTools(server);
}

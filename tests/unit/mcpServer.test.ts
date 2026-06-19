const connect = jest.fn().mockResolvedValue(undefined);
const registerTools = jest.fn();

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation((options: { name: string; version: string }) => ({
    connect,
    options,
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

jest.mock('../../src/mcp/tools', () => ({
  registerTools,
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { runMcpServer } from '../../src/mcp/server';

describe('runMcpServer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates server, registers tools, and connects stdio transport', async () => {
    await runMcpServer();

    expect(McpServer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'smith', version: expect.any(String) }),
    );
    expect(registerTools).toHaveBeenCalled();
    expect(StdioServerTransport).toHaveBeenCalled();
    expect(connect).toHaveBeenCalled();
  });
});

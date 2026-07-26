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

jest.mock('../../src/package/registry', () => ({
  ...jest.requireActual('../../src/package/registry'),
  notifyIfNewerVersion: jest.fn().mockResolvedValue(undefined),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { notifyIfNewerVersion } from '../../src/package/registry';
import { runMcpServer } from '../../src/mcp/server';

describe('runMcpServer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates server, registers tools, and connects stdio transport without version notify', async () => {
    await runMcpServer();

    expect(McpServer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'smith', version: expect.any(String) }),
    );
    expect(registerTools).toHaveBeenCalled();
    expect(StdioServerTransport).toHaveBeenCalled();
    expect(connect).toHaveBeenCalled();
    expect(notifyIfNewerVersion).not.toHaveBeenCalled();
  });
});

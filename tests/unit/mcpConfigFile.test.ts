import { defaultMcpConfigFile } from '../../src/install/mcpConfigFile';

describe('defaultMcpConfigFile', () => {
  it('returns mcpServers for cursor', () => {
    expect(defaultMcpConfigFile('cursor', 'local')).toEqual({ mcpServers: {} });
    expect(defaultMcpConfigFile('cursor', 'global')).toEqual({ mcpServers: {} });
  });

  it('returns mcpServers for claude local', () => {
    expect(defaultMcpConfigFile('claude', 'local')).toEqual({ mcpServers: {} });
  });

  it('returns empty object for claude global and qwen', () => {
    expect(defaultMcpConfigFile('claude', 'global')).toEqual({});
    expect(defaultMcpConfigFile('qwen', 'local')).toEqual({});
    expect(defaultMcpConfigFile('qwen', 'global')).toEqual({});
  });
});

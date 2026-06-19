import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readJsonFile, writeJsonFile } from '../../src/install/jsonConfig';
import {
  mergeMcpServers,
  removeMcpServer,
  removeMcpServers,
  type McpServerConfig,
} from '../../src/install/mergeMcpConfig';
import { SMITH_MCP_ENTRY } from '../../src/install/constants';

describe('mergeMcpServers', () => {
  const smithEntry: McpServerConfig = {
    command: SMITH_MCP_ENTRY.command,
    args: [...SMITH_MCP_ENTRY.args],
  };

  it('adds a new server and preserves unrelated keys', () => {
    const existing = {
      playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
    };

    const result = mergeMcpServers(existing, 'smith', smithEntry, {});

    expect(result.conflict).toBe(false);
    expect(result.changed).toBe(true);
    expect(result.merged).toEqual({
      playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
      smith: smithEntry,
    });
  });

  it('is idempotent when the same config is already present', () => {
    const existing = {
      smith: smithEntry,
      playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
    };

    const result = mergeMcpServers(existing, 'smith', smithEntry, {});

    expect(result.conflict).toBe(false);
    expect(result.changed).toBe(false);
    expect(result.merged).toEqual(existing);
  });

  it('reports conflict without force when the key exists with different config', () => {
    const existing = {
      smith: { command: 'other', args: ['mcp'] },
    };

    const result = mergeMcpServers(existing, 'smith', smithEntry, {});

    expect(result.conflict).toBe(true);
    expect(result.changed).toBe(false);
    expect(result.merged).toEqual(existing);
  });

  it('replaces the entry when force is set', () => {
    const existing = {
      smith: { command: 'other', args: ['mcp'] },
      playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
    };

    const result = mergeMcpServers(existing, 'smith', smithEntry, { force: true });

    expect(result.conflict).toBe(false);
    expect(result.changed).toBe(true);
    expect(result.merged).toEqual({
      smith: smithEntry,
      playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
    });
  });
});

describe('removeMcpServer(s)', () => {
  const existing = {
    smith: { command: 'smith', args: ['mcp'] },
    playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
  };

  it('removeMcpServer removes one key and preserves others', () => {
    const result = removeMcpServer(existing, 'smith');

    expect(result.changed).toBe(true);
    expect(result.merged).toEqual({
      playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
    });
  });

  it('removeMcpServers removes multiple keys', () => {
    const result = removeMcpServers(existing, ['smith', 'playwright']);

    expect(result.changed).toBe(true);
    expect(result.merged).toEqual({});
  });

  it('removeMcpServer is unchanged when the key is missing', () => {
    const result = removeMcpServer(existing, 'missing');

    expect(result.changed).toBe(false);
    expect(result.merged).toEqual(existing);
  });
});

describe('jsonConfig', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'smith-json-config-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('readJsonFile returns default when the file is missing', () => {
    const path = join(dir, 'missing.json');
    expect(readJsonFile(path, { mcpServers: {} })).toEqual({ mcpServers: {} });
  });

  it('writeJsonFile writes atomically via a temp file', () => {
    const path = join(dir, 'mcp.json');
    writeJsonFile(path, { mcpServers: { smith: SMITH_MCP_ENTRY } });

    expect(readFileSync(path, 'utf8')).toBe(
      JSON.stringify({ mcpServers: { smith: SMITH_MCP_ENTRY } }, null, 2) + '\n',
    );
    expect(readJsonFile(path, {})).toEqual({ mcpServers: { smith: SMITH_MCP_ENTRY } });
  });
});

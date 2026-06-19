import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { resolveSmithMcpEntry } from '../../src/install/resolveSmithMcpEntry';

describe('resolveSmithMcpEntry', () => {
  it('uses node and absolute path to dist/cli.js', () => {
    const entry = resolveSmithMcpEntry();
    expect(entry.command).toBe(process.execPath);
    expect(entry.args).toHaveLength(2);
    expect(entry.args?.[1]).toBe('mcp');
    expect(existsSync(entry.args![0]!)).toBe(true);
    expect(entry.args![0]).toMatch(/dist[\\/]cli\.js$/);
  });

  it('points to a runnable smith mcp entry', () => {
    const entry = resolveSmithMcpEntry();
    const cliPath = entry.args![0]!;
    expect(existsSync(join(cliPath, '..', '..', 'package.json'))).toBe(true);
  });
});

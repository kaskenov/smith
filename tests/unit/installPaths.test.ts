import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  resolveScope,
  getSkillsDir,
  getMcpConfigTarget,
  getClaudeSettingsLocalPath,
} from '../../src/install/paths';

const cwd = '/tmp/my-project';

describe('resolveScope', () => {
  it('defaults to local', () => {
    expect(resolveScope({})).toBe('local');
  });

  it('respects --global', () => {
    expect(resolveScope({ global: true })).toBe('global');
  });

  it('respects --local', () => {
    expect(resolveScope({ local: true })).toBe('local');
  });

  it('throws when both --global and --local are set', () => {
    expect(() => resolveScope({ global: true, local: true })).toThrow(
      'Use either --global or --local, not both.',
    );
  });
});

describe('getSkillsDir', () => {
  it('cursor local', () => {
    expect(getSkillsDir('cursor', 'local', cwd)).toBe(
      join(cwd, '.cursor', 'skills'),
    );
  });

  it('cursor global', () => {
    expect(getSkillsDir('cursor', 'global', cwd)).toBe(
      join(homedir(), '.cursor', 'skills'),
    );
  });

  it('claude local', () => {
    expect(getSkillsDir('claude', 'local', cwd)).toBe(
      join(cwd, '.claude', 'skills'),
    );
  });

  it('claude global', () => {
    expect(getSkillsDir('claude', 'global', cwd)).toBe(
      join(homedir(), '.claude', 'skills'),
    );
  });

  it('qwen local', () => {
    expect(getSkillsDir('qwen', 'local', cwd)).toBe(join(cwd, '.qwen', 'skills'));
  });

  it('qwen global', () => {
    expect(getSkillsDir('qwen', 'global', cwd)).toBe(join(homedir(), '.qwen', 'skills'));
  });
});

describe('getMcpConfigTarget', () => {
  it('cursor local → .cursor/mcp.json', () => {
    expect(getMcpConfigTarget('cursor', 'local', cwd)).toBe(
      join(cwd, '.cursor', 'mcp.json'),
    );
  });

  it('cursor global → ~/.cursor/mcp.json', () => {
    expect(getMcpConfigTarget('cursor', 'global', cwd)).toBe(
      join(homedir(), '.cursor', 'mcp.json'),
    );
  });

  it('claude local → .mcp.json at project root', () => {
    expect(getMcpConfigTarget('claude', 'local', cwd)).toBe(
      join(cwd, '.mcp.json'),
    );
  });

  it('claude global → ~/.claude.json', () => {
    expect(getMcpConfigTarget('claude', 'global', cwd)).toBe(
      join(homedir(), '.claude.json'),
    );
  });

  it('qwen local → .qwen/settings.json', () => {
    expect(getMcpConfigTarget('qwen', 'local', cwd)).toBe(
      join(cwd, '.qwen', 'settings.json'),
    );
  });

  it('qwen global → ~/.qwen/settings.json', () => {
    expect(getMcpConfigTarget('qwen', 'global', cwd)).toBe(
      join(homedir(), '.qwen', 'settings.json'),
    );
  });
});

describe('getClaudeSettingsLocalPath', () => {
  it('returns .claude/settings.local.json under cwd', () => {
    expect(getClaudeSettingsLocalPath(cwd)).toBe(
      join(cwd, '.claude', 'settings.local.json'),
    );
  });
});

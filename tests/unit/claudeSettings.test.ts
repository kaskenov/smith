import {
  mergeClaudeMcpEnablement,
  removeClaudeMcpEnablement,
} from '../../src/install/claudeSettings';

describe('mergeClaudeMcpEnablement', () => {
  it('merges enablement without dropping unrelated keys', () => {
    const result = mergeClaudeMcpEnablement(
      { permissions: { allow: ['Shell(*)'] } },
      'smith',
    );

    expect(result.enableAllProjectMcpServers).toBe(true);
    expect(result.enabledMcpjsonServers).toContain('smith');
    expect(result.permissions).toEqual({ allow: ['Shell(*)'] });
  });

  it('appends serverKey to existing enabledMcpjsonServers', () => {
    const result = mergeClaudeMcpEnablement(
      { enabledMcpjsonServers: ['playwright'] },
      'smith',
    );

    expect(result.enabledMcpjsonServers).toEqual(['playwright', 'smith']);
  });

  it('dedupes serverKey when already present', () => {
    const existing = {
      enableAllProjectMcpServers: true,
      enabledMcpjsonServers: ['smith', 'playwright'],
    };

    const result = mergeClaudeMcpEnablement(existing, 'smith');

    expect(result.enabledMcpjsonServers).toEqual(['smith', 'playwright']);
  });

  it('creates enabledMcpjsonServers when missing', () => {
    const result = mergeClaudeMcpEnablement({}, 'smith');

    expect(result.enableAllProjectMcpServers).toBe(true);
    expect(result.enabledMcpjsonServers).toEqual(['smith']);
  });
});

describe('removeClaudeMcpEnablement', () => {
  it('removes serverKey from enabledMcpjsonServers only', () => {
    const result = removeClaudeMcpEnablement(
      {
        enableAllProjectMcpServers: true,
        enabledMcpjsonServers: ['smith', 'playwright'],
        permissions: { allow: ['Shell(*)'] },
      },
      'smith',
    );

    expect(result.enabledMcpjsonServers).toEqual(['playwright']);
    expect(result.enableAllProjectMcpServers).toBe(true);
    expect(result.permissions).toEqual({ allow: ['Shell(*)'] });
  });

  it('preserves other keys when serverKey is not in the array', () => {
    const existing = {
      enableAllProjectMcpServers: true,
      enabledMcpjsonServers: ['playwright'],
      permissions: { allow: ['Shell(*)'] },
    };

    const result = removeClaudeMcpEnablement(existing, 'smith');

    expect(result).toEqual(existing);
  });

  it('leaves settings unchanged when enabledMcpjsonServers is missing', () => {
    const existing = {
      enableAllProjectMcpServers: true,
      permissions: { allow: ['Shell(*)'] },
    };

    const result = removeClaudeMcpEnablement(existing, 'smith');

    expect(result).toEqual(existing);
  });
});

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runTemplatesAdd } from '../../src/commands/templates/add';
import { readSources } from '../../src/core/templateSources';
import { getGlobalConfigPath, getGlobalTemplatesDir } from '../../src/paths/globalSmithHome';

jest.mock('node:child_process', () => ({
  spawnSync: jest.fn(),
}));

describe('runTemplatesAdd', () => {
  const spawnSyncMock = spawnSync as jest.MockedFunction<typeof spawnSync>;

  afterEach(() => {
    jest.restoreAllMocks();
    spawnSyncMock.mockReset();
  });

  function mockSuccessfulClone(fileName: string, content: string): void {
    spawnSyncMock.mockImplementation((_cmd, args) => {
      const list = args as string[];
      const dest = list[list.length - 1]!;
      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, fileName), content, 'utf8');
      return {
        status: 0,
        stdout: '',
        stderr: '',
        pid: 1,
        output: [],
        signal: null,
      } as ReturnType<typeof spawnSync>;
    });
  }

  it('copies a local path into ~/.smith/templates and writes sources', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    mkdirSync(join(source, 'nested'), { recursive: true });
    writeFileSync(join(source, 'nested', '{{name}}.txt'), 'hello {{name}}', 'utf8');

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({
      name: 'frontend-app',
      from: source,
      path: 'nested',
      acknowledgeExecutableConfig: true,
    });

    const installed = join(getGlobalTemplatesDir(), 'frontend-app', '{{name}}.txt');
    expect(existsSync(installed)).toBe(true);
    expect(readFileSync(installed, 'utf8')).toBe('hello {{name}}');
    expect(existsSync(getGlobalConfigPath())).toBe(true);
    expect(readSources()['frontend-app']).toMatchObject({
      type: 'path',
      from: source,
      path: 'nested',
    });

    rmSync(source, { recursive: true, force: true });
  });

  it('copies without subdirectory path', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    mkdirSync(join(source, 'nested', 'deep'), { recursive: true });
    writeFileSync(join(source, 'a.txt'), 'a', 'utf8');
    writeFileSync(join(source, 'nested', 'deep', 'b.txt'), 'b', 'utf8');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({ name: 'plain', from: source,
      acknowledgeExecutableConfig: true,
    });

    expect(existsSync(join(getGlobalTemplatesDir(), 'plain', 'a.txt'))).toBe(true);
    expect(existsSync(join(getGlobalTemplatesDir(), 'plain', 'nested', 'deep', 'b.txt'))).toBe(
      true,
    );
    rmSync(source, { recursive: true, force: true });
  });

  it('refuses overwrite without --force', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    writeFileSync(join(source, 'a.txt'), 'a', 'utf8');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({ name: 'dup', from: source,
      acknowledgeExecutableConfig: true,
    });
    await expect(runTemplatesAdd({ name: 'dup', from: source,
      acknowledgeExecutableConfig: true,
    })).rejects.toThrow(
      'Global template already exists: dup',
    );

    rmSync(source, { recursive: true, force: true });
  });

  it('overwrites with --force', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    writeFileSync(join(source, 'a.txt'), 'v1', 'utf8');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({ name: 'forced', from: source,
      acknowledgeExecutableConfig: true,
    });
    writeFileSync(join(source, 'a.txt'), 'v2', 'utf8');
    await runTemplatesAdd({ name: 'forced', from: source, force: true,
      acknowledgeExecutableConfig: true,
    });

    expect(readFileSync(join(getGlobalTemplatesDir(), 'forced', 'a.txt'), 'utf8')).toBe('v2');
    rmSync(source, { recursive: true, force: true });
  });

  it('throws when --from is empty', async () => {
    await expect(runTemplatesAdd({ name: 'x', from: '',
      acknowledgeExecutableConfig: true,
    })).rejects.toThrow(
      'Missing required flag: --from',
    );
  });

  it('requires acknowledgeExecutableConfig', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    writeFileSync(join(source, 'a.txt'), 'a', 'utf8');
    await expect(runTemplatesAdd({ name: 'no-ack', from: source })).rejects.toThrow(
      /acknowledgeExecutableConfig/,
    );
    rmSync(source, { recursive: true, force: true });
  });

  it('rejects git source components that start with -', async () => {
    await expect(
      runTemplatesAdd({
        name: 'evil-git',
        from: 'https://example.com/-oProxyCommand=evil/repo.git',
        acknowledgeExecutableConfig: true,
      }),
    ).rejects.toThrow(/Unsafe git source component/);
  });

  it('throws for invalid template name', async () => {
    await expect(runTemplatesAdd({ name: '../evil', from: '/tmp',
      acknowledgeExecutableConfig: true,
    })).rejects.toThrow(
      'Invalid template name',
    );
  });

  it('throws when source subdirectory is missing', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    await expect(
      runTemplatesAdd({ name: 'bad-sub', from: source, path: 'missing',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow('Source subdirectory not found: missing');
    rmSync(source, { recursive: true, force: true });
  });

  it('throws when cloned source directory disappears', async () => {
    spawnSyncMock.mockImplementation((_cmd, args) => {
      const list = args as string[];
      const dest = list[list.length - 1]!;
      rmSync(dest, { recursive: true, force: true });
      return {
        status: 0,
        stdout: '',
        stderr: '',
        pid: 1,
        output: [],
        signal: null,
      } as ReturnType<typeof spawnSync>;
    });

    await expect(
      runTemplatesAdd({ name: 'gone-clone', from: 'git@github.com:org/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow('Source path not found or not a directory');
  });

  it('throws for unknown --from source', async () => {
    await expect(
      runTemplatesAdd({ name: 'x', from: 'not-a-path-or-git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow('Unknown --from source');
  });

  it('clones git sources with ref and cleans temp dir', async () => {
    mockSuccessfulClone('t.txt', 'from-git');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({
      name: 'from-git',
      from: 'git@github.com:org/repo.git',
      ref: 'main',
      acknowledgeExecutableConfig: true,
    });

    expect(spawnSyncMock).toHaveBeenCalled();
    const args = spawnSyncMock.mock.calls[0]?.[1] as string[];
    expect(args).toContain('--branch');
    expect(args).toContain('main');
    expect(readFileSync(join(getGlobalTemplatesDir(), 'from-git', 't.txt'), 'utf8')).toBe(
      'from-git',
    );
    expect(readSources()['from-git']).toMatchObject({
      type: 'git',
      from: 'git@github.com:org/repo.git',
      ref: 'main',
    });
  });

  it('supports https github and ssh git source detection', async () => {
    mockSuccessfulClone('x.txt', 'ok');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runTemplatesAdd({ name: 'https-tpl', from: 'https://github.com/org/repo.git',
      acknowledgeExecutableConfig: true,
    });
    await runTemplatesAdd({ name: 'gh-tpl', from: 'github:org/repo',
      acknowledgeExecutableConfig: true,
    });
    await runTemplatesAdd({ name: 'ssh-tpl', from: 'ssh://git@host/repo.git',
      acknowledgeExecutableConfig: true,
    });

    expect(existsSync(join(getGlobalTemplatesDir(), 'https-tpl', 'x.txt'))).toBe(true);
    expect(existsSync(join(getGlobalTemplatesDir(), 'gh-tpl', 'x.txt'))).toBe(true);
    expect(existsSync(join(getGlobalTemplatesDir(), 'ssh-tpl', 'x.txt'))).toBe(true);
  });

  it('rejects insecure http:// and git:// sources', async () => {
    await expect(
      runTemplatesAdd({ name: 'http-tpl', from: 'http://example.com/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow(/Insecure git transports/);
    await expect(
      runTemplatesAdd({ name: 'git-proto', from: 'git://example.com/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow(/Insecure git transports/);
  });

  it('throws when git clone times out', async () => {
    spawnSyncMock.mockReturnValue({
      status: null,
      signal: 'SIGTERM',
      error: Object.assign(new Error('spawnSync git ETIMEDOUT'), { code: 'ETIMEDOUT' }),
      stdout: '',
      stderr: '',
      pid: 1,
      output: [],
    } as ReturnType<typeof spawnSync>);

    await expect(
      runTemplatesAdd({ name: 'slow-git', from: 'git@github.com:org/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow(/timed out/);
  });

  it('treats signalled git clone as timeout even without TIMEDOUT message', async () => {
    spawnSyncMock.mockReturnValue({
      status: null,
      signal: 'SIGTERM',
      error: new Error('spawnSync git was killed'),
      stdout: '',
      stderr: '',
      pid: 1,
      output: [],
    } as ReturnType<typeof spawnSync>);

    await expect(
      runTemplatesAdd({ name: 'killed-git', from: 'git@github.com:org/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow(/timed out/);
  });

  it('throws when git clone spawn fails without timeout', async () => {
    spawnSyncMock.mockReturnValue({
      status: null,
      signal: null,
      error: new Error('spawnSync git ENOENT'),
      stdout: '',
      stderr: '',
      pid: 1,
      output: [],
    } as ReturnType<typeof spawnSync>);

    await expect(
      runTemplatesAdd({ name: 'missing-git', from: 'git@github.com:org/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow('Failed to clone template source: spawnSync git ENOENT');
  });

  it('rejects --path that escapes via intermediate symlink', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-'));
    const outside = mkdtempSync(join(tmpdir(), 'smith-out-'));
    mkdirSync(join(outside, 'sub'), { recursive: true });
    writeFileSync(join(outside, 'sub', 'x.txt'), 'x', 'utf8');
    try {
      symlinkSync(outside, join(source, 'vendor'));
    } catch {
      rmSync(source, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
      return;
    }

    await expect(
      runTemplatesAdd({ name: 'via-link', from: source, path: 'vendor/sub',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow(/--path must stay inside|symlink/);

    rmSync(source, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  it('rejects sources that contain symlinks', async () => {
    const source = mkdtempSync(join(tmpdir(), 'smith-src-symlink-'));
    writeFileSync(join(source, 'ok.txt'), 'ok', 'utf8');
    try {
      symlinkSync(join(source, 'ok.txt'), join(source, 'link.txt'));
    } catch {
      rmSync(source, { recursive: true, force: true });
      return;
    }

    await expect(runTemplatesAdd({ name: 'with-link', from: source,
      acknowledgeExecutableConfig: true,
    })).rejects.toThrow(/symlink/);
    rmSync(source, { recursive: true, force: true });
  });

  it('throws when git clone fails', async () => {
    spawnSyncMock.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'clone exploded',
      pid: 1,
      output: [],
      signal: null,
    } as ReturnType<typeof spawnSync>);

    await expect(
      runTemplatesAdd({ name: 'bad-git', from: 'git@github.com:org/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow('Failed to clone template source: clone exploded');
  });

  it('uses fallback message when git clone fails without stderr', async () => {
    spawnSyncMock.mockReturnValue({
      status: 128,
      stdout: '',
      stderr: '',
      pid: 1,
      output: [],
      signal: null,
    } as ReturnType<typeof spawnSync>);

    await expect(
      runTemplatesAdd({ name: 'bad-git-2', from: 'git@github.com:org/repo.git',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow('Failed to clone template source: git clone failed');
  });

  it('throws when git clone path subdirectory is missing', async () => {
    spawnSyncMock.mockImplementation((_cmd, args) => {
      const list = args as string[];
      const dest = list[list.length - 1]!;
      mkdirSync(dest, { recursive: true });
      return {
        status: 0,
        stdout: '',
        stderr: '',
        pid: 1,
        output: [],
        signal: null,
      } as ReturnType<typeof spawnSync>;
    });

    await expect(
      runTemplatesAdd({
        name: 'git-sub',
        from: 'git@github.com:org/repo.git',
        path: 'nope',
      acknowledgeExecutableConfig: true,
    }),
    ).rejects.toThrow('Source subdirectory not found: nope');
  });
});

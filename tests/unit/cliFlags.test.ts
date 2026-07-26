import {
  assertKnownFlags,
  formatCliError,
  isHelpFlag,
  isVersionFlag,
  readFlag,
  reportCliError,
} from '../../src/commands/cliFlags';
import { UsageError } from '../../src/core/errors';

describe('cliFlags', () => {
  afterEach(() => {
    process.exitCode = undefined;
    jest.restoreAllMocks();
  });

  it('detects help and version flags', () => {
    expect(isHelpFlag('-h')).toBe(true);
    expect(isHelpFlag('--help')).toBe(true);
    expect(isHelpFlag('--force')).toBe(false);
    expect(isVersionFlag('-v')).toBe(true);
    expect(isVersionFlag('--version')).toBe(true);
  });

  it('formats Error and non-Error values', () => {
    expect(formatCliError(new Error('boom'))).toBe('boom');
    expect(formatCliError('raw')).toBe('raw');
  });

  it('reports errors with optional prefix', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    reportCliError(new Error('nope'), 'Failed: ');
    expect(errorSpy).toHaveBeenCalledWith('Failed: nope');
    expect(process.exitCode).toBe(1);
  });

  it('rejects unknown flags', () => {
    expect(() =>
      assertKnownFlags(['--name', 'x', '--nope'], {
        valueFlags: ['--name'],
        boolFlags: ['--force'],
      }),
    ).toThrow(UsageError);
  });

  it('allows known value and bool flags', () => {
    expect(() =>
      assertKnownFlags(['--name', 'x', '--force'], {
        valueFlags: ['--name'],
        boolFlags: ['--force'],
      }),
    ).not.toThrow();
  });

  it('ignores help and version flags when validating', () => {
    expect(() =>
      assertKnownFlags(['--help', '-v'], {
        valueFlags: [],
        boolFlags: [],
      }),
    ).not.toThrow();
  });

  it('reads flag values and rejects missing or flag-like values', () => {
    expect(readFlag(['--name', 'Widget'], '--name')).toBe('Widget');
    expect(readFlag(['--force'], '--name')).toBeUndefined();
    expect(() => readFlag(['--name'], '--name')).toThrow(UsageError);
    expect(() => readFlag(['--name', '--force'], '--name')).toThrow(/Missing value for --name/);
  });

  it('rejects missing values for known value flags', () => {
    expect(() =>
      assertKnownFlags(['--name', '--force'], {
        valueFlags: ['--name'],
        boolFlags: ['--force'],
      }),
    ).toThrow(/Missing value for --name/);
  });
});

import { UsageError } from '../core/errors';

/** Shared CLI flag helpers used by routers and the top-level cli. */

export function isHelpFlag(arg: string): boolean {
  return arg === '-h' || arg === '--help';
}

export function isVersionFlag(arg: string): boolean {
  return arg === '-v' || arg === '--version';
}

export function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function readFlagValue(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new UsageError(`Missing value for ${name}`);
  }
  return value;
}

export function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return readFlagValue(args, index, name);
}

/**
 * Reject unknown --flags. `valueFlags` consume the next argv token as their value.
 * Boolean flags listed in `boolFlags` stand alone.
 */
export function assertKnownFlags(
  args: string[],
  options: { valueFlags: string[]; boolFlags: string[] },
): void {
  const valueFlags = new Set(options.valueFlags);
  const boolFlags = new Set(options.boolFlags);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (isHelpFlag(arg) || isVersionFlag(arg)) continue;
    if (!arg.startsWith('-')) continue;

    if (valueFlags.has(arg)) {
      readFlagValue(args, i, arg);
      i += 1;
      continue;
    }
    if (boolFlags.has(arg)) continue;
    throw new UsageError(`Unknown option: ${arg}`);
  }
}

export function formatCliError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Log a CLI failure and set exitCode = 1. */
export function reportCliError(error: unknown, prefix?: string): void {
  const message = formatCliError(error);
  console.error(prefix ? `${prefix}${message}` : message);
  process.exitCode = 1;
}

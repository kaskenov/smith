import { isAbsolute, resolve } from 'node:path';
import { UsageError } from './errors';

/** Reject absolute config paths (rootDir) — never opt-in; agents must not redirect output via config. */
export function assertRelativeConfigPath(value: string | undefined, label: string): void {
  if (value !== undefined && isAbsolute(value)) {
    throw new UsageError(
      `${label} must be relative (absolute paths are not allowed): ${value}`,
    );
  }
}

export function resolveOutputPath(
  input: string | undefined,
  ctx: {
    cwd: string;
    root: string;
    defaultOutput: string;
    /** When true, absolute --path is allowed (CLI --allow-absolute / library opt-in). */
    allowAbsolute?: boolean;
  },
): string {
  if (!input) return resolve(ctx.defaultOutput);
  if (isAbsolute(input)) {
    if (!ctx.allowAbsolute) {
      throw new UsageError(
        `Absolute output path is not allowed: ${input}. Use a relative path, or pass --allow-absolute / allowAbsolutePath to opt in.`,
      );
    }
    return resolve(input);
  }
  if (input.startsWith('.')) return resolve(ctx.cwd, input);
  return resolve(ctx.root, input);
}

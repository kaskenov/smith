import { isAbsolute, resolve } from 'node:path';
import { UsageError } from './errors';
import { isInside } from './pathSafety';

/** True when any path segment is `..` (Unix or Windows separators). */
export function hasParentPathSegment(value: string): boolean {
  return value.split(/[/\\]/).some((segment) => segment === '..');
}

/** Reject absolute config paths and `..` segments — never opt-in. */
export function assertRelativeConfigPath(value: string | undefined, label: string): void {
  if (value === undefined) return;
  if (isAbsolute(value)) {
    throw new UsageError(
      `${label} must be relative (absolute paths are not allowed): ${value}`,
    );
  }
  if (hasParentPathSegment(value)) {
    throw new UsageError(`${label} must not contain '..': ${value}`);
  }
}

export function resolveOutputPath(
  input: string | undefined,
  ctx: {
    cwd: string;
    root: string;
    defaultOutput: string;
    /**
     * When true, absolute paths and `..` escape past root are allowed
     * (CLI --allow-absolute / library allowAbsolutePath).
     */
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

  if (!ctx.allowAbsolute && hasParentPathSegment(input)) {
    throw new UsageError(
      `Output path must not contain '..': ${input}. Use a path under the project, or pass --allow-absolute / allowAbsolutePath to opt in.`,
    );
  }

  const resolved = input.startsWith('.') ? resolve(ctx.cwd, input) : resolve(ctx.root, input);

  if (!ctx.allowAbsolute && !isInside(resolved, ctx.root)) {
    throw new UsageError(
      `Output path escapes project root: ${input}. Use a path under the project, or pass --allow-absolute / allowAbsolutePath to opt in.`,
    );
  }

  return resolved;
}

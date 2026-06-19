import { isAbsolute, resolve } from 'node:path';

export function resolveOutputPath(
  input: string | undefined,
  ctx: { cwd: string; root: string; defaultOutput: string },
): string {
  if (!input) return resolve(ctx.defaultOutput);
  if (isAbsolute(input)) return resolve(input);
  if (input.startsWith('.')) return resolve(ctx.cwd, input);
  return resolve(ctx.root, input);
}

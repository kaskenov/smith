import { isAbsolute, resolve } from 'node:path';
import { UsageError } from '../../core/errors';
import { hasParentPathSegment } from '../../core/resolvePath';

export function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

export function normalizeCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

/**
 * MCP replicate rejects absolute paths and `..` segments (defense in depth;
 * replicate() also rejects absolute/escaping path and rootDir by default).
 */
export function assertMcpReplicatePath(path: string | undefined): void {
  if (path === undefined) return;
  if (isAbsolute(path)) {
    throw new UsageError(
      'MCP replicate path must be relative (absolute paths are not allowed for agents)',
    );
  }
  if (hasParentPathSegment(path)) {
    throw new UsageError(
      "MCP replicate path must not contain '..' (path escape is not allowed for agents)",
    );
  }
}

/**
 * Resolve MCP replicate conflict flags (non-interactive; defaults to skip).
 */
export function resolveMcpReplicateFlags(
  force?: boolean,
  skip?: boolean,
): { force: boolean; skip: boolean } {
  if (force === true && skip === true) {
    throw new UsageError('Cannot use force and skip together');
  }
  if (force === true) {
    return { force: true, skip: false };
  }
  if (skip === false) {
    throw new UsageError('MCP replicate requires force:true or skip:true (non-interactive)');
  }
  // Default skip — agents must opt into destructive overwrites.
  return { force: false, skip: true };
}

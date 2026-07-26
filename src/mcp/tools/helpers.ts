import { isAbsolute, resolve } from 'node:path';
import { UsageError } from '../../core/errors';

export function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

export function normalizeCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

/**
 * MCP replicate rejects absolute output paths (defense in depth;
 * replicate() also rejects absolute path/rootDir by default).
 */
export function assertMcpReplicatePath(path: string | undefined): void {
  if (path !== undefined && isAbsolute(path)) {
    throw new UsageError(
      'MCP replicate path must be relative (absolute paths are not allowed for agents)',
    );
  }
}

/** Resolve MCP replicate conflict flags (non-interactive; defaults to force). */
export function resolveMcpReplicateFlags(
  force?: boolean,
  skip?: boolean,
): { force: boolean; skip: boolean } {
  if (force === true && skip === true) {
    throw new UsageError('Cannot use force and skip together');
  }
  const resolvedSkip = skip === true;
  const resolvedForce = resolvedSkip ? false : (force ?? true);
  if (!resolvedForce && !resolvedSkip) {
    throw new UsageError('MCP replicate requires force:true or skip:true (non-interactive)');
  }
  return { force: resolvedForce, skip: resolvedSkip };
}

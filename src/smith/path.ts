import { join, relative, resolve } from 'node:path';
import { isInsideResolved } from '../core/pathSafety';
import type { PathAPI, SmithContext } from '../types';

export function createPathAPI(ctx: SmithContext): PathAPI {
  return {
    resolve: (...segments) => resolve(...segments),
    join: (...segments) => join(...segments),
    relative: (from, to) => relative(from, to),
    isInside: isInsideResolved,
    fromRoot: (...segments) => resolve(ctx.root, ...segments),
    fromCwd: (...segments) => resolve(ctx.cwd, ...segments),
    toOutput: (...segments) => resolve(ctx.path, ...segments),
  };
}

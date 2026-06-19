import { isAbsolute, join, relative, resolve } from 'node:path';
import type { PathAPI, SmithContext } from '../types';

export function createPathAPI(ctx: SmithContext): PathAPI {
  return {
    resolve: (...segments) => resolve(...segments),
    join: (...segments) => join(...segments),
    relative: (from, to) => relative(from, to),
    isInside(child, parent) {
      const rel = relative(resolve(parent), resolve(child));
      return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
    },
    fromRoot: (...segments) => resolve(ctx.root, ...segments),
    fromCwd: (...segments) => resolve(ctx.cwd, ...segments),
    toOutput: (...segments) => resolve(ctx.path, ...segments),
  };
}

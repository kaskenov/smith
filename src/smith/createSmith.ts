import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UnsafePathError } from '../core/errors';
import { isInside } from '../core/pathSafety';
import type { SmithContext, SmithHelper } from '../types';
import { createFormatAPI } from './format';
import { createFsAPI, type FsWriteTracker } from './fs';
import { createPathAPI } from './path';

export function createSmith(
  ctx: SmithContext,
  options: {
    templateDir: string;
    allowedRoots: string[];
    onWrite?: FsWriteTracker;
  },
): SmithHelper {
  const path = createPathAPI(ctx);
  const fs = createFsAPI(path, options.allowedRoots, options.onWrite);
  const templateDir = options.templateDir;

  return {
    format: createFormatAPI(),
    path,
    fs,
    template: {
      dir: templateDir,
      read(file: string) {
        const target = resolve(templateDir, file);
        // Logical containment first (before realpath follows a symlink out of the tree).
        if (!isInside(target, templateDir)) {
          throw new UnsafePathError(`Template read escapes template dir: ${file}`);
        }
        if (lstatSync(target).isSymbolicLink()) {
          throw new UnsafePathError(`Template read refuses symlink: ${file}`);
        }
        return readFileSync(target, 'utf8');
      },
    },
  };
}

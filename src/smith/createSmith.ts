import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SmithContext, SmithHelper } from '../types';
import { createFormatAPI } from './format';
import { createFsAPI } from './fs';
import { createPathAPI } from './path';

export function createSmith(
  ctx: SmithContext,
  options: { templateDir: string; allowedRoots: string[] },
): SmithHelper {
  const path = createPathAPI(ctx);
  const fs = createFsAPI(path, options.allowedRoots);
  const templateDir = options.templateDir;

  return {
    format: createFormatAPI(),
    path,
    fs,
    template: {
      dir: templateDir,
      read(file: string) {
        return readFileSync(join(templateDir, file), 'utf8');
      },
    },
  };
}

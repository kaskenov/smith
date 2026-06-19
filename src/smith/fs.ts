import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FsAPI, PathAPI } from '../types';

function assertAllowed(target: string, allowedRoots: string[], pathApi: PathAPI): void {
  const ok = allowedRoots.some((root) => pathApi.isInside(target, root));
  if (!ok) throw new Error(`Path outside allowed roots: ${target}`);
}

export function createFsAPI(pathApi: PathAPI, allowedRoots: string[]): FsAPI {
  return {
    read(file) {
      return readFileSync(file, 'utf8');
    },
    write(file, content) {
      assertAllowed(file, allowedRoots, pathApi);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content, 'utf8');
    },
    append(file, content) {
      assertAllowed(file, allowedRoots, pathApi);
      appendFileSync(file, content, 'utf8');
    },
    exists(file) { return existsSync(file); },
    ensureDir(dir) {
      assertAllowed(dir, allowedRoots, pathApi);
      mkdirSync(dir, { recursive: true });
    },
    copy(src, dest) {
      assertAllowed(dest, allowedRoots, pathApi);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    },
  };
}

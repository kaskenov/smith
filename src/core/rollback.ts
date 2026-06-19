import { existsSync, rmSync } from 'node:fs';

export function createRollback() {
  const files: string[] = [];
  return {
    track(file: string) { files.push(file); },
    rollback() {
      for (const file of [...files].reverse()) {
        if (existsSync(file)) rmSync(file, { force: true });
      }
      files.length = 0;
    },
  };
}

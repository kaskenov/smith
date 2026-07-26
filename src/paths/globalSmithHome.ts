import { existsSync, mkdirSync, readdirSync, lstatSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isRealDirectory } from '../core/fsGuard';

/** Resolve ~/.smith or $SMITH_HOME — shared by config and core without layer inversion. */
export function getGlobalSmithDir(): string {
  if (process.env.SMITH_HOME) {
    return process.env.SMITH_HOME;
  }
  return join(homedir(), '.smith');
}

export function getGlobalTemplatesDir(): string {
  return join(getGlobalSmithDir(), 'templates');
}

export function getGlobalConfigPath(): string {
  return join(getGlobalSmithDir(), 'config.js');
}

export function getGlobalSourcesPath(): string {
  return join(getGlobalSmithDir(), 'sources.json');
}

export function ensureGlobalSmithDir(): void {
  mkdirSync(getGlobalTemplatesDir(), { recursive: true });
}

/** List real template directories only — symlink entries are skipped. */
export function listTemplateNamesInDir(templatesDir: string): string[] {
  if (!existsSync(templatesDir)) return [];
  return readdirSync(templatesDir)
    .filter((entry) => {
      const fullPath = join(templatesDir, entry);
      if (lstatSync(fullPath).isSymbolicLink()) return false;
      return isRealDirectory(fullPath);
    })
    .sort();
}

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function listAvailableTemplates(projectRoot: string): string[] {
  const templatesDir = join(projectRoot, '.smith', 'templates');
  if (!existsSync(templatesDir)) return [];
  return readdirSync(templatesDir)
    .filter((entry) => {
      const fullPath = join(templatesDir, entry);
      return statSync(fullPath).isDirectory();
    })
    .sort();
}

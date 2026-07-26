import { existsSync, lstatSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getGlobalTemplatesDir, listTemplateNamesInDir } from '../paths/globalSmithHome';
import { NotFoundError, UnsafePathError, ValidationError } from './errors';
import { isRealDirectory } from './fsGuard';
import { readSources, writeSources } from './templateSources';

export type TemplateSource = 'local' | 'global';

export interface TemplateWithSource {
  name: string;
  source: TemplateSource;
}

export interface ResolvedTemplate {
  templateDir: string;
  source: TemplateSource;
}

/** Returns true for a real directory; throws if path exists as a symlink. */
function acceptTemplateDir(dir: string): boolean {
  if (!existsSync(dir)) return false;
  if (lstatSync(dir).isSymbolicLink()) {
    throw new UnsafePathError(`Template directory is a symlink (not allowed): ${dir}`);
  }
  return isRealDirectory(dir);
}

export function listLocalTemplates(smithRoot: string | null): string[] {
  if (!smithRoot) return [];
  return listTemplateNamesInDir(join(smithRoot, '.smith', 'templates'));
}

export function listGlobalTemplates(): string[] {
  return listTemplateNamesInDir(getGlobalTemplatesDir());
}

export function listTemplatesWithSource(smithRoot: string | null): TemplateWithSource[] {
  const local = listLocalTemplates(smithRoot).map((name) => ({
    name,
    source: 'local' as const,
  }));
  const localNames = new Set(local.map((entry) => entry.name));
  const global = listGlobalTemplates()
    .filter((name) => !localNames.has(name))
    .map((name) => ({
      name,
      source: 'global' as const,
    }));
  return [...local, ...global].sort((a, b) => a.name.localeCompare(b.name));
}

export function listAvailableTemplateNames(smithRoot: string | null): string[] {
  return listTemplatesWithSource(smithRoot).map((entry) => entry.name);
}

export function resolveTemplateDir(smithRoot: string | null, template: string): ResolvedTemplate {
  if (smithRoot) {
    const localDir = join(smithRoot, '.smith', 'templates', template);
    if (acceptTemplateDir(localDir)) {
      return { templateDir: localDir, source: 'local' };
    }
  }

  const globalDir = join(getGlobalTemplatesDir(), template);
  if (acceptTemplateDir(globalDir)) {
    return { templateDir: globalDir, source: 'global' };
  }

  const available = listAvailableTemplateNames(smithRoot);
  const list = available.length > 0 ? available.join(', ') : '(none)';
  throw new NotFoundError(`Template not found: ${template}. Available templates: ${list}`);
}

export function removeGlobalTemplate(name: string): boolean {
  const templateDir = join(getGlobalTemplatesDir(), name);
  const sources = readSources();
  const existed = existsSync(templateDir) || Boolean(sources[name]);

  if (existsSync(templateDir)) {
    rmSync(templateDir, { recursive: true, force: true });
  }

  if (sources[name]) {
    delete sources[name];
    writeSources(sources);
  }

  return existed;
}

export function assertValidTemplateName(name: string): void {
  if (!name || name.includes('/') || name.includes('\\') || name === '.' || name === '..') {
    throw new ValidationError(`Invalid template name: ${name}`);
  }
}

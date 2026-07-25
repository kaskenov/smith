import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type TemplateSource = 'local' | 'global';

export function listTemplateNamesInDir(templatesDir: string): string[] {
  if (!existsSync(templatesDir)) return [];
  return readdirSync(templatesDir)
    .filter((entry) => {
      const fullPath = join(templatesDir, entry);
      return statSync(fullPath).isDirectory();
    })
    .sort();
}

export interface TemplateWithSource {
  name: string;
  source: TemplateSource;
}

export interface TemplateSourceRecord {
  type: 'path' | 'git';
  from: string;
  ref?: string;
  path?: string;
  updatedAt: string;
}

export type TemplateSources = Record<string, TemplateSourceRecord>;

export interface ResolvedTemplate {
  templateDir: string;
  source: TemplateSource;
}

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
    if (existsSync(localDir) && statSync(localDir).isDirectory()) {
      return { templateDir: localDir, source: 'local' };
    }
  }

  const globalDir = join(getGlobalTemplatesDir(), template);
  if (existsSync(globalDir) && statSync(globalDir).isDirectory()) {
    return { templateDir: globalDir, source: 'global' };
  }

  const available = listAvailableTemplateNames(smithRoot);
  const list = available.length > 0 ? available.join(', ') : '(none)';
  throw new Error(`Template not found: ${template}. Available templates: ${list}`);
}

export function readSources(): TemplateSources {
  const file = getGlobalSourcesPath();
  if (!existsSync(file)) return {};
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as TemplateSources;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeSources(sources: TemplateSources): void {
  ensureGlobalSmithDir();
  writeFileSync(getGlobalSourcesPath(), `${JSON.stringify(sources, null, 2)}\n`, 'utf8');
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
    throw new Error(`Invalid template name: ${name}`);
  }
}

import { existsSync, lstatSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getGlobalTemplatesDir, listTemplateNamesInDir } from '../paths/globalSmithHome';
import { NotFoundError, UnsafePathError } from './errors';
import { assertNotSymlink, isRealDirectory } from './fsGuard';
import { isInside, isInsideResolved } from './pathSafety';
import { assertValidTemplateName } from './templateName';
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

export { assertValidTemplateName, isValidTemplateName } from './templateName';

/** Returns true for a real directory; throws if path exists as a symlink. */
function acceptTemplateDir(dir: string): boolean {
  if (!existsSync(dir)) return false;
  if (lstatSync(dir).isSymbolicLink()) {
    throw new UnsafePathError(`Template directory is a symlink (not allowed): ${dir}`);
  }
  return isRealDirectory(dir);
}

function assertTemplateDirContained(templateDir: string, templatesRoot: string, name: string): void {
  if (!isInside(templateDir, templatesRoot) || !isInsideResolved(templateDir, templatesRoot)) {
    throw new UnsafePathError(`Template path escapes templates root: ${name}`);
  }
}

/** Reject intermediate .smith or templates directory symlinks under a project. */
function assertSafeProjectTemplatesRoot(smithRoot: string): string {
  const smithDir = join(smithRoot, '.smith');
  assertNotSymlink(smithDir, '.smith directory');
  if (!isRealDirectory(smithDir)) {
    throw new UnsafePathError(`.smith is not a real directory: ${smithDir}`);
  }
  if (!isInsideResolved(smithDir, smithRoot)) {
    throw new UnsafePathError(`.smith escapes project root after resolve: ${smithDir}`);
  }
  const templatesRoot = join(smithDir, 'templates');
  if (existsSync(templatesRoot)) {
    assertNotSymlink(templatesRoot, 'templates directory');
    if (!isInsideResolved(templatesRoot, smithDir)) {
      throw new UnsafePathError(`templates escapes .smith after resolve: ${templatesRoot}`);
    }
  }
  return templatesRoot;
}

export function listLocalTemplates(smithRoot: string | null): string[] {
  if (!smithRoot) return [];
  const templatesRoot = assertSafeProjectTemplatesRoot(smithRoot);
  if (!existsSync(templatesRoot) || !isRealDirectory(templatesRoot)) return [];
  return listTemplateNamesInDir(templatesRoot);
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
  assertValidTemplateName(template);

  if (smithRoot) {
    const templatesRoot = assertSafeProjectTemplatesRoot(smithRoot);
    const localDir = join(templatesRoot, template);
    assertTemplateDirContained(localDir, templatesRoot, template);
    if (acceptTemplateDir(localDir)) {
      return { templateDir: localDir, source: 'local' };
    }
  }

  const globalRoot = getGlobalTemplatesDir();
  assertNotSymlink(globalRoot, 'global templates directory');
  const globalDir = join(globalRoot, template);
  assertTemplateDirContained(globalDir, globalRoot, template);
  if (acceptTemplateDir(globalDir)) {
    return { templateDir: globalDir, source: 'global' };
  }

  const available = listAvailableTemplateNames(smithRoot);
  const list = available.length > 0 ? available.join(', ') : '(none)';
  throw new NotFoundError(`Template not found: ${template}. Available templates: ${list}`);
}

export function removeGlobalTemplate(name: string): boolean {
  assertValidTemplateName(name);
  const templatesRoot = getGlobalTemplatesDir();
  assertNotSymlink(templatesRoot, 'global templates directory');
  const templateDir = join(templatesRoot, name);
  assertTemplateDirContained(templateDir, templatesRoot, name);

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

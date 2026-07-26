import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { projectConfigStarterContent } from '../config/starterConfig';
import { NotFoundError } from '../core/errors';
import { assertValidTemplateName } from '../core/resolveTemplate';
import { findSmithRoot } from '../core/resolveRoot';
import { resolveSmithTemplateFile, resolveUnderSmithDir } from '../core/smithPath';

export interface InitProjectResult {
  root: string;
  configPath: string;
  configCreated: boolean;
  templatesPath: string;
}

export interface CreateProjectConfigResult {
  root: string;
  configPath: string;
  created: boolean;
}

export interface CreateTemplateResult {
  root: string;
  template: string;
  files: string[];
}

function projectConfigPath(projectRoot: string): string {
  return resolveUnderSmithDir(projectRoot, 'config.js');
}

function projectTemplatesPath(projectRoot: string): string {
  return join(projectRoot, '.smith', 'templates');
}

function ensureProjectConfig(projectRoot: string): { path: string; created: boolean } {
  const configPath = projectConfigPath(projectRoot);
  if (existsSync(configPath)) {
    return { path: configPath, created: false };
  }
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, projectConfigStarterContent(), 'utf8');
  return { path: configPath, created: true };
}

/** Bootstrap .smith/config.js + templates/ in a project directory. */
export async function initProject(cwd: string): Promise<InitProjectResult> {
  const templatesPath = projectTemplatesPath(cwd);
  const config = ensureProjectConfig(cwd);
  mkdirSync(templatesPath, { recursive: true });
  return {
    root: cwd,
    configPath: config.path,
    configCreated: config.created,
    templatesPath,
  };
}

/** Create .smith/config.js when missing; requires an existing .smith/. */
export async function createProjectConfig(cwd: string): Promise<CreateProjectConfigResult> {
  const root = findSmithRoot(cwd);
  if (!root) {
    throw new NotFoundError('No .smith directory found.');
  }
  const config = ensureProjectConfig(root);
  return { root, configPath: config.path, created: config.created };
}

export async function createTemplate(
  cwd: string,
  name: string,
  files?: Array<{ path: string; content: string }>,
): Promise<CreateTemplateResult> {
  assertValidTemplateName(name);
  const root = findSmithRoot(cwd);
  if (!root) {
    throw new NotFoundError('No .smith directory found.');
  }

  const templateRoot = join(root, '.smith', 'templates', name);
  mkdirSync(templateRoot, { recursive: true });

  const writeFiles =
    files && files.length > 0
      ? files
      : [{ path: '{{name}}.txt', content: 'Hello {{name}}\n' }];

  const writtenPaths: string[] = [];
  for (const file of writeFiles) {
    const outPath = resolveSmithTemplateFile(root, name, file.path);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, file.content, 'utf8');
    writtenPaths.push(outPath);
  }

  return { root, template: name, files: writtenPaths };
}

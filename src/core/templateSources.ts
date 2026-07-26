import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  ensureGlobalSmithDir,
  getGlobalSourcesPath,
} from '../paths/globalSmithHome';

export interface TemplateSourceRecord {
  type: 'path' | 'git';
  from: string;
  ref?: string;
  path?: string;
  updatedAt: string;
}

export type TemplateSources = Record<string, TemplateSourceRecord>;

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

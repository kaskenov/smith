import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import {
  ensureGlobalSmithDir,
  getGlobalSourcesPath,
} from '../paths/globalSmithHome';
import { isValidTemplateName } from './templateName';

export interface TemplateSourceRecord {
  type: 'path' | 'git';
  from: string;
  ref?: string;
  path?: string;
  updatedAt: string;
}

export type TemplateSources = Record<string, TemplateSourceRecord>;

function isSourceRecord(value: unknown): value is TemplateSourceRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.type !== 'path' && record.type !== 'git') return false;
  if (typeof record.from !== 'string' || record.from.length === 0) return false;
  if (record.ref !== undefined && typeof record.ref !== 'string') return false;
  if (record.path !== undefined && typeof record.path !== 'string') return false;
  if (typeof record.updatedAt !== 'string') return false;
  return true;
}

export function readSources(): TemplateSources {
  const file = getGlobalSourcesPath();
  if (!existsSync(file)) return {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const sources: TemplateSources = {};
    for (const [name, record] of Object.entries(parsed as Record<string, unknown>)) {
      if (!isValidTemplateName(name)) continue;
      if (!isSourceRecord(record)) continue;
      sources[name] = record;
    }
    return sources;
  } catch {
    return {};
  }
}

export function writeSources(sources: TemplateSources): void {
  ensureGlobalSmithDir();
  const path = getGlobalSourcesPath();
  const tmpPath = `${path}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(sources, null, 2)}\n`, 'utf8');
  renameSync(tmpPath, path);
}

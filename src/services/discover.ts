import {
  listTemplatesWithSource,
  resolveTemplateDir,
  type ResolvedTemplate,
  type TemplateWithSource,
} from '../core/resolveTemplate';
import { findSmithRoot } from '../core/resolveRoot';

/** Thin discovery façade so CLI/MCP do not import core resolve helpers directly. */

export function discoverSmithRoot(cwd: string): string | null {
  return findSmithRoot(cwd);
}

export function discoverTemplates(cwd: string): TemplateWithSource[] {
  return listTemplatesWithSource(findSmithRoot(cwd));
}

export function discoverTemplateDir(cwd: string, template: string): ResolvedTemplate {
  return resolveTemplateDir(findSmithRoot(cwd), template);
}

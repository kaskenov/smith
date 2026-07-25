import { basename } from 'node:path';
import { listGlobalTemplates, listTemplatesWithSource } from '../core/globalTemplates';
import { findSmithRoot } from '../core/resolveRoot';
import { findNewerVersion } from '../package/registry';
import { readPackageVersion } from '../package/version';

export interface SmithBannerContext {
  projectContext?: string;
  updateAvailable?: string;
}

export function resolveProjectContext(cwd = process.cwd()): string | undefined {
  const smithRoot = findSmithRoot(cwd);
  const templates = listTemplatesWithSource(smithRoot);
  const templateList =
    templates.length > 0
      ? templates.map((entry) => `${entry.name} (${entry.source})`).join(', ')
      : '(none)';

  if (smithRoot) {
    return `Project: ${basename(smithRoot)} · templates: ${templateList}`;
  }

  const globals = listGlobalTemplates();
  if (globals.length === 0) return undefined;
  return `Global templates: ${globals.join(', ')}`;
}

export async function resolveSmithBannerContext(options: {
  checkForUpdate?: boolean;
  cwd?: string;
} = {}): Promise<SmithBannerContext> {
  const cwd = options.cwd ?? process.cwd();
  const context: SmithBannerContext = {
    projectContext: resolveProjectContext(cwd),
  };

  if (options.checkForUpdate && process.env.SMITH_SKIP_UPDATE_CHECK !== '1') {
    const latest = await findNewerVersion(readPackageVersion());
    if (latest) {
      context.updateAvailable = latest;
    }
  }

  return context;
}

import { basename } from 'node:path';
import { listAvailableTemplates } from '../core/listTemplates';
import { findSmithRoot } from '../core/resolveRoot';
import { findNewerVersion } from '../package/registry';
import { readPackageVersion } from '../package/version';

export interface SmithBannerContext {
  projectContext?: string;
  updateAvailable?: string;
}

export function resolveProjectContext(cwd = process.cwd()): string | undefined {
  const smithRoot = findSmithRoot(cwd);
  if (!smithRoot) return undefined;

  const templates = listAvailableTemplates(smithRoot);
  const projectName = basename(smithRoot);
  const templateList = templates.length > 0 ? templates.join(', ') : '(none)';

  return `Project: ${projectName} · templates: ${templateList}`;
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

import { loadRootConfig, loadTemplateConfig } from '../config/loadConfig';
import { loadGlobalConfig } from '../config/loadGlobalConfig';
import { mergeConfigLayers } from '../config/mergeConfig';
import { validatePresets } from '../config/validatePresets';
import { ValidationError } from '../core/errors';
import { assertTemplateTreeSafe } from '../core/replicateTree';
import type { TemplateSource } from '../core/resolveTemplate';
import { getGlobalSmithDir } from '../paths/globalSmithHome';
import { discoverSmithRoot, discoverTemplateDir } from './discover';

export interface ValidateResult {
  ok: true;
  root: string | null;
  globalSmithDir: string;
  template?: string;
  source?: TemplateSource;
  validated: Array<'global' | 'root' | 'template'>;
}

export async function validateSmith(options: {
  cwd?: string;
  template?: string;
}): Promise<ValidateResult> {
  const cwd = options.cwd ?? process.cwd();
  const root = discoverSmithRoot(cwd);
  const globalConfig = await loadGlobalConfig();
  const projectConfig = await loadRootConfig(root);

  const globalErrors = validatePresets(globalConfig.presets, globalConfig.defaultPreset);
  if (globalErrors.length > 0) {
    throw new ValidationError(globalErrors.join('\n'));
  }

  const projectErrors = validatePresets(projectConfig.presets, projectConfig.defaultPreset);
  if (projectErrors.length > 0) {
    throw new ValidationError(projectErrors.join('\n'));
  }

  if (!options.template) {
    return {
      ok: true,
      root,
      globalSmithDir: getGlobalSmithDir(),
      validated: root ? ['global', 'root'] : ['global'],
    };
  }

  const { templateDir, source } = discoverTemplateDir(cwd, options.template);
  assertTemplateTreeSafe(templateDir);
  const templateConfig = await loadTemplateConfig(templateDir);
  const merged = mergeConfigLayers(globalConfig, projectConfig, templateConfig);
  const mergedErrors = validatePresets(merged.presets, merged.defaultPreset);
  if (mergedErrors.length > 0) {
    throw new ValidationError(mergedErrors.join('\n'));
  }

  return {
    ok: true,
    root,
    globalSmithDir: getGlobalSmithDir(),
    template: options.template,
    source,
    validated: root ? ['global', 'root', 'template'] : ['global', 'template'],
  };
}

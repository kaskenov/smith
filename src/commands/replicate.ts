import { resolve } from 'node:path';
import { loadRootConfig, loadTemplateConfig } from '../config/loadConfig';
import { loadGlobalConfig } from '../config/loadGlobalConfig';
import { extractHooks, mergeConfigLayers } from '../config/mergeConfig';
import { resolvePresetSelection } from '../config/resolvePreset';
import { validatePresets } from '../config/validatePresets';
import { resolveTemplateDir } from '../core/globalTemplates';
import { replicateTree } from '../core/replicateTree';
import { resolveOutputPath } from '../core/resolvePath';
import { findSmithRoot } from '../core/resolveRoot';
import { resolveVariables } from '../core/resolveVariables';
import { createRollback } from '../core/rollback';
import { createSmith } from '../smith/createSmith';
import { brandSmith } from '../terminal/brand';
import type { ConflictPolicy, ReplicateOptions, SmithContext } from '../types';

export async function runReplicate(options: ReplicateOptions): Promise<void> {
  const cwd = process.cwd();
  const discoveredRoot = findSmithRoot(cwd);
  const { templateDir } = resolveTemplateDir(discoveredRoot, options.template);

  const globalConfig = await loadGlobalConfig();
  const projectConfig = await loadRootConfig(discoveredRoot);
  const templateConfig = await loadTemplateConfig(templateDir);
  const merged = mergeConfigLayers(globalConfig, projectConfig, templateConfig);

  const globalHooks = extractHooks(globalConfig);
  const projectHooks = extractHooks(projectConfig);
  const templateHooks = extractHooks(templateConfig);

  const presetErrors = validatePresets(merged.presets, merged.defaultPreset);
  if (presetErrors.length > 0) {
    throw new Error(presetErrors.join('\n'));
  }

  const presetSelection = resolvePresetSelection({
    preset: options.preset,
    defaultPreset: merged.defaultPreset,
    presets: merged.presets,
  });
  if (presetSelection.warn) {
    console.warn(presetSelection.warn);
  }

  const outputBase = discoveredRoot
    ? projectConfig.rootDir
      ? resolve(discoveredRoot, projectConfig.rootDir)
      : discoveredRoot
    : cwd;

  const defaultOutput = templateConfig?.rootDir
    ? resolveOutputPath(templateConfig.rootDir, {
        cwd,
        root: outputBase,
        defaultOutput: outputBase,
      })
    : outputBase;

  const outputPath = resolveOutputPath(options.path, {
    cwd,
    root: outputBase,
    defaultOutput,
  });

  const ctx: SmithContext = {
    name: options.name,
    path: outputPath,
    template: options.template,
    cwd,
    root: outputBase,
  };

  const smith = createSmith(ctx, {
    templateDir,
    allowedRoots: [outputPath, outputBase, discoveredRoot ?? cwd],
  });

  const rollback = createRollback();
  const policy: ConflictPolicy = options.force ? 'force' : options.skip ? 'skip' : 'prompt';

  try {
    if (globalHooks.before) {
      await globalHooks.before(ctx, smith);
    }
    if (projectHooks.before) {
      await projectHooks.before(ctx, smith);
    }
    if (templateHooks.before) {
      await templateHooks.before(ctx, smith);
    }

    const vars = resolveVariables(merged, ctx, smith);
    vars.name = options.name;

    await replicateTree({
      templateDir,
      outputRoot: outputPath,
      vars,
      delimiters: merged.placeholder,
      policy,
      include: presetSelection.include,
      exclude: presetSelection.exclude,
      onWrite: (file) => rollback.track(file),
    });

    if (templateHooks.after) {
      await templateHooks.after(ctx, smith);
    }
    if (projectHooks.after) {
      await projectHooks.after(ctx, smith);
    }
    if (globalHooks.after) {
      await globalHooks.after(ctx, smith);
    }

    console.log(brandSmith(`smith replicated ${options.template} -> ${outputPath}`));
  } catch (error) {
    rollback.rollback();
    throw error;
  }
}

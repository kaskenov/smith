import { resolve } from 'node:path';
import { loadRootConfig, loadTemplateConfig } from '../config/loadConfig';
import { loadGlobalConfig } from '../config/loadGlobalConfig';
import { collectHookChain, mergeConfigLayers } from '../config/mergeConfig';
import { resolvePresetSelection } from '../config/resolvePreset';
import { validatePresets } from '../config/validatePresets';
import { resolveConflictByPolicy } from '../core/conflicts';
import { UsageError, ValidationError } from '../core/errors';
import { resolveTemplateDir } from '../core/resolveTemplate';
import { assertTemplateTreeSafe, replicateTree } from '../core/replicateTree';
import { assertRelativeConfigPath, resolveOutputPath } from '../core/resolvePath';
import { findSmithRoot } from '../core/resolveRoot';
import { resolveVariables } from '../core/resolveVariables';
import { createRollback } from '../core/rollback';
import { createSmith } from '../smith/createSmith';
import type { ConflictPolicy, ReplicateOptions, ReplicateResult, SmithContext } from '../types';

/**
 * Resolve output base from project rootDir, falling back to global rootDir.
 * Template rootDir is a default *output path*, not the project base — handled separately.
 * Absolute rootDir values are always rejected.
 */
export function resolveOutputBase(
  discoveredRoot: string | null,
  cwd: string,
  globalRootDir: string | undefined,
  projectRootDir: string | undefined,
): string {
  if (!discoveredRoot) return cwd;
  const baseRootDir = projectRootDir ?? globalRootDir;
  if (baseRootDir === undefined) return discoveredRoot;
  assertRelativeConfigPath(baseRootDir, 'rootDir');
  return resolve(discoveredRoot, baseRootDir);
}

export async function replicate(options: ReplicateOptions): Promise<ReplicateResult> {
  if (options.force && options.skip) {
    throw new UsageError('Cannot use --force and --skip together');
  }

  const cwd = options.cwd ?? process.cwd();
  const discoveredRoot = findSmithRoot(cwd);
  const { templateDir } = resolveTemplateDir(discoveredRoot, options.template);

  // Reject symlink gadgets before require(config.js) or hooks can use them.
  assertTemplateTreeSafe(templateDir);

  const globalConfig = await loadGlobalConfig();
  const projectConfig = await loadRootConfig(discoveredRoot);
  const templateConfig = await loadTemplateConfig(templateDir);
  const merged = mergeConfigLayers(globalConfig, projectConfig, templateConfig);

  const hooks = collectHookChain(globalConfig, projectConfig, templateConfig);

  const presetErrors = validatePresets(merged.presets, merged.defaultPreset);
  if (presetErrors.length > 0) {
    throw new ValidationError(presetErrors.join('\n'));
  }

  const presetSelection = resolvePresetSelection({
    preset: options.preset,
    defaultPreset: merged.defaultPreset,
    presets: merged.presets,
  });

  const warnings: string[] = [];
  if (presetSelection.warn) {
    warnings.push(presetSelection.warn);
  }

  const outputBase = resolveOutputBase(
    discoveredRoot,
    cwd,
    globalConfig.rootDir,
    projectConfig.rootDir,
  );

  assertRelativeConfigPath(templateConfig?.rootDir, 'template rootDir');

  const defaultOutput = templateConfig?.rootDir
    ? resolveOutputPath(templateConfig.rootDir, {
        cwd,
        root: outputBase,
        defaultOutput: outputBase,
        allowAbsolute: false,
      })
    : outputBase;

  const outputPath = resolveOutputPath(options.path, {
    cwd,
    root: outputBase,
    defaultOutput,
    allowAbsolute: Boolean(options.allowAbsolutePath),
  });

  const ctx: SmithContext = {
    name: options.name,
    path: outputPath,
    template: options.template,
    cwd,
    root: outputBase,
  };

  const rollback = createRollback({ cleanEmptyDirsUpTo: outputPath });
  const smith = createSmith(ctx, {
    templateDir,
    // outputPath + outputBase cover generated files and fromRoot hooks (project root / rootDir).
    allowedRoots: [outputPath, outputBase],
    onWrite: (file, previousContent, meta) => rollback.track(file, previousContent, meta),
  });

  const policy: ConflictPolicy = options.force ? 'force' : options.skip ? 'skip' : 'prompt';
  const resolveConflict = options.conflictResolver ?? resolveConflictByPolicy;

  try {
    for (const before of hooks.before) {
      await before(ctx, smith);
    }

    const vars = resolveVariables(merged, ctx, smith);
    vars.name = options.name;

    const treeResult = await replicateTree({
      templateDir,
      outputRoot: outputPath,
      vars,
      delimiters: merged.placeholder,
      policy,
      resolveConflict,
      include: presetSelection.include,
      exclude: presetSelection.exclude,
      onWrite: (file, previousContent) => rollback.track(file, previousContent),
    });

    for (const after of [...hooks.after].reverse()) {
      await after(ctx, smith);
    }

    return {
      outputPath,
      written: treeResult.written,
      skipped: treeResult.skipped,
      warnings,
    };
  } catch (error) {
    rollback.rollback();
    throw error;
  }
}

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadRootConfig, loadTemplateConfig } from '../config/loadConfig';
import { extractLocalHooks, mergeConfigs } from '../config/mergeConfig';
import { replicateTree } from '../core/replicateTree';
import { resolveOutputPath } from '../core/resolvePath';
import { findSmithRoot } from '../core/resolveRoot';
import { resolveVariables } from '../core/resolveVariables';
import { createRollback } from '../core/rollback';
import { createSmith } from '../smith/createSmith';
import { brandSmith } from '../terminal/brand';
import type { ConflictPolicy, ReplicateOptions, SmithContext } from '../types';

function listAvailableTemplates(projectRoot: string): string[] {
  const templatesDir = join(projectRoot, '.smith', 'templates');
  if (!existsSync(templatesDir)) return [];
  return readdirSync(templatesDir).filter((entry) => {
    const fullPath = join(templatesDir, entry);
    return statSync(fullPath).isDirectory();
  }).sort();
}

export async function runReplicate(options: ReplicateOptions): Promise<void> {
  const cwd = process.cwd();
  const discoveredRoot = findSmithRoot(cwd);
  if (!discoveredRoot) {
    throw new Error('No .smith directory found. Run from a smith project.');
  }

  const rootConfig = await loadRootConfig(discoveredRoot);
  const projectRoot = rootConfig.rootDir ? resolve(discoveredRoot, rootConfig.rootDir) : discoveredRoot;
  const templateDir = join(projectRoot, '.smith', 'templates', options.template);

  if (!existsSync(templateDir)) {
    const available = listAvailableTemplates(projectRoot);
    const list = available.length > 0 ? available.join(', ') : '(none)';
    throw new Error(`Template not found: ${options.template}. Available templates: ${list}`);
  }

  const localInput = await loadTemplateConfig(templateDir);
  const merged = mergeConfigs(rootConfig, localInput);
  const localHooks = extractLocalHooks(localInput);

  const defaultOutput = localInput?.rootDir
    ? resolveOutputPath(localInput.rootDir, {
        cwd,
        root: projectRoot,
        defaultOutput: projectRoot,
      })
    : projectRoot;

  const outputPath = resolveOutputPath(options.path, {
    cwd,
    root: projectRoot,
    defaultOutput,
  });

  const ctx: SmithContext = {
    name: options.name,
    path: outputPath,
    template: options.template,
    cwd,
    root: projectRoot,
  };

  const smith = createSmith(ctx, {
    templateDir,
    allowedRoots: [outputPath, projectRoot],
  });

  const rollback = createRollback();
  const policy: ConflictPolicy = options.force ? 'force' : options.skip ? 'skip' : 'prompt';

  try {
    if (merged.before) {
      await merged.before(ctx, smith);
    }
    if (localHooks.before) {
      await localHooks.before(ctx, smith);
    }

    const vars = resolveVariables(merged, ctx, smith);
    vars.name = options.name;

    await replicateTree({
      templateDir,
      outputRoot: outputPath,
      vars,
      delimiters: merged.placeholder,
      policy,
      onWrite: (file) => rollback.track(file),
    });

    if (localHooks.after) {
      await localHooks.after(ctx, smith);
    }
    if (merged.after) {
      await merged.after(ctx, smith);
    }

    console.log(brandSmith(`smith replicated ${options.template} -> ${outputPath}`));
  } catch (error) {
    rollback.rollback();
    throw error;
  }
}

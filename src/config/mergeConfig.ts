import type { HookFn, SmithConfig, SmithConfigData, SmithConfigInput } from '../types';

/**
 * Empty loaded config. Typed as SmithConfig (hooks optional) so loaders need no cast;
 * mergeConfigs still treats this as data-only.
 */
export function emptySmithConfig(): SmithConfig {
  return {
    placeholder: ['{{', '}}'],
    variables: {},
  };
}

/**
 * Merge config *data* only (rootDir, placeholder, variables, presets).
 * Hooks are intentionally omitted — use extractHooks / collectHookChain per layer.
 */
export function mergeConfigs(root: SmithConfigData, local?: SmithConfigInput): SmithConfigData {
  if (!local) {
    return {
      rootDir: root.rootDir,
      placeholder: root.placeholder,
      variables: { ...root.variables },
      defaultPreset: root.defaultPreset,
      presets: root.presets,
    };
  }
  return {
    rootDir: local.rootDir ?? root.rootDir,
    placeholder: local.placeholder ?? root.placeholder,
    variables: { ...root.variables, ...local.variables },
    defaultPreset: local.defaultPreset ?? root.defaultPreset,
    presets:
      local.presets === undefined && root.presets === undefined
        ? undefined
        : { ...(root.presets ?? {}), ...(local.presets ?? {}) },
  };
}

export function mergeConfigLayers(
  globalConfig: SmithConfigData,
  projectConfig: SmithConfigData,
  templateConfig?: SmithConfigInput,
): SmithConfigData {
  return mergeConfigs(mergeConfigs(globalConfig, projectConfig), templateConfig);
}

export function extractHooks(config?: SmithConfigInput | SmithConfig): {
  before?: HookFn;
  after?: HookFn;
} {
  return {
    before: config?.before,
    after: config?.after,
  };
}

export interface HookChain {
  before: HookFn[];
  after: HookFn[];
}

/** Collect hooks in run order: global → project → template (after runs reverse). */
export function collectHookChain(
  globalConfig?: SmithConfigInput | SmithConfig,
  projectConfig?: SmithConfigInput | SmithConfig,
  templateConfig?: SmithConfigInput | SmithConfig,
): HookChain {
  const before: HookFn[] = [];
  const after: HookFn[] = [];
  for (const layer of [globalConfig, projectConfig, templateConfig]) {
    const hooks = extractHooks(layer);
    if (hooks.before) before.push(hooks.before);
    if (hooks.after) after.push(hooks.after);
  }
  return { before, after };
}

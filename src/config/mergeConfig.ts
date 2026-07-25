import type { HookFn, SmithConfig, SmithConfigInput } from '../types';

export function emptySmithConfig(): SmithConfig {
  return {
    placeholder: ['{{', '}}'],
    variables: {},
  };
}

export function mergeConfigs(root: SmithConfig, local?: SmithConfigInput): SmithConfig {
  if (!local) return root;
  return {
    rootDir: local.rootDir ?? root.rootDir,
    placeholder: local.placeholder ?? root.placeholder,
    variables: { ...root.variables, ...local.variables },
    before: root.before,
    after: root.after,
    defaultPreset: local.defaultPreset ?? root.defaultPreset,
    presets: local.presets ?? root.presets,
  };
}

export function mergeConfigLayers(
  globalConfig: SmithConfig,
  projectConfig: SmithConfig,
  templateConfig?: SmithConfigInput,
): SmithConfig {
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

export function extractLocalHooks(local?: SmithConfigInput) {
  return extractHooks(local);
}

import type { SmithConfig, SmithConfigInput } from '../types';

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

export function extractLocalHooks(local?: SmithConfigInput) {
  return {
    before: local?.before,
    after: local?.after,
  };
}

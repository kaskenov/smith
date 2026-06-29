import type { PresetConfig } from '../types';

export interface PresetSelection {
  include?: string[];
  exclude?: string[];
  presetName?: string;
  warn?: string;
}

function formatPresetList(presets: Record<string, PresetConfig>): string {
  return Object.keys(presets).sort().join(', ');
}

export function resolvePresetSelection(options: {
  preset?: string;
  defaultPreset?: string;
  presets?: Record<string, PresetConfig>;
}): PresetSelection {
  const { preset, defaultPreset, presets } = options;
  const presetNames = presets ? Object.keys(presets) : [];

  if (preset !== undefined) {
    if (!presets || !(preset in presets)) {
      const available = presets ? formatPresetList(presets) : '(none)';
      throw new Error(`Preset not found: ${preset}. Available presets: ${available}`);
    }

    const selected = presets[preset];
    return {
      presetName: preset,
      include: selected.include,
      exclude: selected.exclude,
    };
  }

  if (defaultPreset !== undefined) {
    if (!presets || !(defaultPreset in presets)) {
      throw new Error(`defaultPreset "${defaultPreset}" is not defined in presets`);
    }

    const selected = presets[defaultPreset];
    return {
      presetName: defaultPreset,
      include: selected.include,
      exclude: selected.exclude,
    };
  }

  if (presetNames.length > 0) {
    return {
      warn: `smith: no preset selected; replicating all template files. Available: ${formatPresetList(presets!)}. Set defaultPreset or pass --preset.`,
    };
  }

  return {};
}

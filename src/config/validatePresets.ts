import type { PresetConfig } from '../types';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validatePresetEntry(name: string, preset: unknown, errors: string[]): void {
  if (preset === null || typeof preset !== 'object' || Array.isArray(preset)) {
    errors.push(`presets.${name} must be an object with optional include and exclude arrays`);
    return;
  }

  const config = preset as PresetConfig;
  if (config.include !== undefined && !isStringArray(config.include)) {
    errors.push(`presets.${name}.include must be an array of path patterns`);
  }
  if (config.exclude !== undefined && !isStringArray(config.exclude)) {
    errors.push(`presets.${name}.exclude must be an array of path patterns`);
  }
}

export function validatePresets(
  presets?: Record<string, PresetConfig>,
  defaultPreset?: string,
): string[] {
  const errors: string[] = [];

  if (defaultPreset !== undefined && typeof defaultPreset !== 'string') {
    errors.push('defaultPreset must be a string');
  }

  if (presets === undefined) {
    if (defaultPreset !== undefined) {
      errors.push('defaultPreset requires presets to be defined');
    }
    return errors;
  }

  if (presets === null || typeof presets !== 'object' || Array.isArray(presets)) {
    errors.push('presets must be an object');
    return errors;
  }

  for (const [name, preset] of Object.entries(presets)) {
    validatePresetEntry(name, preset, errors);
  }

  if (defaultPreset !== undefined && !(defaultPreset in presets)) {
    errors.push(`defaultPreset "${defaultPreset}" is not defined in presets`);
  }

  return errors;
}

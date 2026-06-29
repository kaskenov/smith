import { createFormatAPI } from '../smith/format';
import { validatePresets } from './validatePresets';
import type { SmithConfig, SmithConfigInput } from '../types';

export function createSmithConfig(
  fn: (smith: { format: ReturnType<typeof createFormatAPI> }) => SmithConfigInput,
): SmithConfig {
  const smith = { format: createFormatAPI() };
  const input = fn(smith) ?? {};

  if (input.placeholder && input.placeholder.length !== 2) {
    throw new Error('placeholder must be a [open, close] tuple');
  }

  const presetErrors = validatePresets(input.presets, input.defaultPreset);
  if (presetErrors.length > 0) {
    throw new Error(presetErrors.join('\n'));
  }

  return {
    rootDir: input.rootDir,
    placeholder: input.placeholder ?? ['{{', '}}'],
    variables: input.variables ?? {},
    before: input.before,
    after: input.after,
    defaultPreset: input.defaultPreset,
    presets: input.presets,
  };
}

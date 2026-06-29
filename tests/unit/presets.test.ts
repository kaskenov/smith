import { resolvePresetSelection } from '../../src/config/resolvePreset';
import { validatePresets } from '../../src/config/validatePresets';

describe('validatePresets', () => {
  it('accepts valid presets and defaultPreset', () => {
    expect(
      validatePresets(
        {
          core: { include: ['{{name}}.vue'] },
          full: { include: ['**/*'], exclude: ['**/*.spec.ts'] },
        },
        'core',
      ),
    ).toEqual([]);
  });

  it('rejects unknown defaultPreset', () => {
    expect(validatePresets({ core: { include: ['{{name}}.vue'] } }, 'missing')).toEqual([
      'defaultPreset "missing" is not defined in presets',
    ]);
  });

  it('rejects defaultPreset without presets', () => {
    expect(validatePresets(undefined, 'core')).toEqual(['defaultPreset requires presets to be defined']);
  });

  it('rejects invalid preset shape', () => {
    expect(validatePresets({ bad: 'nope' as unknown as { include: string[] } })).toEqual([
      'presets.bad must be an object with optional include and exclude arrays',
    ]);
  });

  it('rejects non-string include patterns', () => {
    expect(
      validatePresets({ bad: { include: [1] as unknown as string[] } }),
    ).toEqual(['presets.bad.include must be an array of path patterns']);
  });

  it('rejects non-string exclude patterns', () => {
    expect(
      validatePresets({ bad: { exclude: [false] as unknown as string[] } }),
    ).toEqual(['presets.bad.exclude must be an array of path patterns']);
  });

  it('rejects non-string defaultPreset', () => {
    expect(validatePresets({ '1': { include: ['a'] } }, 1 as unknown as string)).toEqual([
      'defaultPreset must be a string',
    ]);
  });

  it('rejects presets that are not an object', () => {
    expect(validatePresets(null as unknown as Record<string, { include: string[] }>)).toEqual([
      'presets must be an object',
    ]);
  });
});

describe('resolvePresetSelection', () => {
  const presets = {
    core: {
      include: ['{{name}}.vue', '{{name}}.types.ts'],
    },
    full: {
      include: ['**/*'],
      exclude: ['**/*.spec.ts'],
    },
  };

  it('uses CLI preset when provided', () => {
    expect(resolvePresetSelection({ preset: 'full', presets })).toEqual({
      presetName: 'full',
      include: ['**/*'],
      exclude: ['**/*.spec.ts'],
    });
  });

  it('uses defaultPreset when CLI preset is omitted', () => {
    expect(resolvePresetSelection({ defaultPreset: 'core', presets })).toEqual({
      presetName: 'core',
      include: ['{{name}}.vue', '{{name}}.types.ts'],
      exclude: undefined,
    });
  });

  it('warns and replicates all files when presets exist but none selected', () => {
    const selection = resolvePresetSelection({ presets });
    expect(selection.include).toBeUndefined();
    expect(selection.exclude).toBeUndefined();
    expect(selection.warn).toContain('no preset selected');
    expect(selection.warn).toContain('core, full');
  });

  it('returns empty selection when presets are not configured', () => {
    expect(resolvePresetSelection({})).toEqual({});
  });

  it('throws for unknown CLI preset', () => {
    expect(() => resolvePresetSelection({ preset: 'missing', presets })).toThrow(
      'Preset not found: missing. Available presets: core, full',
    );
  });

  it('throws for CLI preset when presets are not configured', () => {
    expect(() => resolvePresetSelection({ preset: 'core' })).toThrow(
      'Preset not found: core. Available presets: (none)',
    );
  });

  it('throws when defaultPreset is not defined in presets', () => {
    expect(() => resolvePresetSelection({ defaultPreset: 'missing', presets })).toThrow(
      'defaultPreset "missing" is not defined in presets',
    );
  });
});

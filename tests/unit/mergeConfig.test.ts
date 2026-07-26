import { collectHookChain, extractHooks, mergeConfigs } from '../../src/config/mergeConfig';
import type { SmithConfig } from '../../src/types';

describe('mergeConfigs', () => {
  const root: SmithConfig = {
    placeholder: ['{{', '}}'],
    variables: {
      A: () => 'a',
      B: () => 'b-root',
    },
    before: async () => undefined,
    after: async () => undefined,
  };

  it('local variables override root keys', () => {
    const merged = mergeConfigs(root, {
      variables: { B: () => 'b-local' },
    });
    expect(merged.variables.B({} as any, {} as any)).toBe('b-local');
    expect(merged.variables.A({} as any, {} as any)).toBe('a');
  });

  it('local placeholder overrides root', () => {
    const merged = mergeConfigs(root, { placeholder: ['<%', '%>'] });
    expect(merged.placeholder).toEqual(['<%', '%>']);
  });

  it('omits hooks from merged data config', () => {
    const merged = mergeConfigs(root, { variables: { B: () => 'b-local' } });
    expect((merged as SmithConfig).before).toBeUndefined();
    expect((merged as SmithConfig).after).toBeUndefined();
  });

  it('uses root presets when local config omits presets', () => {
    const rootWithPresets: SmithConfig = {
      ...root,
      defaultPreset: 'core',
      presets: {
        core: { include: ['{{name}}.vue'] },
      },
    };
    const merged = mergeConfigs(rootWithPresets, {
      variables: { B: () => 'b-local' },
    });
    expect(merged.defaultPreset).toBe('core');
    expect(merged.presets).toEqual({
      core: { include: ['{{name}}.vue'] },
    });
  });

  it('extractHooks returns before/after from local config', () => {
    const before = async () => undefined;
    const after = async () => undefined;
    expect(extractHooks({ before, after })).toEqual({ before, after });
    expect(extractHooks()).toEqual({ before: undefined, after: undefined });
  });

  it('collectHookChain orders before forward and after for reverse run', () => {
    const gBefore = async () => undefined;
    const pBefore = async () => undefined;
    const tAfter = async () => undefined;
    const chain = collectHookChain(
      { before: gBefore },
      { before: pBefore },
      { after: tAfter },
    );
    expect(chain.before).toEqual([gBefore, pBefore]);
    expect(chain.after).toEqual([tAfter]);
  });

  it('local presets override same keys and keep other root presets', () => {
    const rootWithPresets: SmithConfig = {
      ...root,
      defaultPreset: 'core',
      presets: {
        core: { include: ['{{name}}.vue'] },
        docs: { include: ['README.md'] },
      },
    };
    const merged = mergeConfigs(rootWithPresets, {
      defaultPreset: 'full',
      presets: {
        full: { include: ['**/*'] },
        core: { include: ['{{name}}.ts'] },
      },
    });
    expect(merged.defaultPreset).toBe('full');
    expect(merged.presets).toEqual({
      core: { include: ['{{name}}.ts'] },
      docs: { include: ['README.md'] },
      full: { include: ['**/*'] },
    });
  });
});

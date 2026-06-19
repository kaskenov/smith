import { mergeConfigs } from '../../src/config/mergeConfig';
import type { SmithConfig } from '../../src/types';

describe('mergeConfigs', () => {
  const root: SmithConfig = {
    placeholder: ['{{', '}}'],
    variables: {
      A: () => 'a',
      B: () => 'b-root',
    },
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
});

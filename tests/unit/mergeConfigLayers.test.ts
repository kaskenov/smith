import { mergeConfigLayers } from '../../src/config/mergeConfig';
import type { SmithConfig } from '../../src/types';

describe('mergeConfigLayers', () => {
  it('merges global → project → template with later variable wins', () => {
    const globalConfig: SmithConfig = {
      placeholder: ['{{', '}}'],
      variables: {
        NAME: () => 'global',
        KEEP: () => 'keep',
      },
    };
    const projectConfig: SmithConfig = {
      placeholder: ['{{', '}}'],
      variables: {
        NAME: () => 'project',
      },
    };
    const merged = mergeConfigLayers(globalConfig, projectConfig, {
      variables: {
        NAME: () => 'template',
      },
    });

    expect(merged.variables.NAME({} as any, {} as any)).toBe('template');
    expect(merged.variables.KEEP({} as any, {} as any)).toBe('keep');
  });
});

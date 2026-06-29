import { createSmithConfig } from '../../src/config/createSmithConfig';
import { createFormatAPI } from '../../src/smith/format';

describe('createSmithConfig', () => {
  it('applies defaults', () => {
    const config = createSmithConfig(() => ({}));
    expect(config.placeholder).toEqual(['{{', '}}']);
    expect(config.variables).toEqual({});
  });

  it('passes smith.format into callback', () => {
    const config = createSmithConfig((smith) => ({
      variables: {
        NAME_PASCAL: (_ctx, s) => s.format.pascal('button'),
      },
    }));
    const format = createFormatAPI();
    expect(config.variables.NAME_PASCAL({} as any, { format } as any)).toBe('Button');
  });

  it('treats undefined callback result as empty input', () => {
    const config = createSmithConfig(() => undefined as unknown as Record<string, never>);
    expect(config.placeholder).toEqual(['{{', '}}']);
    expect(config.variables).toEqual({});
  });

  it('rejects invalid placeholder tuples', () => {
    expect(() =>
      createSmithConfig(() => ({
        placeholder: ['{{'] as unknown as [string, string],
      })),
    ).toThrow('placeholder must be a [open, close] tuple');
  });

  it('rejects invalid defaultPreset references', () => {
    expect(() =>
      createSmithConfig(() => ({
        defaultPreset: 'missing',
        presets: {
          core: { include: ['{{name}}.vue'] },
        },
      })),
    ).toThrow('defaultPreset "missing" is not defined in presets');
  });
});

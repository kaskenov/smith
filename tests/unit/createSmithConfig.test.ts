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
});

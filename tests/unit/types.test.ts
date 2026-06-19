import type { SmithContext, SmithConfig } from '../../src/types';

describe('types', () => {
  it('exports core interfaces', () => {
    const ctx: SmithContext = {
      name: 'button',
      path: '/tmp/out',
      template: 'component',
      cwd: '/tmp',
      root: '/tmp',
    };
    const config: SmithConfig = {
      placeholder: ['{{', '}}'],
      variables: {},
    };
    expect(ctx.name).toBe('button');
    expect(config.placeholder).toEqual(['{{', '}}']);
  });
});

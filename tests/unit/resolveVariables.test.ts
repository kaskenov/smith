import { resolveVariables } from '../../src/core/resolveVariables';
import { createFormatAPI } from '../../src/smith/format';

describe('resolveVariables', () => {
  it('resolves all variable functions', () => {
    const ctx = { name: 'button', path: '/out', template: 'c', cwd: '/p', root: '/p' };
    const smith = { format: createFormatAPI() } as any;
    const vars = resolveVariables({
      placeholder: ['{{', '}}'],
      variables: {
        NAME_PASCAL: (_ctx, s) => s.format.pascal(ctx.name),
      },
    }, ctx, smith);
    expect(vars.NAME_PASCAL).toBe('Button');
  });

  it('wraps thrown errors with variable name', () => {
    expect(() => resolveVariables({
      placeholder: ['{{', '}}'],
      variables: { BAD: () => { throw new Error('boom'); } },
    }, {} as any, {} as any)).toThrow(/Variable "BAD"/);
  });

  it('wraps non-error throws with variable name', () => {
    expect(() => resolveVariables({
      placeholder: ['{{', '}}'],
      variables: { BAD: () => { throw 'boom'; } },
    }, {} as any, {} as any)).toThrow('Variable "BAD" failed: boom');
  });
});

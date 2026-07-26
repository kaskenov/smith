import { substitute } from '../../src/core/substitute';

describe('substitute', () => {
  const delimiters: ['{{', '}}'] = ['{{', '}}'];
  const vars = { NAME: 'Button', NAME_KEBAB: 'button' };

  it('replaces placeholders in content', () => {
    expect(substitute('export {{NAME}}', vars, delimiters)).toBe('export Button');
  });

  it('replaces multiple placeholders', () => {
    expect(substitute('{{NAME}}-{{NAME_KEBAB}}', vars, delimiters)).toBe('Button-button');
  });

  it('leaves unknown placeholders intact', () => {
    expect(substitute('{{UNKNOWN}}', vars, delimiters)).toBe('{{UNKNOWN}}');
  });

  it('treats $ patterns in values as literals', () => {
    expect(substitute('x{{NAME}}y', { NAME: '$&' }, delimiters)).toBe('x$&y');
    expect(substitute('x{{NAME}}y', { NAME: '$$' }, delimiters)).toBe('x$$y');
  });
});

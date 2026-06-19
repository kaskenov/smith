import { createFormatAPI } from '../../src/smith/format';

describe('createFormatAPI', () => {
  const format = createFormatAPI();
  const input = 'button-component';

  it('formats pascal', () => { expect(format.pascal(input)).toBe('ButtonComponent'); });
  it('formats camel', () => { expect(format.camel(input)).toBe('buttonComponent'); });
  it('formats kebab', () => { expect(format.kebab(input)).toBe('button-component'); });
  it('formats snake', () => { expect(format.snake(input)).toBe('button_component'); });
  it('formats constant', () => { expect(format.constant(input)).toBe('BUTTON_COMPONENT'); });
  it('formats dot', () => { expect(format.dot(input)).toBe('button.component'); });
  it('formats path', () => { expect(format.path(input)).toBe('button/component'); });
  it('formats flat', () => { expect(format.flat(input)).toBe('buttoncomponent'); });
  it('formats slug', () => { expect(format.slug('Hello World!')).toBe('hello-world'); });
  it('formats plural', () => { expect(format.plural('button')).toBe('buttons'); });
  it('formats singular', () => { expect(format.singular('buttons')).toBe('button'); });
  it('formats prefix', () => { expect(format.prefix('User', 'I')).toBe('IUser'); });
  it('formats suffix', () => { expect(format.suffix('User', 'Dto')).toBe('UserDto'); });
  it('formats lower', () => { expect(format.lower('Button')).toBe('button'); });
  it('formats upper', () => { expect(format.upper('button')).toBe('BUTTON'); });
  it('formats title', () => { expect(format.title('hello_world')).toBe('Hello World'); });
  it('formats sentence', () => { expect(format.sentence('HELLO_WORLD')).toBe('Hello world'); });
});

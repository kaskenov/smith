import { brandSmith, shouldColorize } from '../../src/terminal/brand';

describe('brandSmith', () => {
  const originalIsTTY = process.stdout.isTTY;
  const originalNoColor = process.env.NO_COLOR;

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
    if (originalNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = originalNoColor;
  });

  it('colors only smith word when TTY and no NO_COLOR', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    delete process.env.NO_COLOR;
    expect(brandSmith('smith — replicate code')).toContain('smith');
    expect(brandSmith('smith — replicate code')).toMatch(/\x1b\[38;2;0;255;65m/);
  });

  it('returns plain text when NO_COLOR set', () => {
    process.env.NO_COLOR = '1';
    expect(brandSmith('smith — replicate code')).toBe('smith — replicate code');
  });
});

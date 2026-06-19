import pc from 'picocolors';

const MATRIX_GREEN = '#00FF41';

function hexColor(hex: string): (text: string) => string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
}

const matrixGreen = hexColor(MATRIX_GREEN);

export function shouldColorize(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (!process.stdout.isTTY) return false;
  return true;
}

export function brandSmith(text: string): string {
  if (!shouldColorize()) return text;
  return text.replace(/\bsmith\b/g, matrixGreen('smith'));
}

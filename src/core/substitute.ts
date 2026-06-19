import type { PlaceholderDelimiters, VariableMap } from '../types';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function substitute(
  text: string,
  vars: VariableMap,
  delimiters: PlaceholderDelimiters,
): string {
  const [open, close] = delimiters;
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`${escapeRegExp(open)}${escapeRegExp(key)}${escapeRegExp(close)}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

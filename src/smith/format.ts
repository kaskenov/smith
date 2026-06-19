import pluralize from 'pluralize';
import type { FormatAPI } from '../types';

function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function joinWords(words: string[], sep: string, mapWord: (w: string) => string = (w) => w): string {
  return words.map(mapWord).join(sep);
}

export function createFormatAPI(): FormatAPI {
  return {
    pascal(input) {
      const words = splitWords(input);
      return joinWords(words, '', (w) => w.charAt(0).toUpperCase() + w.slice(1));
    },
    camel(input) {
      const words = splitWords(input);
      const [first, ...rest] = words;
      return [first, ...rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1))].join('');
    },
    kebab(input) { return joinWords(splitWords(input), '-'); },
    snake(input) { return joinWords(splitWords(input), '_'); },
    constant(input) { return joinWords(splitWords(input), '_', (w) => w.toUpperCase()); },
    dot(input) { return joinWords(splitWords(input), '.'); },
    path(input) { return joinWords(splitWords(input), '/'); },
    flat(input) { return joinWords(splitWords(input), ''); },
    lower(input) { return input.toLowerCase(); },
    upper(input) { return input.toUpperCase(); },
    slug(input) {
      return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },
    title(input) {
      return splitWords(input).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    },
    sentence(input) {
      const titled = splitWords(input).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return titled.charAt(0).toUpperCase() + titled.slice(1).toLowerCase();
    },
    plural(input) { return pluralize(input); },
    singular(input) { return pluralize.singular(input); },
    prefix(input, prefix) { return `${prefix}${input}`; },
    suffix(input, suffix) { return `${input}${suffix}`; },
  };
}

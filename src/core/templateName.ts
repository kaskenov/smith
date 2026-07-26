import { ValidationError } from './errors';

/** Single-segment template ids only — no path separators, `..`, or controls. */
const TEMPLATE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function isValidTemplateName(name: string): boolean {
  return typeof name === 'string' && TEMPLATE_NAME_RE.test(name);
}

export function assertValidTemplateName(name: string): void {
  if (!isValidTemplateName(name)) {
    throw new ValidationError(`Invalid template name: ${name}`);
  }
}

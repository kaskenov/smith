import { NotFoundError } from '../../core/errors';
import { assertValidTemplateName, removeGlobalTemplate } from '../../core/resolveTemplate';

export async function removeTemplate(name: string): Promise<void> {
  assertValidTemplateName(name);
  const existed = removeGlobalTemplate(name);
  if (!existed) {
    throw new NotFoundError(`Global template not found: ${name}`);
  }
}

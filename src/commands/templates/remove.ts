import { assertValidTemplateName, removeGlobalTemplate } from '../../core/globalTemplates';
import { brandSmith } from '../../terminal/brand';

export async function runTemplatesRemove(name: string): Promise<void> {
  assertValidTemplateName(name);
  const existed = removeGlobalTemplate(name);
  if (!existed) {
    throw new Error(`Global template not found: ${name}`);
  }
  console.log(brandSmith(`smith templates remove ${name}`));
}

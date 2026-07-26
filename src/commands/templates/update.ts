import { updateTemplates } from '../../services/templates/update';
import { brandSmith } from '../../terminal/brand';

export async function runTemplatesUpdate(name?: string): Promise<void> {
  const result = await updateTemplates({ name, acknowledgeExecutableConfig: true });
  if (result.message) {
    console.log(result.message);
    return;
  }
  console.log(brandSmith(`smith templates update${name ? ` ${name}` : ''}`));
}

import { removeTemplate } from '../../services/templates/remove';
import { brandSmith } from '../../terminal/brand';

export async function runTemplatesRemove(name: string): Promise<void> {
  await removeTemplate(name);
  console.log(brandSmith(`smith templates remove ${name}`));
}

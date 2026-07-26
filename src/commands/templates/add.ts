import { addTemplate, type TemplatesAddOptions } from '../../services/templates/add';
import { brandSmith } from '../../terminal/brand';

export type { TemplatesAddOptions };

export async function runTemplatesAdd(options: TemplatesAddOptions): Promise<void> {
  const result = await addTemplate(options);
  console.log(brandSmith(`smith templates add ${options.name} -> ${result.targetDir}`));
}

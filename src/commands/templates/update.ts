import { listGlobalTemplates, readSources } from '../../core/globalTemplates';
import { brandSmith } from '../../terminal/brand';
import { runTemplatesAdd } from './add';

export async function runTemplatesUpdate(name?: string): Promise<void> {
  const sources = readSources();
  const names = name ? [name] : Object.keys(sources);

  if (name && !sources[name]) {
    throw new Error(`No recorded source for global template: ${name}. Re-add with smith templates add.`);
  }

  if (names.length === 0) {
    const globals = listGlobalTemplates();
    if (globals.length === 0) {
      console.log('No global templates to update.');
      return;
    }
    throw new Error(
      'No recorded sources in ~/.smith/sources.json. Re-add templates with smith templates add --from.',
    );
  }

  for (const templateName of names) {
    const source = sources[templateName];
    if (!source) continue;
    await runTemplatesAdd({
      name: templateName,
      from: source.from,
      path: source.path,
      ref: source.ref,
      force: true,
    });
  }

  console.log(brandSmith(`smith templates update${name ? ` ${name}` : ''}`));
}

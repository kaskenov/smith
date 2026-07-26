import { listGlobalTemplates } from '../../core/resolveTemplate';
import { NotFoundError, UsageError } from '../../core/errors';
import { readSources } from '../../core/templateSources';
import { addTemplate } from './add';

export interface TemplatesUpdateOptions {
  name?: string;
  cwd?: string;
  /** Required — updated templates may execute config.js/hooks on replicate/validate. */
  acknowledgeExecutableConfig?: boolean;
}

export interface TemplatesUpdateResult {
  updated: string[];
  message?: string;
}

/**
 * Re-fetch recorded global templates via addTemplate (force).
 * Re-validates git allowlist, path containment, and symlink-free trees.
 */
export async function updateTemplates(
  options: TemplatesUpdateOptions = {},
): Promise<TemplatesUpdateResult> {
  if (options.acknowledgeExecutableConfig !== true) {
    throw new UsageError(
      'templates update requires acknowledgeExecutableConfig:true — updated templates may execute config.js/hooks on replicate/validate.',
    );
  }

  const { name, cwd } = options;

  const sources = readSources();
  const names = name ? [name] : Object.keys(sources);

  if (name && !sources[name]) {
    throw new NotFoundError(
      `No recorded source for global template: ${name}. Re-add with smith templates add.`,
    );
  }

  if (names.length === 0) {
    const globals = listGlobalTemplates();
    if (globals.length === 0) {
      return { updated: [], message: 'No global templates to update.' };
    }
    throw new NotFoundError(
      'No recorded sources in ~/.smith/sources.json. Re-add templates with smith templates add --from.',
    );
  }

  for (const templateName of names) {
    const source = sources[templateName]!;
    await addTemplate({
      name: templateName,
      from: source.from,
      path: source.path,
      ref: source.ref,
      force: true,
      cwd,
      acknowledgeExecutableConfig: true,
    });
  }

  return { updated: names };
}

import { listTemplatesWithSource } from '../../core/resolveTemplate';
import { findSmithRoot } from '../../core/resolveRoot';

export function runTemplatesList(): void {
  const smithRoot = findSmithRoot(process.cwd());
  const templates = listTemplatesWithSource(smithRoot);

  if (templates.length === 0) {
    console.log('No templates in project or ~/.smith/templates/');
    return;
  }

  for (const template of templates) {
    console.log(`${template.name} (${template.source})`);
  }
}

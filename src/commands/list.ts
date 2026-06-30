import { listAvailableTemplates } from '../core/listTemplates';
import { findSmithRoot } from '../core/resolveRoot';

export function runList(): void {
  const smithRoot = findSmithRoot(process.cwd());
  if (!smithRoot) {
    throw new Error('No .smith directory found. Run from a smith project.');
  }

  const templates = listAvailableTemplates(smithRoot);
  if (templates.length === 0) {
    console.log('No templates in .smith/templates/');
    return;
  }

  for (const template of templates) {
    console.log(template);
  }
}

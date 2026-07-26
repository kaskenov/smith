import { discoverTemplates } from '../../services/discover';

export function runTemplatesList(): void {
  const templates = discoverTemplates(process.cwd());

  if (templates.length === 0) {
    console.log('No templates in project or ~/.smith/templates/');
    return;
  }

  for (const template of templates) {
    console.log(`${template.name} (${template.source})`);
  }
}

import { listAvailableTemplateNames, listLocalTemplates, listTemplateNamesInDir } from './globalTemplates';

export { listTemplateNamesInDir };

export function listAvailableTemplates(projectRoot: string | null): string[] {
  return listAvailableTemplateNames(projectRoot);
}

export function listProjectTemplates(projectRoot: string): string[] {
  return listLocalTemplates(projectRoot);
}

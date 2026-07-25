import { ensureGlobalConfig } from '../../config/loadGlobalConfig';
import { brandSmith } from '../../terminal/brand';

export async function runTemplatesInitConfig(): Promise<{ path: string; created: boolean }> {
  const result = ensureGlobalConfig();
  if (result.created) {
    console.log(brandSmith(`smith templates init-config -> ${result.path}`));
  } else {
    console.log(brandSmith(`smith templates init-config already exists -> ${result.path}`));
  }
  return result;
}

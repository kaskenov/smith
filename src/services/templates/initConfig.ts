import { ensureGlobalConfig } from '../../config/loadGlobalConfig';

export async function initTemplatesConfig(): Promise<{ path: string; created: boolean }> {
  return ensureGlobalConfig();
}

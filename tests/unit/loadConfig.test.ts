import { join } from 'node:path';
import { loadRootConfig } from '../../src/config/loadConfig';

describe('loadRootConfig', () => {
  it('loads .smith/config.js', async () => {
    const root = join(__dirname, '../fixtures/config-project');
    const config = await loadRootConfig(root);
    expect(config.variables.NAME_PASCAL({} as any, { format: { pascal: (v: string) => v } } as any)).toBeDefined();
  });
});

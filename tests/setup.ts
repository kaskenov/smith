import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.SMITH_SKIP_UPDATE_CHECK = '1';

const defaultFetchResponse = {
  ok: true,
  json: async () => ({ 'dist-tags': { latest: '0.0.0' } }),
};

let testSmithHome: string | undefined;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(defaultFetchResponse) as unknown as typeof fetch;
  testSmithHome = mkdtempSync(join(tmpdir(), 'smith-home-test-'));
  process.env.SMITH_HOME = testSmithHome;
});

afterEach(() => {
  if (testSmithHome) {
    rmSync(testSmithHome, { recursive: true, force: true });
    testSmithHome = undefined;
  }
  delete process.env.SMITH_HOME;
});

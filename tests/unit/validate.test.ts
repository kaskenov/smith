import { validateSmith } from '../../src/services/validate';

describe('validateSmith', () => {
  it('validates global config without a project root', async () => {
    const result = await validateSmith({ cwd: '/tmp' });
    expect(result.ok).toBe(true);
    expect(result.validated).toContain('global');
  });

  it('defaults cwd to process.cwd', async () => {
    const result = await validateSmith({});
    expect(result.ok).toBe(true);
    expect(result.globalSmithDir).toBeTruthy();
  });
});

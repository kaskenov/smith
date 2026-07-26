import { UsageError } from '../../src/core/errors';
import { replicate } from '../../src/services/replicate';

describe('replicate options', () => {
  it('rejects force and skip together', async () => {
    await expect(
      replicate({
        name: 'Button',
        template: 'component',
        force: true,
        skip: true,
      }),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

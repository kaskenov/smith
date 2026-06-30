import { fetchLatestVersion, findNewerVersion, notifyIfNewerVersion, PACKAGE_NAME } from '../../src/package/registry';

describe('registry', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('fetchLatestVersion', () => {
    it('returns latest dist-tag from npm registry', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'dist-tags': { latest: '2.1.0' } }),
      }) as unknown as typeof fetch;

      await expect(fetchLatestVersion()).resolves.toBe('2.1.0');
      expect(global.fetch).toHaveBeenCalledWith(
        `https://registry.npmjs.org/${encodeURIComponent(PACKAGE_NAME)}`,
      );
    });

    it('throws when registry responds with an error status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }) as unknown as typeof fetch;

      await expect(fetchLatestVersion()).rejects.toThrow('npm registry returned 503');
    });
  });

  describe('findNewerVersion', () => {
    it('returns latest version when newer than current', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'dist-tags': { latest: '9.9.9' } }),
      }) as unknown as typeof fetch;

      await expect(findNewerVersion('1.0.0')).resolves.toBe('9.9.9');
    });

    it('returns null when already on latest', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'dist-tags': { latest: '2.0.0' } }),
      }) as unknown as typeof fetch;

      await expect(findNewerVersion('2.0.0')).resolves.toBeNull();
    });

    it('returns null when registry lookup fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

      await expect(findNewerVersion('1.0.0')).resolves.toBeNull();
    });
  });

  describe('notifyIfNewerVersion', () => {
    it('logs when a newer version is available', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'dist-tags': { latest: '9.9.9' } }),
      }) as unknown as typeof fetch;
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      await notifyIfNewerVersion('1.0.0');

      expect(logSpy).toHaveBeenCalledWith(
        `A newer version of ${PACKAGE_NAME} is available: 9.9.9. You are currently on version: 1.0.0.`,
      );
    });

    it('stays silent when already on latest', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'dist-tags': { latest: '2.0.0' } }),
      }) as unknown as typeof fetch;
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      await notifyIfNewerVersion('2.0.0');

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('stays silent when registry lookup fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(notifyIfNewerVersion('1.0.0')).resolves.toBeUndefined();

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('logs an error when the version check throws unexpectedly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'dist-tags': { latest: '9.9.9' } }),
      });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('write failed');
      });

      await notifyIfNewerVersion('1.0.0');

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to check for the latest version:',
        expect.any(Error),
      );
    });
  });
});

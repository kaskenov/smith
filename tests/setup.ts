process.env.SMITH_SKIP_UPDATE_CHECK = '1';

const defaultFetchResponse = {
  ok: true,
  json: async () => ({ 'dist-tags': { latest: '0.0.0' } }),
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(defaultFetchResponse) as unknown as typeof fetch;
});

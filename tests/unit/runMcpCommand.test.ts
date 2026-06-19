import { runMcpCommand } from '../../src/commands/mcp';
import * as serverModule from '../../src/mcp/server';

describe('runMcpCommand', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates to runMcpServer', async () => {
    const serverSpy = jest.spyOn(serverModule, 'runMcpServer').mockResolvedValue(undefined);

    await runMcpCommand();

    expect(serverSpy).toHaveBeenCalled();
  });
});

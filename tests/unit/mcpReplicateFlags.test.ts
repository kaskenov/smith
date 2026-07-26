import { resolveMcpReplicateFlags } from '../../src/mcp/tools/helpers';
import { UsageError } from '../../src/core/errors';

describe('resolveMcpReplicateFlags', () => {
  it('defaults to force when neither flag is set', () => {
    expect(resolveMcpReplicateFlags()).toEqual({ force: true, skip: false });
  });

  it('honors skip', () => {
    expect(resolveMcpReplicateFlags(undefined, true)).toEqual({ force: false, skip: true });
  });

  it('honors explicit force', () => {
    expect(resolveMcpReplicateFlags(true, false)).toEqual({ force: true, skip: false });
  });

  it('rejects force and skip together', () => {
    expect(() => resolveMcpReplicateFlags(true, true)).toThrow(UsageError);
  });

  it('rejects explicit force:false without skip', () => {
    expect(() => resolveMcpReplicateFlags(false, false)).toThrow(UsageError);
  });
});

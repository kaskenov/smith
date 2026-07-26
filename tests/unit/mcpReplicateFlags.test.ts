import { assertMcpReplicatePath, resolveMcpReplicateFlags } from '../../src/mcp/tools/helpers';
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

describe('assertMcpReplicatePath', () => {
  it('allows relative paths and undefined', () => {
    expect(() => assertMcpReplicatePath(undefined)).not.toThrow();
    expect(() => assertMcpReplicatePath('src/out')).not.toThrow();
    expect(() => assertMcpReplicatePath('./out')).not.toThrow();
  });

  it('rejects absolute paths', () => {
    expect(() => assertMcpReplicatePath('/tmp/out')).toThrow(UsageError);
  });
});

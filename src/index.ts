/**
 * Library entrypoint for @kaskenov/smith.
 * CLI remains available via the `smith` bin (`bin/smith.js` → dist/cli.js).
 */
export { createSmithConfig } from './config/createSmithConfig';
export { replicate, resolveOutputBase } from './services/replicate';
export { validateSmith } from './services/validate';
export {
  InternalError,
  NotFoundError,
  ReplicationAbortedError,
  UnsafePathError,
  UsageError,
  ValidationError,
} from './core/errors';
export type { SmithError } from './core/errors';
export type {
  ConflictPolicy,
  ConflictResolution,
  ConflictResolver,
  ReplicateOptions,
  ReplicateResult,
  SmithConfig,
  SmithConfigData,
  SmithConfigInput,
  SmithContext,
  SmithHelper,
} from './types';

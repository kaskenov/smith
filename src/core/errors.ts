export class ReplicationAbortedError extends Error {
  readonly code = 'REPLICATION_ABORTED' as const;

  constructor() {
    super('Replication aborted by user');
    this.name = 'ReplicationAbortedError';
  }
}

export class UsageError extends Error {
  readonly code = 'USAGE' as const;

  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export class ValidationError extends Error {
  readonly code = 'VALIDATION' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnsafePathError extends Error {
  readonly code = 'UNSAFE_PATH' as const;

  constructor(message: string) {
    super(message);
    this.name = 'UnsafePathError';
  }
}

export class InternalError extends Error {
  readonly code = 'INTERNAL' as const;

  constructor(message: string) {
    super(message);
    this.name = 'InternalError';
  }
}

export type SmithError =
  | ReplicationAbortedError
  | UsageError
  | ValidationError
  | NotFoundError
  | UnsafePathError
  | InternalError;

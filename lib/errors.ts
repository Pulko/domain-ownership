export const DomainErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  DOMAIN_REQUIRED: 'DOMAIN_REQUIRED',
  INVALID_DOMAIN_FORMAT: 'INVALID_DOMAIN_FORMAT',
  WILDCARD_NOT_SUPPORTED: 'WILDCARD_NOT_SUPPORTED',
  IP_NOT_SUPPORTED: 'IP_NOT_SUPPORTED',
  DOMAIN_LENGTH_INVALID: 'DOMAIN_LENGTH_INVALID',
  DOMAIN_FORMAT_INVALID: 'DOMAIN_FORMAT_INVALID',
  DOMAIN_ALREADY_ADDED: 'DOMAIN_ALREADY_ADDED',
  DOMAIN_NOT_FOUND: 'DOMAIN_NOT_FOUND',
  VERIFICATION_NOT_FOUND: 'VERIFICATION_NOT_FOUND',
  NO_ACTIVE_VERIFICATION: 'NO_ACTIVE_VERIFICATION',
} as const;

export type DomainErrorCode = (typeof DomainErrorCode)[keyof typeof DomainErrorCode];

const MESSAGES: Record<DomainErrorCode, string> = {
  UNAUTHORIZED: 'Unauthorized',
  DOMAIN_REQUIRED: 'Domain is required',
  INVALID_DOMAIN_FORMAT: 'Invalid domain format',
  WILDCARD_NOT_SUPPORTED: 'Wildcard domains are not supported',
  IP_NOT_SUPPORTED: 'IP addresses are not supported',
  DOMAIN_LENGTH_INVALID: 'Domain length is invalid',
  DOMAIN_FORMAT_INVALID: 'Domain format is invalid',
  DOMAIN_ALREADY_ADDED: 'Domain already added',
  DOMAIN_NOT_FOUND: 'Domain not found',
  VERIFICATION_NOT_FOUND: 'Verification not found',
  NO_ACTIVE_VERIFICATION: 'Domain has no active verification',
};

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode) {
    super(MESSAGES[code]);
    this.name = 'DomainError';
    this.code = code;
  }
}

export type ActionFailure = { ok: false; error: string; code?: DomainErrorCode };

export type ActionResult<T = void> = T extends void
  ? { ok: true } | ActionFailure
  : ({ ok: true } & T) | ActionFailure;

export function toActionError(error: unknown, fallback: string): ActionFailure {
  if (error instanceof DomainError) {
    return { ok: false, error: error.message, code: error.code };
  }

  const message = error instanceof Error ? error.message : fallback;
  return { ok: false, error: message };
}

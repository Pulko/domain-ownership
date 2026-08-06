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

function statusForCode(code: DomainErrorCode): number {
  switch (code) {
    case DomainErrorCode.UNAUTHORIZED:
      return 401;
    case DomainErrorCode.DOMAIN_ALREADY_ADDED:
      return 409;
    case DomainErrorCode.DOMAIN_NOT_FOUND:
    case DomainErrorCode.VERIFICATION_NOT_FOUND:
      return 404;
    case DomainErrorCode.DOMAIN_REQUIRED:
    case DomainErrorCode.INVALID_DOMAIN_FORMAT:
    case DomainErrorCode.WILDCARD_NOT_SUPPORTED:
    case DomainErrorCode.IP_NOT_SUPPORTED:
    case DomainErrorCode.DOMAIN_LENGTH_INVALID:
    case DomainErrorCode.DOMAIN_FORMAT_INVALID:
    case DomainErrorCode.NO_ACTIVE_VERIFICATION:
      return 400;
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}

export function domainErrorResponse(error: unknown, fallback: string): Response {
  if (error instanceof DomainError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: statusForCode(error.code) }
    );
  }

  const message = error instanceof Error ? error.message : fallback;
  return Response.json({ error: message }, { status: 500 });
}

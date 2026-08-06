import { DomainError, DomainErrorCode } from '@/lib/errors';

const DOMAIN_PATTERN =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

/**
 * Clean user input and extract only the hostname.
 * Accepts bare domains or full URLs (scheme, path, query, port, credentials).
 */
export function extractHostname(userInput: string): string {
  let cleanInput = userInput.trim();

  if (!cleanInput) {
    throw new DomainError(DomainErrorCode.DOMAIN_REQUIRED);
  }

  if (!/^https?:\/\//i.test(cleanInput)) {
    cleanInput = `http://${cleanInput}`;
  }

  let hostname: string;
  try {
    hostname = new URL(cleanInput).hostname;
  } catch {
    throw new DomainError(DomainErrorCode.INVALID_DOMAIN_FORMAT);
  }

  if (!hostname) {
    throw new DomainError(DomainErrorCode.INVALID_DOMAIN_FORMAT);
  }

  // URL.hostname keeps brackets for IPv6 literals.
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  return hostname.toLowerCase();
}

function isIpLiteral(hostname: string): boolean {
  return IPV4_PATTERN.test(hostname) || hostname.includes(':');
}

/**
 * Normalize a hostname for storage.
 * Extracts a hostname from messy user input, lowercases, strips a trailing
 * dot, and rejects wildcards / invalid formats.
 */
export function normalizeDomain(input: string): string {
  let domain = extractHostname(input);

  if (domain.includes('*')) {
    throw new DomainError(DomainErrorCode.WILDCARD_NOT_SUPPORTED);
  }

  if (isIpLiteral(domain)) {
    throw new DomainError(DomainErrorCode.IP_NOT_SUPPORTED);
  }

  if (domain.endsWith('.')) {
    domain = domain.slice(0, -1);
  }

  if (domain.length < 3 || domain.length > 253) {
    throw new DomainError(DomainErrorCode.DOMAIN_LENGTH_INVALID);
  }

  if (!DOMAIN_PATTERN.test(domain)) {
    throw new DomainError(DomainErrorCode.DOMAIN_FORMAT_INVALID);
  }

  return domain;
}

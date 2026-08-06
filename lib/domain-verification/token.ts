import { randomBytes } from 'node:crypto';

export const TXT_PREFIX = 'domain-verification=';

export function createVerificationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function toTxtRecordValue(token: string): string {
  return `${TXT_PREFIX}${token}`;
}

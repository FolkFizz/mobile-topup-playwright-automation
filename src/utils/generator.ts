const EMAIL_DOMAIN = 'example.com';
const EMAIL_PREFIX = 'qa';
const PHONE_PREFIXES = ['06', '08', '09'] as const;

export function randomEmail(prefix: string = EMAIL_PREFIX): string {
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}.${timestamp}.${random}@${EMAIL_DOMAIN}`;
}

export function randomPhone(): string {
  const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
  const body = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0');
  return `${prefix}${body}`;
}

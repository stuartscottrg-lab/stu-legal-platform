import crypto from 'crypto';

/**
 * Stu OS — encryption at rest for sensitive connector credentials.
 *
 * Tokens (OAuth access/refresh tokens, IMAP app passwords, API keys) are
 * encrypted with AES-256-GCM before being written to the database, so a leaked
 * database dump never exposes usable credentials.
 *
 * Set STU_OS_ENC_KEY to a 64-char hex string (32 bytes), e.g.
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Back-compat: if the key is missing, or a stored value isn't in our encrypted
 * envelope format, we transparently pass the value through as plaintext. This
 * means turning encryption on is non-breaking for tokens stored before it.
 */

const PREFIX = 'stuos:v1:';

function getKey(): Buffer | null {
  const raw = process.env.STU_OS_ENC_KEY || process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) return null;
  try {
    const key = Buffer.from(raw.trim(), 'hex');
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

/** Encrypt a string. Returns plaintext unchanged if no key is configured. */
export function encryptToken(plain: string | null | undefined): string | null {
  if (plain == null) return null;
  const key = getKey();
  if (!key) return plain; // graceful no-op when not configured
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

/** Decrypt a value produced by encryptToken. Passes through legacy plaintext. */
export function decryptToken(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext
  const key = getKey();
  if (!key) return null; // can't decrypt without the key
  try {
    const blob = Buffer.from(stored.slice(PREFIX.length), 'base64');
    const iv = blob.subarray(0, 12);
    const tag = blob.subarray(12, 28);
    const enc = blob.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function isEncryptionEnabled(): boolean {
  return getKey() !== null;
}

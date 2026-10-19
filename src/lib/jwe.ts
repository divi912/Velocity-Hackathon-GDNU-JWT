import { encodeBytes, decodeBytes, encodeText, decodeText } from './jwt.ts';

// Public classroom key, separate from the signing key. Never use in production.
const ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
const utf8 = new TextEncoder();

async function getKey(secret: string): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) throw new Error('Encryption needs localhost or HTTPS.');
  if (utf8.encode(secret).length !== 32) throw new Error('A256GCM needs a 32-byte encryption key.');
  return crypto.subtle.importKey('raw', utf8.encode(secret), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptToken(token: string, secret = ENCRYPTION_KEY): Promise<string> {
  const header = encodeText(JSON.stringify({ alg: 'dir', enc: 'A256GCM', cty: 'JWT' }));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: utf8.encode(header), tagLength: 128 },
    await getKey(secret), utf8.encode(token),
  ));
  const ciphertext = encrypted.slice(0, -16);
  const tag = encrypted.slice(-16);
  // Direct key mode leaves the encrypted-key segment empty. It is still five parts.
  return [header, '', encodeBytes(iv), encodeBytes(ciphertext), encodeBytes(tag)].join('.');
}

export async function decryptToken(envelope: string, secret = ENCRYPTION_KEY): Promise<string> {
  const parts = envelope.split('.');
  if (parts.length !== 5) throw new Error('An encrypted envelope needs five parts.');
  try {
    const header = JSON.parse(decodeText(parts[0]));
    if (header.alg !== 'dir' || header.enc !== 'A256GCM' || header.cty !== 'JWT' || parts[1] !== '') {
      throw new Error('Unsupported encryption settings.');
    }
    const iv = decodeBytes(parts[2]);
    const ciphertext = decodeBytes(parts[3]);
    const tag = decodeBytes(parts[4]);
    if (iv.length !== 12 || tag.length !== 16) throw new Error('Wrong IV or tag length.');
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext); combined.set(tag, ciphertext.length);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: utf8.encode(parts[0]), tagLength: 128 },
      await getKey(secret), combined,
    );
    return new TextDecoder('utf-8', { fatal: true }).decode(plain);
  } catch {
    throw new Error('Cannot decrypt: the envelope changed, the settings are unsupported, or the key is wrong.');
  }
}

import { decodeBytes, encodeBytes, encodeText, parseToken } from './jwt.ts';
import type { Claims } from './jwt.ts';

export type Inspection = {
  header?: Claims; payload?: Claims; segments?: string[]; error?: string;
  signature: 'verified' | 'invalid' | 'not-checked' | 'unsupported';
  time: 'valid' | 'expired' | 'not-active' | 'not-set' | 'invalid';
};

const meanings: Record<string, string> = {
  sub: 'Subject — the user or thing this token is about.',
  name: 'A name supplied by the issuer. This is an app-defined claim.',
  role: 'An app-defined role. The API still decides what it allows.',
  iss: 'Issuer — who created the token. The API must trust this issuer.',
  aud: 'Audience — which API or APIs should accept the token.',
  iat: 'Issued at — a Unix time in seconds, not milliseconds.',
  exp: 'Expiry — the API should reject the token at or after this time.',
  nbf: 'Not before — the token should not be used before this time.',
  jti: 'A token ID. Revocation needs a server-side check; the ID alone does not revoke it.',
};

export function claimExplanation(name: string): string {
  return Object.hasOwn(meanings, name) ? meanings[name] : 'An app-defined claim. Its meaning is agreed by the issuer and the API.';
}

async function getHmacKey(secret: string, base64: boolean): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) throw new Error('Open this tool on localhost or HTTPS to use Web Crypto.');
  const bytes = base64 ? decodeBytes(secret) : new TextEncoder().encode(secret);
  if (!bytes.length) throw new Error('Enter a secret key first.');
  return crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function inspectJwt(token: string, secret: string, base64 = false, now = Math.floor(Date.now() / 1000)): Promise<Inspection> {
  try {
    const { header, payload, segments } = parseToken(token.trim());
    const result: Inspection = { header, payload, segments, signature: 'not-checked', time: 'not-set' };
    if (payload.exp !== undefined && (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp))) result.time = 'invalid';
    else if (typeof payload.exp === 'number' && now >= payload.exp) result.time = 'expired';
    else if (payload.nbf !== undefined && (typeof payload.nbf !== 'number' || !Number.isFinite(payload.nbf))) result.time = 'invalid';
    else if (typeof payload.nbf === 'number' && now < payload.nbf) result.time = 'not-active';
    else if (typeof payload.exp === 'number') result.time = 'valid';
    if (header.alg !== 'HS256') return { ...result, signature: 'unsupported' };
    if (!secret) return result;
    try {
      const key = await getHmacKey(secret, base64);
      const verified = await crypto.subtle.verify('HMAC', key, decodeBytes(segments[2]), new TextEncoder().encode(`${segments[0]}.${segments[1]}`));
      result.signature = verified ? 'verified' : 'invalid';
      return result;
    } catch (error) { return { ...result, error: error instanceof Error ? error.message : 'Check the secret key.', signature: 'not-checked' }; }
  } catch { return { error: 'This is not a readable three-part signed JWT. Check each part and the two dots.', signature: 'not-checked', time: 'not-set' }; }
}

export async function generateJwt(headerText: string, payloadText: string, secret: string, base64 = false): Promise<string> {
  let header: unknown; let payload: unknown;
  try { header = JSON.parse(headerText); payload = JSON.parse(payloadText); }
  catch { throw new Error('The header and payload must be valid JSON. Check quotes, commas, and braces.'); }
  if (!header || typeof header !== 'object' || Array.isArray(header) || !payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Use JSON objects in both editors.');
  if ((header as Claims).alg !== 'HS256') throw new Error('This study debugger signs and verifies HS256 tokens. Set alg to HS256.');
  const key = await getHmacKey(secret, base64);
  const input = `${encodeText(headerText)}.${encodeText(payloadText)}`;
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return `${input}.${encodeBytes(new Uint8Array(signature))}`;
}

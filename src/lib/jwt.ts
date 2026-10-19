export type Claims = Record<string, unknown>;
export type CheckStatus = 'pass' | 'fail' | 'skip';
export type Check = { id: string; label: string; status: CheckStatus; detail: string };
export type VerifyOptions = { now?: number; audience?: string; issuer?: string; endpoint?: string; secret?: string };
export type Verification = {
  accepted: boolean; checks: Check[]; header?: Claims; payload?: Claims;
  signingInput?: string; expectedSignature?: string;
};

// Intentionally public: this app simulates a server in the browser.
export const DEMO_SECRET = 'public-jwt-classroom-key-32-bytes-minimum';
export const ISSUER = 'https://auth.example.com';
export const AUDIENCE = 'learning-api';
const encoder = new TextEncoder();

export function encodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function decodeBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw new Error('This part is not valid Base64url text.');
  }
  const bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
  if (encodeBytes(bytes) !== value) throw new Error('This part is not valid Base64url text.');
  return bytes;
}

export function encodeText(text: string): string { return encodeBytes(encoder.encode(text)); }
export function decodeText(encoded: string): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(decodeBytes(encoded));
}

function isObject(value: unknown): value is Claims {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseToken(token: string): { header: Claims; payload: Claims; segments: string[] } {
  const segments = token.split('.');
  if (segments.length !== 3) throw new Error('A signed token needs three parts, split by dots.');
  const header: unknown = JSON.parse(decodeText(segments[0]));
  const payload: unknown = JSON.parse(decodeText(segments[1]));
  decodeBytes(segments[2]);
  if (!isObject(header) || !isObject(payload)) throw new Error('The header and payload must be JSON objects.');
  return { header, payload, segments };
}

async function importKey(secret: string): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto needs localhost or HTTPS. Open the local Vite URL.');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signToken(payload: Claims, options: { secret?: string } = {}): Promise<string> {
  if (!isObject(payload)) throw new Error('The payload must be a JSON object.');
  const input = `${encodeText(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${encodeText(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign('HMAC', await importKey(options.secret ?? DEMO_SECRET), encoder.encode(input));
  return `${input}.${encodeBytes(new Uint8Array(signature))}`;
}

export function replacePayload(token: string, payload: Claims): string {
  if (!isObject(payload)) throw new Error('The payload must be a JSON object.');
  const { segments } = parseToken(token);
  return `${segments[0]}.${encodeText(JSON.stringify(payload))}.${segments[2]}`;
}

export async function verifyToken(token: string, options: VerifyOptions = {}): Promise<Verification> {
  const checks: Check[] = [
    { id: 'format', label: 'Read the token', status: 'skip', detail: 'Waiting for a token.' },
    { id: 'algorithm', label: 'Check the algorithm', status: 'skip', detail: 'Not checked yet.' },
    { id: 'signature', label: 'Check the signature', status: 'skip', detail: 'Not checked yet.' },
    { id: 'issuer', label: 'Check who sent it', status: 'skip', detail: 'Not checked yet.' },
    { id: 'audience', label: 'Check the right API', status: 'skip', detail: 'Not checked yet.' },
    { id: 'time', label: 'Check the time', status: 'skip', detail: 'Not checked yet.' },
    { id: 'permission', label: 'Check the permission', status: 'skip', detail: 'Not checked yet.' },
  ];
  const mark = (id: string, passed: boolean, detail: string) => {
    const check = checks.find(item => item.id === id)!;
    check.status = passed ? 'pass' : 'fail'; check.detail = detail;
  };
  let parsed: ReturnType<typeof parseToken>;
  try { parsed = parseToken(token); }
  catch (error) {
    mark('format', false, error instanceof Error ? error.message : 'This token cannot be read.');
    return { accepted: false, checks };
  }
  const { header, payload, segments } = parsed;
  const result: Verification = { accepted: false, checks, header, payload, signingInput: `${segments[0]}.${segments[1]}` };
  mark('format', true, 'Three readable parts. Reading does not prove trust.');
  const permitted = header.alg === 'HS256';
  mark('algorithm', permitted, permitted ? 'This API allows HS256. The token cannot choose another algorithm.' : 'This API only allows HS256. This token asks for something else.');
  if (!permitted) return result;
  const key = await importKey(options.secret ?? DEMO_SECRET);
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(result.signingInput));
  result.expectedSignature = encodeBytes(new Uint8Array(expected));
  const signatureValid = await crypto.subtle.verify('HMAC', key, decodeBytes(segments[2]), encoder.encode(result.signingInput));
  mark('signature', signatureValid, signatureValid ? 'The received signature matches the original encoded header and payload.' : 'The signature does not match. A claim changed, the signature changed, or the key is wrong.');
  if (!signatureValid) return result;
  const issuerValid = payload.iss === (options.issuer ?? ISSUER) && typeof payload.sub === 'string' && payload.sub.length > 0;
  mark('issuer', issuerValid, issuerValid ? `Trusted issuer. Subject: ${payload.sub}.` : 'The issuer is not trusted, or the user ID is missing.');
  const wantedAudience = options.audience ?? AUDIENCE;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const audienceValid = audiences.includes(wantedAudience);
  mark('audience', audienceValid, audienceValid ? 'This token is meant for learning-api.' : 'The signature is valid, but this token is meant for another API.');
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const validExpiry = typeof payload.exp === 'number' && Number.isFinite(payload.exp);
  const validNbf = payload.nbf === undefined || (typeof payload.nbf === 'number' && Number.isFinite(payload.nbf) && now >= payload.nbf);
  const timeValid = validExpiry && now < (payload.exp as number) && validNbf;
  mark('time', timeValid, !validExpiry ? 'This demo requires a numeric expiry time (exp).' : !validNbf ? 'This token is not active yet. Check its not-before time.' : timeValid ? `${Math.max(0, (payload.exp as number) - now)} seconds remain. The clock is before exp.` : 'This token has expired. Its signature can still be valid.');
  if (!issuerValid || !audienceValid || !timeValid) return result;
  const permissionValid = options.endpoint !== '/admin' || payload.role === 'admin';
  mark('permission', permissionValid, permissionValid ? `Access allowed to ${options.endpoint ?? '/profile'}.` : 'You are a student. This route needs an admin, even with a valid token.');
  result.accepted = checks.every(check => check.status === 'pass');
  return result;
}

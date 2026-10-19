import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeText, decodeText, signToken, verifyToken, replacePayload, parseToken } from './jwt.ts';
import type { Claims, Verification } from './jwt.ts';

const payload = { sub: 'user_42', role: 'student', iss: 'https://auth.example.com', aud: 'learning-api', iat: 1000, exp: 1300 };
const options = { now: 1100 };
const status = (result: Verification, id: string) => result.checks.find(check => check.id === id)?.status;

test('Unicode survives Base64url encoding and decoding', () => {
  assert.equal(decodeText(encodeText('Hello, नमस्ते 👋')), 'Hello, नमस्ते 👋');
  assert.equal(encodeText('{"sub":"42"}'), 'eyJzdWIiOiI0MiJ9');
});

test('HS256 matches an independently calculated signature fixture', async () => {
  const token = await signToken({ sub: '42' }, { secret: '0123456789abcdef0123456789abcdef' });
  assert.equal(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiJ9.tCPlRnX0wtE8ViPs--v6F94pWVVCItKk39iOhBIx3lQ');
});

test('A correctly signed student token can access the profile', async () => {
  const result = await verifyToken(await signToken(payload), options);
  assert.equal(result.accepted, true);
  assert.ok(result.checks.every(check => check.status === 'pass'));
});

test('Editing a role without signing again fails the signature check', async () => {
  const token = replacePayload(await signToken(payload), { ...payload, role: 'admin' });
  const result = await verifyToken(token, options);
  assert.equal(result.accepted, false);
  assert.equal(status(result, 'signature'), 'fail');
  assert.equal(status(result, 'permission'), 'skip');
});

test('At the exact expiry second the signature passes but the clock check fails', async () => {
  const result = await verifyToken(await signToken(payload), { now: 1300 });
  assert.equal(result.accepted, false);
  assert.equal(status(result, 'signature'), 'pass');
  assert.equal(status(result, 'time'), 'fail');
});

test('A signed token for another API fails audience validation', async () => {
  const result = await verifyToken(await signToken({ ...payload, aud: 'other-api' }), options);
  assert.equal(status(result, 'signature'), 'pass');
  assert.equal(status(result, 'audience'), 'fail');
  assert.equal(result.accepted, false);
});

test('The API rejects an unpermitted algorithm without trusting it', async () => {
  const token = `${encodeText('{"alg":"none","typ":"JWT"}')}.${encodeText(JSON.stringify(payload))}.AA`;
  const result = await verifyToken(token, options);
  assert.equal(status(result, 'algorithm'), 'fail');
  assert.equal(status(result, 'signature'), 'skip');
  assert.equal(result.accepted, false);
});

test('Malformed tokens and non-object JSON give recoverable validation failures', async () => {
  for (const token of ['broken', 'a.b.c', 'a.b.c.d', '%%%.b.c', `${encodeText('{}')}.${encodeText('[]')}.AA`]) {
    const result = await verifyToken(token, options);
    assert.equal(result.accepted, false);
    assert.equal(status(result, 'format'), 'fail');
  }
  assert.throws(() => parseToken('not-a-token'), /three|3/i);
  assert.throws(() => decodeText('%%%'), /base64url/i);
});

test('Valid student credentials do not grant access to the admin endpoint', async () => {
  const result = await verifyToken(await signToken(payload), { ...options, endpoint: '/admin' });
  assert.equal(status(result, 'signature'), 'pass');
  assert.equal(status(result, 'time'), 'pass');
  assert.equal(status(result, 'permission'), 'fail');
  assert.equal(result.accepted, false);
});

test('Wrong keys and missing required claims are rejected', async () => {
  const wrongKey = await verifyToken(await signToken(payload), { ...options, secret: 'another-public-demo-secret-123456' });
  assert.equal(status(wrongKey, 'signature'), 'fail');
  const missingExp: Claims = { ...payload };
  delete missingExp.exp;
  assert.equal(status(await verifyToken(await signToken(missingExp), options), 'time'), 'fail');
});

test('Array audience is accepted and not-before is enforced', async () => {
  assert.equal((await verifyToken(await signToken({ ...payload, aud: ['other-api', 'learning-api'] }), options)).accepted, true);
  const future = await verifyToken(await signToken({ ...payload, nbf: 1200 }), options);
  assert.equal(status(future, 'time'), 'fail');
});


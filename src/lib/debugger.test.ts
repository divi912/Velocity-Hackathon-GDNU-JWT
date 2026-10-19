import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectJwt, generateJwt, claimExplanation } from './debugger.ts';

const key = '0123456789abcdef0123456789abcdef';
const fixture = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiJ9.tCPlRnX0wtE8ViPs--v6F94pWVVCItKk39iOhBIx3lQ';

test('The debugger verifies a token without requiring app-specific issuer, role or expiry', async () => {
  const result = await inspectJwt(fixture, key);
  assert.equal(result.signature, 'verified');
  assert.deepEqual(result.payload, { sub: '42' });
  assert.equal(result.time, 'not-set');
});

test('An empty key decodes but does not claim to verify a signature', async () => {
  const result = await inspectJwt(fixture, '');
  assert.equal(result.signature, 'not-checked');
  assert.equal(result.header?.alg, 'HS256');
});

test('The encoder produces the known fixture from JSON and a key', async () => {
  assert.equal(await generateJwt('{"alg":"HS256","typ":"JWT"}', '{"sub":"42"}', key), fixture);
});

test('Header whitespace is part of the original signing input', async () => {
  const token = await generateJwt('{ "alg": "HS256", "typ": "JWT" }', '{"sub":"42"}', key);
  assert.equal((await inspectJwt(token, key)).signature, 'verified');
});

test('Base64url secret mode uses raw key bytes, not the encoded text as a key', async () => {
  const result = await inspectJwt(fixture, 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY', true);
  assert.equal(result.signature, 'verified');
});

test('Signature and time status remain separate for expired tokens', async () => {
  const token = await generateJwt('{"alg":"HS256"}', '{"sub":"42","exp":100}', key);
  const result = await inspectJwt(token, key, false, 100);
  assert.equal(result.signature, 'verified');
  assert.equal(result.time, 'expired');
});

test('Malformed, unsupported, and changed tokens produce clear non-success results', async () => {
  assert.ok((await inspectJwt('bad', key)).error);
  assert.equal((await inspectJwt(fixture, 'a different example secret')).signature, 'invalid');
  await assert.rejects(generateJwt('{"alg":"none"}', '{}', key), /HS256/i);
  await assert.rejects(generateJwt('{', '{}', key), /JSON/i);
});

test('Prototype-named custom claims always get safe text explanations', () => {
  for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'custom']) {
    assert.equal(typeof claimExplanation(name), 'string');
    assert.ok(claimExplanation(name).includes('app-defined'));
  }
  assert.ok(claimExplanation('exp').includes('Expiry'));
});

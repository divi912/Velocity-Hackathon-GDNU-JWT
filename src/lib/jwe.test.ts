import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptToken, decryptToken } from './jwe.ts';

test('A signed token survives a five-part encrypted envelope', async () => {
  const signed = 'header.payload.signature';
  const encrypted = await encryptToken(signed);
  assert.equal(encrypted.split('.').length, 5);
  assert.equal(encrypted.split('.')[1], '');
  assert.equal(await decryptToken(encrypted), signed);
  assert.ok(!encrypted.includes('payload'));
});

test('Fresh encryption uses a fresh random IV', async () => {
  assert.notEqual(await encryptToken('a.b.c'), await encryptToken('a.b.c'));
});

test('Changed ciphertext fails authenticated decryption', async () => {
  const parts = (await encryptToken('header.payload.signature')).split('.');
  parts[3] = (parts[3][0] === 'A' ? 'B' : 'A') + parts[3].slice(1);
  await assert.rejects(decryptToken(parts.join('.')), /changed|decrypt|key/i);
});

test('A different encryption key cannot decrypt the envelope', async () => {
  await assert.rejects(decryptToken(await encryptToken('a.b.c'), 'abcdef0123456789abcdef0123456789ab'), /decrypt|key/i);
});

test('Malformed and unsupported envelopes fail clearly', async () => {
  await assert.rejects(decryptToken('a.b.c'), /five|5/i);
});

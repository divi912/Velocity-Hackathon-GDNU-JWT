import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionSimulator } from './sessionSimulation.ts';

const sampleUser = { id: 'user_42', role: 'student', email: 'student@example.com' };

test('Login creates an opaque ID and Redis record', () => {
  const sim = new SessionSimulator(1000);
  const { sid, cookie, record } = sim.login(sampleUser, 1800);

  assert.ok(sid.startsWith('session:'), 'Session ID should start with prefix');
  assert.equal(record.userId, 'user_42');
  assert.equal(record.role, 'student');
  assert.equal(record.expiresAt, 2800);

  const lookup = sim.getSession(sid);
  assert.equal(lookup.status, 'found');
  assert.equal(lookup.session?.userId, 'user_42');
});

test('The cookie contains no user claims', () => {
  const sim = new SessionSimulator(1000);
  const { cookie } = sim.login(sampleUser, 1800);

  assert.ok(cookie.includes('HttpOnly'), 'Cookie must have HttpOnly');
  assert.ok(cookie.includes('Secure'), 'Cookie must have Secure');
  assert.ok(cookie.includes('SameSite=Lax'), 'Cookie must have SameSite');

  // Verify that neither the user ID, email, nor role is leaked inside the cookie string
  assert.equal(cookie.includes('user_42'), false, 'Cookie must not leak userId');
  assert.equal(cookie.includes('student@example.com'), false, 'Cookie must not leak email');
  assert.equal(cookie.includes('student'), false, 'Cookie must not leak role');
});

test('A valid ID retrieves the correct session', () => {
  const sim = new SessionSimulator(1000);
  const { sid } = sim.login(sampleUser, 1800);

  const result = sim.getSession(sid);
  assert.equal(result.status, 'found');
  assert.equal(result.session?.userId, 'user_42');
  assert.equal(result.session?.role, 'student');
  assert.equal(result.ttlRemaining, 1800);
});

test('An unknown ID is rejected', () => {
  const sim = new SessionSimulator(1000);
  const result = sim.getSession('session:nonexistent123');

  assert.equal(result.status, 'not-found');
  assert.equal(result.session, undefined);
});

test('Expired sessions are rejected and removed', () => {
  const sim = new SessionSimulator(1000);
  const { sid } = sim.login(sampleUser, 300); // 300s TTL -> expires at 1300

  // Advance clock past expiration
  sim.advanceTime(301); // Now at 1301

  const result = sim.getSession(sid);
  assert.equal(result.status, 'expired');
  assert.equal(result.session, undefined);

  // Subsequent lookup should be not-found because expired key was evicted
  const nextResult = sim.getSession(sid);
  assert.equal(nextResult.status, 'not-found');
});

test('Logout deletes only the selected session', () => {
  const sim = new SessionSimulator(1000);
  const session1 = sim.login({ id: 'user_1', role: 'admin', email: 'u1@test.com' }, 1800);
  const session2 = sim.login({ id: 'user_2', role: 'member', email: 'u2@test.com' }, 1800);

  // Logout session 1
  const loggedOut = sim.logout(session1.sid);
  assert.equal(loggedOut, true);

  // Session 1 is gone
  const result1 = sim.getSession(session1.sid);
  assert.equal(result1.status, 'not-found');

  // Session 2 is intact
  const result2 = sim.getSession(session2.sid);
  assert.equal(result2.status, 'found');
  assert.equal(result2.session?.userId, 'user_2');
});

test('Sliding expiry extends the TTL correctly', () => {
  const sim = new SessionSimulator(1000);
  const { sid } = sim.login(sampleUser, 600); // expires at 1600

  sim.advanceTime(200); // time = 1200, remaining = 400

  // Touch session with sliding window of 600s
  const result = sim.getSession(sid, { touch: true, touchTtl: 600 });
  assert.equal(result.status, 'found');
  assert.equal(result.session?.expiresAt, 1800); // 1200 + 600 = 1800
  assert.equal(result.ttlRemaining, 600);
});

test('A simulated Redis outage produces a clear unavailable result', () => {
  const sim = new SessionSimulator(1000);
  const { sid } = sim.login(sampleUser, 1800);

  // Redis goes offline
  sim.setRedisOnline(false);

  const result = sim.getSession(sid);
  assert.equal(result.status, 'redis-unavailable');
  assert.ok(result.reason?.includes('unavailable'), 'Reason should describe Redis failure');

  // Bring Redis back online
  sim.setRedisOnline(true);
  const recoveredResult = sim.getSession(sid);
  assert.equal(recoveredResult.status, 'found');
});

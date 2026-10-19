import { useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  Clock,
  Database,
  FastForward,
  Globe,
  Key,
  Lock,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Terminal,
  Trash2,
  UserCheck,
  Zap,
} from 'lucide-react';
import { SessionSimulator, type SessionRecord, type SessionLookupResult } from '../../lib/sessionSimulation';

interface ScenarioFeedback {
  title: string;
  badge: string;
  status: 'success' | 'revoked' | 'expired' | 'error' | 'info';
  explanation: string;
  redisCommand: string;
  clientObservation: string;
}

export function SessionPlayground() {
  const [initialState] = useState(() => {
    const simulator = new SessionSimulator(1700000000);
    const session = simulator.login(
      { id: 'user_42', role: 'student', email: 'alice@mit.edu', name: 'Alice Student' },
      1800
    );
    return { simulator, ...session };
  });
  const { simulator } = initialState;
  const [, setTick] = useState(0);

  // Active client state
  const [activeCookie, setActiveCookie] = useState<string | null>(initialState.cookie);
  const [activeSid, setActiveSid] = useState<string | null>(initialState.sid);
  const [stolenCookie, setStolenCookie] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<{
    code: number;
    status: string;
    body: string;
    endpoint: string;
  } | null>({
    code: 200,
    status: 'OK',
    endpoint: 'POST /login',
    body: JSON.stringify({ message: 'Session created in Redis', sid: initialState.sid }, null, 2),
  });

  const [activeScenarioId, setActiveScenarioId] = useState<string>('happy-path');
  const [feedback, setFeedback] = useState<ScenarioFeedback>({
    title: 'Session Established in Redis',
    badge: '200 OK — STATE CREATED',
    status: 'success',
    explanation:
      'Alice submitted her credentials once. The API checked her password, created an in-memory key in Redis with a 30-minute TTL, and sent back a random session ID in an HttpOnly cookie. Her profile data stays safely in server RAM.',
    redisCommand: `SET ${initialState.sid.slice(0, 20)}... { userId: "user_42", role: "student" } EX 1800`,
    clientObservation: 'The browser holds only the random opaque cookie "sid". It has zero claims or PII inside.',
  });

  const refreshState = () => setTick((t) => t + 1);

  // --- Handlers ---

  const handleLogin = (userIndex = 1) => {
    const user =
      userIndex === 1
        ? { id: 'user_42', role: 'student', email: 'alice@mit.edu', name: 'Alice Student' }
        : { id: 'user_42', role: 'student', email: 'alice.laptop@mit.edu', name: 'Alice (Laptop Session)' };

    const { sid, cookie } = simulator.login(user, 1800);
    setActiveSid(sid);
    setActiveCookie(cookie);
    setLastResponse({
      code: 200,
      status: 'OK',
      endpoint: 'POST /login',
      body: JSON.stringify({ message: 'Session created in Redis', sid }, null, 2),
    });

    setFeedback({
      title: userIndex === 1 ? 'Logged in as Alice (Primary)' : '2nd Device Session Created',
      badge: '200 OK — NEW KEY IN RAM',
      status: 'success',
      explanation:
        userIndex === 1
          ? 'Credentials verified. The API wrote Alice\'s profile to Redis under a brand new random session ID. The browser received a Set-Cookie header.'
          : 'Alice logged in from a second device. Redis now holds two separate session IDs for Alice. If one is revoked or stolen, the other remains safe.',
      redisCommand: `SET ${sid.slice(0, 20)}... { userId: "${user.id}", role: "${user.role}" } EX 1800`,
      clientObservation: `Browser cookie updated to new opaque session ID: ${sid.slice(0, 16)}...`,
    });

    refreshState();
  };

  const handleAuthenticatedRequest = (fromAttacker = false) => {
    const cookieToUse = fromAttacker ? stolenCookie : activeCookie;
    if (!cookieToUse) {
      setLastResponse({
        code: 401,
        status: 'UNAUTHORIZED',
        endpoint: 'GET /profile',
        body: JSON.stringify({ error: 'Missing sid cookie' }, null, 2),
      });
      setFeedback({
        title: 'Request Denied: Missing Cookie',
        badge: '401 UNAUTHORIZED',
        status: 'error',
        explanation: 'No session cookie was sent with the request. The API rejected the call before touching Redis.',
        redisCommand: 'NO REDIS LOOKUP (Header missing)',
        clientObservation: 'Client holds no session cookie. Access denied immediately.',
      });
      refreshState();
      return;
    }

    const sid = simulator.parseCookie(cookieToUse);
    if (!sid) {
      setLastResponse({
        code: 401,
        status: 'UNAUTHORIZED',
        endpoint: 'GET /profile',
        body: JSON.stringify({ error: 'Malformed cookie string' }, null, 2),
      });
      refreshState();
      return;
    }

    const result = simulator.getSession(sid);
    if (result.status === 'found' && result.session) {
      setLastResponse({
        code: 200,
        status: 'OK',
        endpoint: 'GET /profile',
        body: JSON.stringify(
          {
            caller: fromAttacker ? 'ATTACKER (REPLAYED COOKIE)' : 'LEGITIMATE BROWSER',
            user: result.session.userId,
            role: result.session.role,
            email: result.session.email,
            ttlRemainingSeconds: Math.round(result.ttlRemaining ?? 0),
          },
          null,
          2
        ),
      });

      setFeedback({
        title: fromAttacker ? 'Attacker Request Succeeded (Cookie Valid)' : 'Session Verified in RAM (0.3ms)',
        badge: fromAttacker ? '200 OK — ATTACKER ACCESSED' : '200 OK — KEY FOUND',
        status: fromAttacker ? 'revoked' : 'success',
        explanation: fromAttacker
          ? 'Because bearer cookies work by possession, anyone holding the valid cookie can read data until the key is deleted from Redis.'
          : 'The API took the cookie, ran GET in Redis memory, found Alice\'s profile, and returned it in sub-millisecond time. No SQL queries required.',
        redisCommand: `GET ${sid.slice(0, 20)}... -> FOUND (${Math.round(result.ttlRemaining ?? 0)}s remaining)`,
        clientObservation: `Response returned: user="${result.session.userId}", role="${result.session.role}".`,
      });
    } else if (result.status === 'redis-unavailable') {
      setLastResponse({
        code: 503,
        status: 'SERVICE UNAVAILABLE',
        endpoint: 'GET /profile',
        body: JSON.stringify({ error: result.reason }, null, 2),
      });
      setFeedback({
        title: 'Redis Outage: Session Check Blocked',
        badge: '503 SERVICE UNAVAILABLE',
        status: 'error',
        explanation:
          'Redis is unreachable. Unlike JWTs (which can verify signatures offline), stateful sessions rely on a living database. When Redis goes down, requests fail safely.',
        redisCommand: `GET ${sid.slice(0, 20)}... -> CONNECTION REFUSED (PORT 6379)`,
        clientObservation: 'The client receives 503. The API fails closed rather than allowing unauthorized access.',
      });
    } else {
      setLastResponse({
        code: 401,
        status: 'UNAUTHORIZED',
        endpoint: 'GET /profile',
        body: JSON.stringify({ error: result.reason }, null, 2),
      });
      setFeedback({
        title: 'Session Invalid: Key Not in Redis',
        badge: '401 UNAUTHORIZED',
        status: 'revoked',
        explanation:
          'The client sent a session ID, but Redis found no matching record in RAM (it was either revoked or expired). The API rejected the request immediately.',
        redisCommand: `GET ${sid.slice(0, 20)}... -> NIL (Key nonexistent)`,
        clientObservation: 'Even though the browser still held the cookie, possession proved nothing without server state.',
      });
    }
    refreshState();
  };

  const handleTouchTtl = () => {
    if (!activeSid) return;
    const result = simulator.getSession(activeSid, { touch: true, touchTtl: 1800 });
    if (result.status === 'found') {
      setLastResponse({
        code: 200,
        status: 'OK (SLIDING TTL APPLIED)',
        endpoint: 'POST /session/touch',
        body: JSON.stringify({ message: 'Extended Redis TTL by +30m', newTtl: result.ttlRemaining }, null, 2),
      });
      setFeedback({
        title: 'Sliding Expiration: TTL Reset to 30m',
        badge: 'EXPIRE REFRESHED',
        status: 'info',
        explanation:
          'Sliding TTL keeps active users logged in without requiring repeated re-authentication. Each successful request resets the countdown clock in Redis RAM.',
        redisCommand: `EXPIRE ${activeSid.slice(0, 20)}... 1800 -> (integer) 1`,
        clientObservation: `TTL extended to ${Math.round((result.ttlRemaining ?? 1800) / 60)} minutes remaining.`,
      });
    }
    refreshState();
  };

  const handleLogout = () => {
    if (!activeSid) return;
    simulator.logout(activeSid);
    const oldSid = activeSid;
    setActiveCookie(null);
    setActiveSid(null);
    setLastResponse({
      code: 204,
      status: 'NO CONTENT',
      endpoint: 'POST /logout',
      body: JSON.stringify({ message: 'Redis key deleted. Cookie now orphaned.' }, null, 2),
    });
    setFeedback({
      title: 'Instant Revocation: Redis Record Destroyed',
      badge: '204 NO CONTENT — KEY DELETED',
      status: 'revoked',
      explanation:
        'The server executed DEL in Redis. The session data was instantly wiped from server RAM. Even if someone steals or preserves this cookie, it will never work again.',
      redisCommand: `DEL ${oldSid.slice(0, 20)}... -> (integer) 1 (Destroyed)`,
      clientObservation: 'Browser cookie cleared. Any subsequent request with this cookie returns 401.',
    });
    refreshState();
  };

  const handleDeleteSessionKey = (sidToDelete: string) => {
    simulator.logout(sidToDelete);
    if (activeSid === sidToDelete) {
      setActiveCookie(null);
      setActiveSid(null);
    }
    setLastResponse({
      code: 200,
      status: 'ADMIN REVOKE',
      endpoint: 'REDIS ADMIN CLI',
      body: JSON.stringify({ message: `Key ${sidToDelete} removed directly by operator.` }, null, 2),
    });
    setFeedback({
      title: 'Session Killed Directly from Redis',
      badge: 'ADMIN DEL — FORCED LOGOUT',
      status: 'revoked',
      explanation:
        `An administrator ran "DEL ${sidToDelete}" directly in the Redis console. The user was instantly signed out across the globe in 0.2ms. This is impossible with stateless JWTs!`,
      redisCommand: `DEL ${sidToDelete} -> Key purged from RAM`,
      clientObservation: 'The client that owned this session is now permanently unauthorized on its very next click.',
    });
    refreshState();
  };

  const handleAdvanceClock = (seconds: number) => {
    simulator.advanceTime(seconds);
    const mins = Math.round(seconds / 60);

    setFeedback({
      title: `Time Machine Advanced by +${mins} Minutes`,
      badge: `+${mins}M FAST FORWARD`,
      status: seconds >= 1800 ? 'expired' : 'info',
      explanation:
        seconds >= 1800
          ? 'Clock jumped past the 30-minute session TTL. In Redis, expired keys are either lazily evicted on next read or collected by background sweep.'
          : `Clock advanced by ${mins} minutes. Notice the TTL countdown on all active Redis records decreasing.`,
      redisCommand: `CLOCK_TICK (+${seconds}s) -> Current: ${new Date(simulator.getNow() * 1000).toISOString().slice(11, 19)}`,
      clientObservation: 'If TTL reached 0, the next authenticated request from this client will be rejected with 401.',
    });

    refreshState();
  };

  const handleSimulateStolenCookie = () => {
    if (!activeCookie) return;
    setStolenCookie(activeCookie);
    setFeedback({
      title: 'Cookie Exfiltrated (Stolen by Attacker)',
      badge: 'ATTACKER READY',
      status: 'error',
      explanation:
        'A rogue script or malicious extension copied Alice\'s session cookie. Notice the attacker now has the same cookie string in their browser.',
      redisCommand: 'NO REDIS CHANGE (Client-side theft)',
      clientObservation: 'Click "Replay As Attacker" in the middle panel to see the attacker impersonate Alice.',
    });
    refreshState();
  };

  const handleToggleRedis = () => {
    const nextState = !simulator.isRedisOnline();
    simulator.setRedisOnline(nextState);
    setFeedback({
      title: nextState ? 'Redis Restored to Online' : 'Redis Server Crashed (Offline Simulation)',
      badge: nextState ? 'ONLINE (PORT 6379)' : 'OFFLINE (SIMULATED)',
      status: nextState ? 'success' : 'error',
      explanation: nextState
        ? 'Redis connection restored. API queries will now succeed again.'
        : 'Redis connection severed. Watch how the API responds when trying to authenticate requests without the session store.',
      redisCommand: nextState ? 'PING -> PONG' : 'CONNECT 127.0.0.1:6379 -> ECONNREFUSED',
      clientObservation: nextState ? 'Services normal.' : 'Any API request will receive 503 Service Unavailable.',
    });
    refreshState();
  };

  const handleReset = () => {
    simulator.clearAll();
    setActiveCookie(null);
    setActiveSid(null);
    setStolenCookie(null);
    setLastResponse(null);
    setFeedback({
      title: 'Console Reset to Clean Slate',
      badge: 'RESET COMPLETE',
      status: 'info',
      explanation: 'All session keys, event logs, and client cookies were cleared. Ready for a new test run.',
      redisCommand: 'FLUSHDB -> OK',
      clientObservation: 'Client cookies cleared. System in clean state.',
    });
    refreshState();
  };

  // --- 1-Click Guided Scenario Runners ---

  const runScenario = (id: string) => {
    setActiveScenarioId(id);

    if (id === 'happy-path') {
      simulator.clearAll();
      simulator.setRedisOnline(true);
      const { sid, cookie } = simulator.login(
        { id: 'user_42', role: 'student', email: 'alice@mit.edu', name: 'Alice Student' },
        1800
      );
      setActiveSid(sid);
      setActiveCookie(cookie);
      setStolenCookie(null);

      // Immediately run GET /profile to show full round-trip
      const result = simulator.getSession(sid);
      setLastResponse({
        code: 200,
        status: 'OK',
        endpoint: 'GET /profile',
        body: JSON.stringify(
          {
            caller: 'LEGITIMATE BROWSER',
            user: result.session?.userId,
            role: result.session?.role,
            email: result.session?.email,
            ttlRemainingSeconds: Math.round(result.ttlRemaining ?? 0),
          },
          null,
          2
        ),
      });

      setFeedback({
        title: 'Scenario 1: Happy Path Login & Read',
        badge: 'SCENARIO 01 / COMPLETE',
        status: 'success',
        explanation:
          '1. Alice logged in with POST /login.\n2. Server created key "session:..." in Redis RAM with 30m TTL.\n3. Server returned HttpOnly cookie containing only the session ID.\n4. Browser requested GET /profile: API looked up the key in Redis in 0.3ms and returned Alice\'s profile safely.',
        redisCommand: `SET ${sid.slice(0, 18)}... EX 1800 -> GET ${sid.slice(0, 18)}... -> FOUND`,
        clientObservation: 'Zero claims in the browser. Redis holds all sensitive identity in server RAM.',
      });
      refreshState();
    } else if (id === 'instant-revoke') {
      // Create session then immediately revoke it
      simulator.clearAll();
      simulator.setRedisOnline(true);
      const { sid, cookie } = simulator.login(
        { id: 'user_42', role: 'student', email: 'alice@mit.edu', name: 'Alice Student' },
        1800
      );
      // Keep cookie in browser to prove possession means nothing
      setActiveCookie(cookie);
      setActiveSid(sid);
      setStolenCookie(null);

      // Revoke in Redis
      simulator.logout(sid);

      // Now send request with old cookie
      const result = simulator.getSession(sid);
      setLastResponse({
        code: 401,
        status: 'UNAUTHORIZED',
        endpoint: 'GET /profile',
        body: JSON.stringify({ error: result.reason }, null, 2),
      });

      setFeedback({
        title: 'Scenario 2: Instant Revocation (The Redis Superpower)',
        badge: 'SCENARIO 02 / REVOCATION',
        status: 'revoked',
        explanation:
          'Alice clicked Logout. The server executed DEL in Redis. Notice: Even though the browser still retains the cookie string, the very next request is rejected with 401 Unauthorized! With stateless JWTs this is impossible without complex blacklists.',
        redisCommand: `DEL ${sid.slice(0, 18)}... -> (integer) 1\nGET ${sid.slice(0, 18)}... -> (nil)`,
        clientObservation: 'Possessing the cookie proved worthless once the Redis record was deleted.',
      });
      refreshState();
    } else if (id === 'ttl-expiry') {
      simulator.clearAll();
      simulator.setRedisOnline(true);
      const { sid, cookie } = simulator.login(
        { id: 'user_42', role: 'student', email: 'alice@mit.edu', name: 'Alice Student' },
        1800
      );
      setActiveCookie(cookie);
      setActiveSid(sid);
      setStolenCookie(null);

      // Fast forward 31 minutes
      simulator.advanceTime(1860);

      // Try reading profile
      const result = simulator.getSession(sid);
      setLastResponse({
        code: 401,
        status: 'UNAUTHORIZED (EXPIRED)',
        endpoint: 'GET /profile',
        body: JSON.stringify({ error: 'Session expired and has been removed from Redis.' }, null, 2),
      });

      setFeedback({
        title: 'Scenario 3: Automatic TTL Expiry (Time Machine)',
        badge: 'SCENARIO 03 / TTL ZERO',
        status: 'expired',
        explanation:
          'We fast-forwarded the clock past 30 minutes. Redis automatically expired and evicted the key to reclaim server RAM. When the client makes a request, the API detects TTL <= 0 and rejects the call with 401.',
        redisCommand: `CLOCK +1860s -> GET ${sid.slice(0, 18)}... -> EXPIRED (EVICTED FROM RAM)`,
        clientObservation: 'User must log in again. Old session cannot be revived.',
      });
      refreshState();
    } else if (id === 'multi-device') {
      simulator.clearAll();
      simulator.setRedisOnline(true);
      const dev1 = simulator.login(
        { id: 'user_42', role: 'student', email: 'alice.phone@mit.edu', name: 'Alice (iPhone)' },
        1800
      );
      const dev2 = simulator.login(
        { id: 'user_42', role: 'student', email: 'alice.laptop@mit.edu', name: 'Alice (MacBook)' },
        1800
      );
      setActiveCookie(dev2.cookie);
      setActiveSid(dev2.sid);
      setStolenCookie(null);

      setLastResponse({
        code: 200,
        status: 'OK',
        endpoint: 'POST /login (Device 2)',
        body: JSON.stringify(
          {
            activeSessionsInRedis: 2,
            device1_iPhone: dev1.sid.slice(0, 18) + '...',
            device2_MacBook: dev2.sid.slice(0, 18) + '...',
          },
          null,
          2
        ),
      });

      setFeedback({
        title: 'Scenario 4: Multi-Device Session Granularity',
        badge: 'SCENARIO 04 / 2 ACTIVE KEYS',
        status: 'info',
        explanation:
          'Alice is logged in on both her iPhone and MacBook. Redis holds two separate keys. If her laptop is stolen, she can click [DEL KEY] on only the laptop session in Panel 3, revoking it immediately without disrupting her phone!',
        redisCommand: `SET ${dev1.sid.slice(0, 16)}... (Phone)\nSET ${dev2.sid.slice(0, 16)}... (Laptop)`,
        clientObservation: 'Panel 3 now lists 2 active Redis keys. Each device can be inspected or revoked individually.',
      });
      refreshState();
    } else if (id === 'stolen-cookie') {
      simulator.clearAll();
      simulator.setRedisOnline(true);
      const { sid, cookie } = simulator.login(
        { id: 'user_42', role: 'student', email: 'alice@mit.edu', name: 'Alice Student' },
        1800
      );
      setActiveCookie(cookie);
      setActiveSid(sid);
      setStolenCookie(cookie);

      // Replay request as attacker
      const result = simulator.getSession(sid);
      setLastResponse({
        code: 200,
        status: 'OK (EXPLOITED)',
        endpoint: 'GET /profile (by Attacker)',
        body: JSON.stringify(
          {
            caller: 'ATTACKER (REPLAYED COOKIE)',
            user: result.session?.userId,
            role: result.session?.role,
            warning: 'Attacker accessed profile using stolen cookie!',
          },
          null,
          2
        ),
      });

      setFeedback({
        title: 'Scenario 5: Stolen Cookie & Admin Kill Switch',
        badge: 'SCENARIO 05 / BREACH & REMEDY',
        status: 'error',
        explanation:
          'Because cookies are bearer tokens, an attacker with a copy can replay it. HOWEVER: Click "[DEL KEY]" in Panel 3 below to see an operator immediately destroy the key in Redis, shutting down the attacker on the spot!',
        redisCommand: `GET ${sid.slice(0, 18)}... -> FOUND (Attacker caller)`,
        clientObservation: 'Attacker currently has access. Click [DEL KEY] on the Redis key to shut down the breach!',
      });
      refreshState();
    }
  };

  const sessions = simulator.getAllSessions();
  const logs = simulator.getLogs();
  const isRedisOnline = simulator.isRedisOnline();

  return (
    <section id="playground" className="border-t-4 border-white bg-black text-white py-16">
      <div className="mx-auto max-w-[1536px] px-5 md:px-10 xl:px-16">
        {/* Editorial Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="section-label text-neutral-400">INTERACTIVE INSPECTION CONSOLE</span>
              <span className="size-2 bg-white" />
              <span className="section-label text-neutral-500">/SESSIONS/PLAYGROUND</span>
            </div>
            <h2 className="font-display text-[clamp(36px,4.5vw,64px)] leading-none tracking-tight">
              The Redis Session <span className="italic">Console.</span>
            </h2>
            <p className="mt-2 text-xs md:text-sm text-neutral-400 max-w-[700px]">
              Explore how Redis in-memory sessions manage identity, instantaneous revocation, and TTL expiry.
              Pick a 1-click guided lab below or simulate manual traffic across the 3 architecture panels.
            </p>
          </div>

          {/* High-Level Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-mono ${
                isRedisOnline ? 'border-white text-white' : 'border-neutral-500 text-neutral-500'
              }`}
            >
              <span className={`size-2 ${isRedisOnline ? 'bg-white' : 'bg-neutral-600'}`} />
              REDIS: {isRedisOnline ? 'ONLINE (PORT 6379)' : 'OFFLINE (REFUSED)'}
            </span>
            <span className="border border-neutral-700 px-3 py-1.5 text-xs font-mono text-neutral-300">
              ACTIVE KEYS: <strong className="text-white">{sessions.length}</strong>
            </span>
            <span className="border border-neutral-700 px-3 py-1.5 text-xs font-mono text-neutral-300">
              BROWSER:{' '}
              <strong className={activeCookie ? 'text-white' : 'text-neutral-500'}>
                {activeCookie ? 'AUTHENTICATED' : 'ANONYMOUS'}
              </strong>
            </span>
          </div>
        </div>

        {/* 1-CLICK GUIDED SCENARIO LABS */}
        <div className="mb-8 border-2 border-white bg-[#0a0a0a] p-5">
          <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-neutral-800 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-white" />
              <span className="section-label font-bold text-white tracking-widest">
                GUIDED 1-CLICK LABS (START HERE)
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Click any scenario to load and observe the end-to-end network flow
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => runScenario('happy-path')}
              className={`p-3 border text-left flex flex-col justify-between transition-colors min-h-[96px] ${
                activeScenarioId === 'happy-path'
                  ? 'border-white bg-white text-black'
                  : 'border-neutral-800 bg-black text-white hover:border-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] font-bold">01 / HAPPY PATH</span>
                <Play size={10} />
              </div>
              <div>
                <span className="block font-bold text-xs uppercase">Login &amp; Profile</span>
                <span className={`text-[10px] line-clamp-2 ${activeScenarioId === 'happy-path' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  Credentials create key in Redis; GET /profile reads RAM.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => runScenario('instant-revoke')}
              className={`p-3 border text-left flex flex-col justify-between transition-colors min-h-[96px] ${
                activeScenarioId === 'instant-revoke'
                  ? 'border-white bg-white text-black'
                  : 'border-neutral-800 bg-black text-white hover:border-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] font-bold">02 / REVOCATION</span>
                <Play size={10} />
              </div>
              <div>
                <span className="block font-bold text-xs uppercase">Instant Logout</span>
                <span className={`text-[10px] line-clamp-2 ${activeScenarioId === 'instant-revoke' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  DEL key kills session immediately; next request gets 401.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => runScenario('ttl-expiry')}
              className={`p-3 border text-left flex flex-col justify-between transition-colors min-h-[96px] ${
                activeScenarioId === 'ttl-expiry'
                  ? 'border-white bg-white text-black'
                  : 'border-neutral-800 bg-black text-white hover:border-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] font-bold">03 / TIME MACHINE</span>
                <Play size={10} />
              </div>
              <div>
                <span className="block font-bold text-xs uppercase">TTL Auto-Expiry</span>
                <span className={`text-[10px] line-clamp-2 ${activeScenarioId === 'ttl-expiry' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  Advance +30 mins past TTL; Redis auto-evicts key.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => runScenario('multi-device')}
              className={`p-3 border text-left flex flex-col justify-between transition-colors min-h-[96px] ${
                activeScenarioId === 'multi-device'
                  ? 'border-white bg-white text-black'
                  : 'border-neutral-800 bg-black text-white hover:border-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] font-bold">04 / MULTI-DEVICE</span>
                <Play size={10} />
              </div>
              <div>
                <span className="block font-bold text-xs uppercase">2 Device Keys</span>
                <span className={`text-[10px] line-clamp-2 ${activeScenarioId === 'multi-device' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  Alice logs in on phone &amp; laptop; revoke one without other.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => runScenario('stolen-cookie')}
              className={`p-3 border text-left flex flex-col justify-between transition-colors min-h-[96px] ${
                activeScenarioId === 'stolen-cookie'
                  ? 'border-white bg-white text-black'
                  : 'border-neutral-800 bg-black text-white hover:border-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] font-bold">05 / ATTACK &amp; KILL</span>
                <Play size={10} />
              </div>
              <div>
                <span className="block font-bold text-xs uppercase">Stolen Cookie</span>
                <span className={`text-[10px] line-clamp-2 ${activeScenarioId === 'stolen-cookie' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  Attacker replays cookie; admin deletes key in Redis to kill it.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* LIVE "WHAT JUST HAPPENED?" EXPLANATION BANNER */}
        <div className="mb-8 border-2 border-white bg-black p-5">
          <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-800 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-white" />
              <span className="section-label font-bold text-white tracking-widest">
                WHAT JUST HAPPENED (PLAIN ENGLISH TRACE)
              </span>
            </div>
            <span className="font-mono text-xs border border-white px-2 py-0.5 bg-white text-black font-bold">
              {feedback.badge}
            </span>
          </div>

          <h3 className="font-display text-xl md:text-2xl font-bold mb-2">{feedback.title}</h3>
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-[1200px] whitespace-pre-line mb-4">
            {feedback.explanation}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-neutral-800 font-mono text-xs">
            <div className="bg-[#111111] border border-neutral-800 p-2.5">
              <span className="text-[10px] text-neutral-400 block mb-1">REDIS RAM INSTRUCTION:</span>
              <span className="text-white font-bold">{feedback.redisCommand}</span>
            </div>
            <div className="bg-[#111111] border border-neutral-800 p-2.5">
              <span className="text-[10px] text-neutral-400 block mb-1">CLIENT OBSERVATION:</span>
              <span className="text-neutral-300">{feedback.clientObservation}</span>
            </div>
          </div>
        </div>

        {/* CATEGORIZED MANUAL ACTION TOOLBAR */}
        <div className="mb-8 border border-neutral-800 bg-[#0d0d0d] p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800 flex-wrap gap-2">
            <span className="section-label text-neutral-400 font-bold">MANUAL ACTION TOOLBAR</span>
            <span className="text-[11px] font-mono text-neutral-500">
              Execute individual commands step-by-step
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GROUP 1: AUTHENTICATION */}
            <div className="border border-neutral-800 p-3 bg-black flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-2 font-bold">
                  01 / Authentication
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleLogin(1)}
                    className="w-full border border-white bg-white text-black px-2.5 py-1 text-xs font-mono font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={12} />
                    POST /login (Alice)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogin(2)}
                    className="w-full border border-neutral-700 bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-neutral-900 transition-colors"
                  >
                    + 2nd Device Session
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={!activeSid}
                    className="w-full border border-neutral-700 bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-neutral-900 transition-colors disabled:opacity-30"
                  >
                    POST /logout (DEL)
                  </button>
                </div>
              </div>
            </div>

            {/* GROUP 2: API CALLS */}
            <div className="border border-neutral-800 p-3 bg-black flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-2 font-bold">
                  02 / API Requests
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleAuthenticatedRequest(false)}
                    className="w-full border border-white bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-white hover:text-black transition-colors"
                  >
                    GET /profile (Browser)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthenticatedRequest(true)}
                    disabled={!stolenCookie}
                    className="w-full border border-neutral-700 bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-neutral-900 transition-colors disabled:opacity-30"
                  >
                    GET /profile (Attacker)
                  </button>
                  <button
                    type="button"
                    onClick={handleTouchTtl}
                    disabled={!activeSid}
                    className="w-full border border-neutral-700 bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-neutral-900 transition-colors disabled:opacity-30"
                  >
                    Touch TTL (+30m Sliding)
                  </button>
                </div>
              </div>
            </div>

            {/* GROUP 3: TIME MACHINE */}
            <div className="border border-neutral-800 p-3 bg-black flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-2 font-bold">
                  03 / Time Machine
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdvanceClock(300)}
                    className="w-full border border-neutral-700 bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-neutral-900 transition-colors flex items-center justify-center gap-1"
                  >
                    <FastForward size={12} />
                    +5 Mins (Idle)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceClock(1800)}
                    className="w-full border border-neutral-700 bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-neutral-900 transition-colors flex items-center justify-center gap-1"
                  >
                    <FastForward size={12} />
                    +30 Mins (Expire TTL)
                  </button>
                </div>
              </div>
            </div>

            {/* GROUP 4: CHAOS & RESET */}
            <div className="border border-neutral-800 p-3 bg-black flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-2 font-bold">
                  04 / Chaos &amp; Reset
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={handleSimulateStolenCookie}
                    disabled={!activeCookie}
                    className="w-full border border-neutral-700 bg-black text-white px-2.5 py-1 text-xs font-mono hover:bg-neutral-900 transition-colors disabled:opacity-30"
                  >
                    Steal Alice Cookie
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleRedis}
                    className={`w-full border px-2.5 py-1 text-xs font-mono transition-colors ${
                      isRedisOnline
                        ? 'border-neutral-700 bg-black text-neutral-300 hover:text-white'
                        : 'border-white bg-white text-black font-bold'
                    }`}
                  >
                    {isRedisOnline ? 'Simulate Redis Crash' : 'Restore Redis'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full border border-neutral-800 text-neutral-400 px-2.5 py-1 text-xs font-mono hover:text-white hover:border-white transition-colors"
                  >
                    Reset Everything
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-PANEL CONNECTED ARCHITECTURE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 border-2 border-white bg-[#0a0a0a]">
          {/* PANEL 1: BROWSER (COOKIE JAR) */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-white" />
                  <span className="section-label font-bold text-white">01 / BROWSER COOKIE JAR</span>
                </div>
                <span className="text-[9px] border border-neutral-700 px-1.5 py-0.5 text-neutral-400 font-mono">
                  CLIENT BOUNDARY
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 block font-mono">Active Client Cookie:</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 border ${
                        activeCookie ? 'border-white text-white' : 'border-neutral-800 text-neutral-600'
                      }`}
                    >
                      {activeCookie ? 'COOKIE PRESENT' : 'EMPTY'}
                    </span>
                  </div>
                  {activeCookie ? (
                    <div className="font-mono text-xs p-3 bg-black border border-neutral-700 text-white break-all">
                      {activeCookie}
                    </div>
                  ) : (
                    <div className="font-mono text-xs p-3 bg-black border border-neutral-800 text-neutral-600 italic">
                      (No active cookie. Browser is logged out.)
                    </div>
                  )}
                </div>

                <div className="bg-[#121212] p-3 border border-neutral-800 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">HttpOnly:</span>
                    <span className="text-white font-mono">YES (Hidden from JS)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Secure:</span>
                    <span className="text-white font-mono">YES (HTTPS only)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">SameSite:</span>
                    <span className="text-white font-mono">Lax</span>
                  </div>
                </div>

                {stolenCookie && (
                  <div className="border border-white p-3 bg-black mt-4">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-neutral-800">
                      <span className="section-label text-white font-bold">ATTACKER CLIENT</span>
                      <button
                        type="button"
                        onClick={() => handleAuthenticatedRequest(true)}
                        className="text-[9px] border border-white px-2 py-0.5 bg-white text-black font-bold hover:bg-neutral-200 transition-colors"
                      >
                        Replay Request
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400 break-all font-mono">
                      Stolen: {stolenCookie.slice(0, 36)}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-6 text-[10px] text-neutral-400 pt-4 border-t border-neutral-900 leading-normal font-mono">
              Notice: The browser never touches user roles or permissions. It holds only the opaque random token ID.
            </p>
          </div>

          {/* PANEL 2: API SERVER (SESSION CHECK) */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-white flex flex-col justify-between bg-[#0e0e0e]">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-white" />
                  <span className="section-label font-bold text-white">02 / API SERVER VALIDATOR</span>
                </div>
                <span className="text-[9px] border border-neutral-700 px-1.5 py-0.5 text-neutral-400 font-mono">
                  BUSINESS LOGIC
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-neutral-400 block mb-1 font-mono">Last Server Response:</span>
                  {lastResponse ? (
                    <div className="font-mono text-xs p-3 bg-black border border-white space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                        <span className="font-bold text-white">{lastResponse.endpoint}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 border font-bold ${
                            lastResponse.code === 200
                              ? 'bg-white text-black border-white'
                              : 'border-white text-white'
                          }`}
                        >
                          {lastResponse.code} {lastResponse.status}
                        </span>
                      </div>
                      <pre className="text-[10px] text-neutral-300 leading-relaxed overflow-x-auto">
                        {lastResponse.body}
                      </pre>
                    </div>
                  ) : (
                    <div className="font-mono text-xs p-3 bg-black border border-neutral-800 text-neutral-600 italic">
                      (No requests sent yet. Click a scenario or action above.)
                    </div>
                  )}
                </div>

                <div className="border border-neutral-800 p-3 bg-[#121212] text-[10px] space-y-1 text-neutral-300 font-mono">
                  <p className="text-white font-bold">LIVE PIPELINE FLOW:</p>
                  <p>1. Extract sid cookie from request headers</p>
                  <p>2. Query Redis in RAM (`GET session:...`)</p>
                  <p>3. If found, enforce role permissions and return profile</p>
                  <p>4. If not found or expired, immediately reject with 401</p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-[10px] text-neutral-400 pt-4 border-t border-neutral-900 leading-normal font-mono">
              Every request forces a live memory check. If the session was deleted, 401 is returned instantaneously.
            </p>
          </div>

          {/* PANEL 3: REDIS MEMORY (STORED RECORDS) */}
          <div className="p-6 flex flex-col justify-between bg-[#111111]">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-white" />
                  <span className="section-label font-bold text-white">03 / REDIS MEMORY RECORDS</span>
                </div>
                <span className="text-[9px] border border-white px-2 py-0.5 bg-white text-black font-bold font-mono">
                  {sessions.length} ACTIVE KEYS
                </span>
              </div>

              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="font-mono text-xs p-6 bg-black border border-neutral-800 text-neutral-600 text-center italic">
                    (Redis store is empty. No active sessions in memory.)
                  </div>
                ) : (
                  sessions.map(({ sid, record, ttlRemaining }) => {
                    const pct = Math.max(0, Math.min(100, Math.round((ttlRemaining / 1800) * 100)));
                    return (
                      <div
                        key={sid}
                        className="border border-white bg-black p-3 font-mono text-xs space-y-2"
                      >
                        <div className="flex justify-between items-center pb-1.5 border-b border-neutral-800">
                          <span className="text-white font-bold">{sid.slice(0, 18)}...</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] border border-white px-1.5 py-0.5 text-white">
                              TTL {Math.round(ttlRemaining)}s
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSessionKey(sid)}
                              title="Delete key directly from Redis (Forced Admin Revocation)"
                              className="border border-white px-2 py-0.5 text-[9px] bg-white text-black font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1"
                            >
                              <Trash2 size={10} />
                              DEL
                            </button>
                          </div>
                        </div>

                        {/* Visual TTL Progress Bar */}
                        <div className="w-full bg-neutral-900 h-1.5 border border-neutral-800 overflow-hidden">
                          <div
                            className="bg-white h-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="text-[10px] text-neutral-300">
                          userId: <span className="text-white font-bold">{record.userId}</span> | role:{' '}
                          <span className="text-white">{record.role}</span>
                        </div>
                        <div className="text-[9px] text-neutral-400 truncate">{record.email}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <p className="mt-6 text-[10px] text-neutral-400 pt-4 border-t border-neutral-900 leading-normal font-mono">
              When TTL reaches 0 or DEL is called, memory is instantly reclaimed and access is dead.
            </p>
          </div>
        </div>

        {/* LIVE EVENT LOG TERMINAL */}
        <div className="mt-8 border border-white bg-black p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-white" />
              <span className="section-label text-white font-bold">SESSION EVENT LOG (REAL-TIME AUDIT TRACE)</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">LATEST 50 OPERATIONS</span>
          </div>

          <div className="font-mono text-xs max-h-[180px] overflow-y-auto space-y-1.5 text-neutral-300">
            {logs.length === 0 ? (
              <p className="text-neutral-600 italic">No events logged yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 hover:bg-[#121212] py-0.5 px-1">
                  <span className="text-neutral-500 shrink-0">{log.time}</span>
                  <span className="text-white font-bold shrink-0">{log.action}</span>
                  <span className="text-neutral-400 break-all">{log.detail}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

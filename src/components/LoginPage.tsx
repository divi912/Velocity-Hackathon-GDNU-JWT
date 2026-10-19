import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Database,
  Eye,
  Key,
  Layers,
  Lock,
  LogOut,
  Play,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { signToken, parseToken, DEMO_SECRET } from '../lib/jwt';
import { SessionSimulator } from '../lib/sessionSimulation';
import { AuthNetworkDiagram } from './AuthNetworkDiagram';
import { getRouteUrl } from '../lib/routes';

export type AuthParadigm = 'jwt' | 'redis';

interface UserPreset {
  id: string;
  email: string;
  role: string;
  name: string;
  clearance: string;
}

const PRESET_USERS: Record<string, UserPreset> = {
  alice: {
    id: 'user_42',
    email: 'alice@university.edu',
    role: 'student',
    name: 'Alice Henderson',
    clearance: 'read:course_materials',
  },
  eve: {
    id: 'admin_01',
    email: 'eve@university.edu',
    role: 'admin',
    name: 'Eve Administrator',
    clearance: 'write:grades,manage:cluster',
  },
};

export function LoginPage({
  motionEnabled,
  onNavigate,
  paradigm: controlledParadigm,
  onParadigmChange,
}: {
  motionEnabled: boolean;
  onNavigate?: (path: string) => void;
  paradigm?: AuthParadigm;
  onParadigmChange?: (paradigm: AuthParadigm) => void;
}) {
  const [internalParadigm, setInternalParadigm] = useState<AuthParadigm>('jwt');
  const paradigm = controlledParadigm ?? internalParadigm;

  const setParadigm = (p: AuthParadigm) => {
    setInternalParadigm(p);
    onParadigmChange?.(p);
  };

  const isDark = paradigm === 'redis';

  const [selectedUserKey, setSelectedUserKey] = useState<'alice' | 'eve'>('alice');
  const [email, setEmail] = useState(PRESET_USERS.alice.email);
  const [password, setPassword] = useState('correct-horse-battery-staple');

  // Interactive submission state
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [interactiveAction, setInteractiveAction] = useState<'idle' | 'request' | 'revocation'>('idle');

  // Simulation outputs
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [redisSession, setRedisSession] = useState<{ sid: string; cookie: string; ttl: number } | null>(null);
  const [subsequentResponse, setSubsequentResponse] = useState<{
    status: number;
    text: string;
    latency: string;
    lookupMade: boolean;
  } | null>(null);

  const [sessionSim] = useState(() => new SessionSimulator(1700000000));

  const activeUser = PRESET_USERS[selectedUserKey];

  const handleSelectPreset = (key: 'alice' | 'eve') => {
    setSelectedUserKey(key);
    setEmail(PRESET_USERS[key].email);
    setPassword('correct-horse-battery-staple');
  };

  const handleAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setSubmitted(true);
    setCurrentStep(1);
    setInteractiveAction('idle');
    setSubsequentResponse(null);

    const now = Math.floor(Date.now() / 1000);

    if (paradigm === 'jwt') {
      // Step 1: Check creds (800ms)
      setTimeout(async () => {
        setCurrentStep(2); // Minting token
        const token = await signToken({
          sub: activeUser.id,
          email: activeUser.email,
          role: activeUser.role,
          clearance: activeUser.clearance,
          iat: now,
          exp: now + 1800,
          iss: 'https://auth.university.edu',
          aud: 'campus-api',
        });
        setJwtToken(token);

        setTimeout(() => {
          setCurrentStep(3); // Response to browser
          setTimeout(() => {
            setCurrentStep(4); // Subsequent request verification
            setIsProcessing(false);
          }, 1400);
        }, 1400);
      }, 800);
    } else {
      // Redis Session paradigm
      setTimeout(() => {
        setCurrentStep(2); // Generating session in Redis
        const { sid, cookie } = sessionSim.login(
          { id: activeUser.id, role: activeUser.role, email: activeUser.email, name: activeUser.name },
          1800
        );
        setRedisSession({ sid, cookie, ttl: 1800 });

        setTimeout(() => {
          setCurrentStep(3); // Cookie returns to client
          setTimeout(() => {
            setCurrentStep(4); // Subsequent request via Redis lookup
            setIsProcessing(false);
          }, 1400);
        }, 1400);
      }, 800);
    }
  };

  const handleTestSubsequentRequest = () => {
    setInteractiveAction('request');
    if (paradigm === 'jwt') {
      setSubsequentResponse({
        status: 200,
        text: `ACCESS GRANTED — API verified HMAC-SHA256 signature locally in CPU registers. Database queried: 0 times. Sub: ${activeUser.id}, Role: ${activeUser.role}`,
        latency: '0.04 ms',
        lookupMade: false,
      });
    } else {
      if (!redisSession) return;
      const result = sessionSim.getSession(redisSession.sid);
      if (result.status === 'found' && result.session) {
        setSubsequentResponse({
          status: 200,
          text: `ACCESS GRANTED — API extracted sid from cookie, queried Redis in RAM (key: ${redisSession.sid.slice(0, 16)}...), matched active session. Sub: ${result.session.userId}, Role: ${result.session.role}`,
          latency: '0.85 ms',
          lookupMade: true,
        });
      } else {
        setSubsequentResponse({
          status: 401,
          text: 'ACCESS DENIED — Session ID not found in Redis store (Key expired or revoked).',
          latency: '0.50 ms',
          lookupMade: true,
        });
      }
    }
  };

  const handleTestRevocation = () => {
    setInteractiveAction('revocation');
    if (paradigm === 'jwt') {
      setSubsequentResponse({
        status: 200,
        text: 'SECURITY NOTICE: Attempted logout by deleting client copy. However, this JWT remains mathematically valid everywhere until exp ticks down! Any stolen copy remains authorized.',
        latency: '0.04 ms',
        lookupMade: false,
      });
    } else {
      if (!redisSession) return;
      sessionSim.logout(redisSession.sid);
      setSubsequentResponse({
        status: 401,
        text: `INSTANT LOGOUT COMPLETE: Executed "DEL ${redisSession.sid}". Key wiped from Redis in 0.22ms. The client still holds the cookie, but it now points to empty memory. Access blocked globally.`,
        latency: '0.22 ms',
        lookupMade: true,
      });
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setIsProcessing(false);
    setCurrentStep(0);
    setInteractiveAction('idle');
    setJwtToken(null);
    setRedisSession(null);
    setSubsequentResponse(null);
  };

  return (
    <div className={`min-h-screen py-10 px-5 md:px-10 lg:px-16 transition-colors duration-200 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="mx-auto max-w-[1536px]">
        {/* Top Breadcrumb & Switcher */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-current">
          <div className="flex items-center gap-3">
            <a
              href={getRouteUrl('/')}
              onClick={e => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/');
                }
              }}
              className="text-xs font-mono underline underline-offset-4 hover:opacity-70 flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              Return to Guide
            </a>
            <span className="opacity-30">/</span>
            <span className="section-label">LAB 003 — AUTHENTICATION DISSECTION</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono opacity-60 uppercase mr-2">Target Paradigm:</span>
            <div className="flex border border-current text-[10px] font-mono">
              <button
                type="button"
                onClick={() => {
                  setParadigm('jwt');
                  if (submitted) handleReset();
                }}
                className={`px-3 py-1.5 font-bold transition-colors ${
                  paradigm === 'jwt'
                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                    : 'bg-transparent text-current hover:opacity-80'
                }`}
              >
                JWT (STATELESS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setParadigm('redis');
                  if (submitted) handleReset();
                }}
                className={`px-3 py-1.5 font-bold transition-colors ${
                  paradigm === 'redis'
                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                    : 'bg-transparent text-current hover:opacity-80'
                }`}
              >
                REDIS (SESSIONS)
              </button>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-10 max-w-[900px]">
          <h1 className="font-display text-[clamp(36px,5.5vw,76px)] leading-[1.05] tracking-tight">
            Authenticate & observe.<br />
            <span className="italic">
              {paradigm === 'jwt' ? 'Watch client-side proof travel.' : 'Watch server-side memory take control.'}
            </span>
          </h1>
          <p className="mt-4 text-xs md:text-sm leading-relaxed opacity-70 max-w-[650px]">
            Input test credentials and select an architecture. The authentication box will slide to the left to expose the full cryptographic or memory pipeline in real time.
          </p>
        </div>

        {/* Sliding Split-Screen Container */}
        <div className="relative flex flex-col lg:flex-row items-start gap-8 min-h-[620px]">
          {/* THE LOGIN BOX (Slides Left with Framer Motion) */}
          <motion.div
            layout
            transition={
              motionEnabled
                ? { type: 'spring', damping: 28, stiffness: 120 }
                : { duration: 0 }
            }
            className={`w-full transition-all duration-300 ${
              submitted ? 'lg:w-[400px] shrink-0' : 'max-w-[620px] mx-auto'
            }`}
          >
            <div
              className={`border-2 p-6 md:p-8 transition-colors ${
                isDark
                  ? 'border-white bg-[#0e0e0e] text-white'
                  : 'border-black bg-white text-black'
              }`}
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-current">
                <div>
                  <span className="section-label block opacity-60">CLIENT FORM</span>
                  <h2 className="font-display text-2xl font-bold">Sign In</h2>
                </div>
                <span className="size-3 border-2 border-current" />
              </div>

              {/* Preset Quick Selectors */}
              <div className="mb-6">
                <span className="text-[10px] font-mono opacity-60 uppercase block mb-2">
                  Quick Demo Persona:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('alice')}
                    className={`p-2 border border-current text-left transition-colors ${
                      selectedUserKey === 'alice'
                        ? (isDark ? 'bg-white text-black font-bold' : 'bg-black text-white font-bold')
                        : (isDark ? 'hover:bg-neutral-900' : 'hover:bg-neutral-100')
                    }`}
                  >
                    <span className="block text-[9px] opacity-70">STUDENT</span>
                    Alice Henderson
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('eve')}
                    className={`p-2 border border-current text-left transition-colors ${
                      selectedUserKey === 'eve'
                        ? (isDark ? 'bg-white text-black font-bold' : 'bg-black text-white font-bold')
                        : (isDark ? 'hover:bg-neutral-900' : 'hover:bg-neutral-100')
                    }`}
                  >
                    <span className="block text-[9px] opacity-70">ADMINISTRATOR</span>
                    Eve Administrator
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleAuthenticate} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="section-label block opacity-70 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full border-2 border-current bg-transparent px-3 py-2.5 text-xs text-inherit focus:outline-none focus:ring-0 focus:border-current"
                  />
                </div>

                <div>
                  <label className="section-label block opacity-70 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full border-2 border-current bg-transparent px-3 py-2.5 text-xs text-inherit focus:outline-none focus:ring-0 focus:border-current"
                  />
                  <span className="text-[9px] opacity-50 block mt-1">
                    Passes to TLS → checked via Argon2 hash in DB. Never sent to Redis.
                  </span>
                </div>

                {/* Paradigm Selection Radio Cards */}
                <div className="pt-2">
                  <label className="section-label block opacity-70 mb-2">Select Architecture</label>
                  <div className="space-y-2">
                    <label
                      onClick={() => setParadigm('jwt')}
                      className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                        paradigm === 'jwt'
                          ? (isDark ? 'border-white bg-neutral-900 text-white font-bold' : 'border-black bg-neutral-100 text-black font-bold')
                          : (isDark ? 'border-neutral-700 opacity-60 hover:opacity-100' : 'border-neutral-400 opacity-70 hover:opacity-100')
                      }`}
                    >
                      <input
                        type="radio"
                        name="paradigm"
                        checked={paradigm === 'jwt'}
                        onChange={() => setParadigm('jwt')}
                        className={`mt-1 ${isDark ? 'accent-white' : 'accent-black'}`}
                      />
                      <div>
                        <span className="block text-xs uppercase tracking-wide">JWT (Stateless Token)</span>
                        <span className="text-[10px] opacity-60 block font-normal">
                          Claims signed with secret. Browser holds the proof.
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setParadigm('redis')}
                      className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                        paradigm === 'redis'
                          ? (isDark ? 'border-white bg-neutral-900 text-white font-bold' : 'border-black bg-neutral-100 text-black font-bold')
                          : (isDark ? 'border-neutral-700 opacity-60 hover:opacity-100' : 'border-neutral-400 opacity-70 hover:opacity-100')
                      }`}
                    >
                      <input
                        type="radio"
                        name="paradigm"
                        checked={paradigm === 'redis'}
                        onChange={() => setParadigm('redis')}
                        className={`mt-1 ${isDark ? 'accent-white' : 'accent-black'}`}
                      />
                      <div>
                        <span className="block text-xs uppercase tracking-wide">Redis (Stateful Session)</span>
                        <span className="text-[10px] opacity-60 block font-normal">
                          Claims stored in server RAM. Browser holds random opaque ticket.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full button-base ${
                      isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                    } transition-colors py-3.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2`}
                  >
                    {isProcessing ? (
                      <>
                        <Zap size={14} className="animate-spin" />
                        Tracing Execution...
                      </>
                    ) : (
                      <>
                        Authenticate & Trace <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  {submitted && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full mt-2 text-center text-[10px] opacity-60 hover:opacity-100 underline py-1"
                    >
                      Reset Form & Re-center
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>

          {/* THE MOTION GRAPHIC STAGE (Revealed as login box slides left) */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={motionEnabled ? { opacity: 0, x: 50 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={motionEnabled ? { opacity: 0, x: 50 } : undefined}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex-1 w-full min-w-0"
              >
                <div
                  className={`border-2 p-6 md:p-8 transition-colors overflow-hidden ${
                    isDark
                      ? 'border-white bg-[#0a0a0a] text-white'
                      : 'border-black bg-white text-black'
                  }`}
                >
                  {/* Stage Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-current">
                    <div>
                      <span className="section-label opacity-60">LIVE EXECUTION TRACE</span>
                      <h3 className="font-display text-2xl font-bold">
                        {paradigm === 'jwt' ? 'HMAC-SHA256 Token Minting' : 'Redis Session Pipeline'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className={`size-2 ${isProcessing ? 'animate-pulse' : ''} bg-current`} />
                      <span className="uppercase font-bold">
                        {isProcessing ? 'PIPELINE ACTIVE' : 'AUTHENTICATED'}
                      </span>
                    </div>
                  </div>

                  {/* ═══════════════════ JWT VISUAL PIPELINE ═══════════════════ */}
                  {paradigm === 'jwt' && (
                    <div className="space-y-0">
                      {/* ── PHASE 1: Raw JSON Objects ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 1 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 01</span>
                          <div className="flex-1 border-t border-dashed border-current opacity-20" />
                          <span className="font-mono text-[9px] opacity-40">CREDENTIAL CHECK</span>
                        </div>

                        <div className="relative mb-2">
                          <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-current opacity-20" />
                          <p className="font-mono text-[10px] opacity-60 mb-3 pl-2">
                            Server verifies email + password via Argon2 hash. Credentials never stored in token.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <motion.div
                              className="border border-current p-3"
                              initial={motionEnabled ? { scale: 0.95, opacity: 0 } : false}
                              animate={currentStep >= 1 ? { scale: 1, opacity: 1 } : {}}
                              transition={{ duration: 0.4, delay: 0.2 }}
                            >
                              <span className="section-label text-[9px] opacity-50 block mb-1">HEADER (JSON)</span>
                              <pre className="font-mono text-[11px] leading-relaxed">{`{
  "alg": "HS256",
  "typ": "JWT"
}`}</pre>
                            </motion.div>
                            <motion.div
                              className="border border-current p-3"
                              initial={motionEnabled ? { scale: 0.95, opacity: 0 } : false}
                              animate={currentStep >= 1 ? { scale: 1, opacity: 1 } : {}}
                              transition={{ duration: 0.4, delay: 0.35 }}
                            >
                              <span className="section-label text-[9px] opacity-50 block mb-1">PAYLOAD (JSON)</span>
                              <pre className="font-mono text-[11px] leading-relaxed">{`{
  "sub": "${activeUser.id}",
  "role": "${activeUser.role}",
  "email": "${activeUser.email}",
  "exp": ${Math.floor(Date.now() / 1000) + 1800}
}`}</pre>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>

                      {/* ── Animated Arrow Connector 1→2 ── */}
                      <motion.div
                        className="flex flex-col items-center py-2"
                        initial={motionEnabled ? { opacity: 0 } : false}
                        animate={currentStep >= 2 ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="w-[2px] bg-current origin-top"
                          initial={motionEnabled ? { scaleY: 0 } : false}
                          animate={currentStep >= 2 ? { scaleY: 1 } : {}}
                          transition={{ duration: 0.5 }}
                          style={{ height: 32 }}
                        />
                        <motion.div
                          className={`px-3 py-1 border text-[9px] font-mono font-bold tracking-wider ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}
                          initial={motionEnabled ? { opacity: 0, scale: 0.8 } : false}
                          animate={currentStep >= 2 ? { opacity: 1, scale: 1 } : {}}
                          transition={{ duration: 0.3, delay: 0.3 }}
                        >
                          BASE64URL ENCODE
                        </motion.div>
                        <motion.div
                          className="w-[2px] bg-current origin-top"
                          initial={motionEnabled ? { scaleY: 0 } : false}
                          animate={currentStep >= 2 ? { scaleY: 1 } : {}}
                          transition={{ duration: 0.5, delay: 0.4 }}
                          style={{ height: 32 }}
                        />
                        <motion.div
                          initial={motionEnabled ? { opacity: 0 } : false}
                          animate={currentStep >= 2 ? { opacity: 1 } : {}}
                          transition={{ delay: 0.6 }}
                        >
                          <ArrowRight size={14} className="rotate-90" />
                        </motion.div>
                      </motion.div>

                      {/* ── PHASE 2: Base64URL Encoded Parts ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 2 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 02</span>
                          <div className="flex-1 border-t border-dashed border-current opacity-20" />
                          <span className="font-mono text-[9px] opacity-40">ENCODE → SIGN → ASSEMBLE</span>
                        </div>

                        {jwtToken ? (
                          <div className="space-y-2">
                            {/* Header encoded */}
                            <motion.div
                              className={`p-3 border font-mono text-xs break-all relative ${isDark ? 'border-neutral-600 bg-[#111]' : 'border-neutral-300 bg-neutral-100'}`}
                              initial={motionEnabled ? { x: -20, opacity: 0 } : false}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.4, delay: 0.1 }}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold opacity-60 tracking-wider">HEADER · BASE64URL</span>
                                <span className={`text-[8px] px-1.5 py-0.5 font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>PART 1</span>
                              </div>
                              <span className="text-[11px] leading-relaxed">{jwtToken.split('.')[0]}</span>
                            </motion.div>

                            {/* Dot separator */}
                            <motion.div
                              className="flex justify-center"
                              initial={motionEnabled ? { scale: 0 } : false}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.3 }}
                            >
                              <span className={`font-display text-4xl font-bold leading-none ${isDark ? 'text-white' : 'text-black'}`}>.</span>
                            </motion.div>

                            {/* Payload encoded */}
                            <motion.div
                              className={`p-3 border font-mono text-xs break-all relative ${isDark ? 'border-white bg-[#0a0a0a]' : 'border-black bg-neutral-900 text-white'}`}
                              initial={motionEnabled ? { x: -20, opacity: 0 } : false}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold opacity-60 tracking-wider text-neutral-400">PAYLOAD · BASE64URL</span>
                                <span className="text-[8px] px-1.5 py-0.5 bg-white text-black font-bold">PART 2</span>
                              </div>
                              <span className="text-[11px] leading-relaxed text-neutral-200">{jwtToken.split('.')[1]}</span>
                              <div className="mt-2 pt-1 border-t border-neutral-700 text-[10px] text-neutral-400 flex items-center gap-1">
                                <Eye size={10} /> Decoded: sub="{activeUser.id}" role="{activeUser.role}" exp=+30m
                              </div>
                            </motion.div>

                            {/* Dot separator */}
                            <motion.div
                              className="flex justify-center"
                              initial={motionEnabled ? { scale: 0 } : false}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.55 }}
                            >
                              <span className={`font-display text-4xl font-bold leading-none ${isDark ? 'text-white' : 'text-black'}`}>.</span>
                            </motion.div>

                            {/* HMAC Signature computation graphic */}
                            <motion.div
                              initial={motionEnabled ? { opacity: 0, y: 10 } : false}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.6 }}
                            >
                              <div className={`border-2 p-3 relative ${isDark ? 'border-white' : 'border-black'}`}>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[9px] font-mono font-bold tracking-wider opacity-60">SIGNATURE · HMAC-SHA256</span>
                                  <span className={`text-[8px] px-1.5 py-0.5 font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>PART 3</span>
                                </div>
                                {/* Computation visualization */}
                                <div className={`p-2 mb-2 font-mono text-[9px] border border-dashed ${isDark ? 'border-neutral-600 text-neutral-400' : 'border-neutral-400 text-neutral-500'}`}>
                                  <span className="block">HMAC-SHA256(</span>
                                  <span className="block pl-4">key = <span className={isDark ? 'text-white' : 'text-black'}>"████████████████"</span>,</span>
                                  <span className="block pl-4">data = <span className="opacity-70">header.payload</span></span>
                                  <span className="block">)</span>
                                </div>
                                <motion.div
                                  className={`font-mono text-[11px] break-all p-2 ${isDark ? 'bg-[#111] border border-neutral-700' : 'bg-neutral-100 border border-neutral-300'}`}
                                  initial={motionEnabled ? { opacity: 0 } : false}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.8 }}
                                >
                                  {jwtToken.split('.')[2]}
                                </motion.div>
                              </div>
                            </motion.div>
                          </div>
                        ) : (
                          <div className="p-8 text-center font-mono text-xs opacity-40">
                            <Zap size={18} className="mx-auto mb-2 animate-spin" />
                            Generating token…
                          </div>
                        )}
                      </motion.div>

                      {/* ── Animated Arrow Connector 2→3 ── */}
                      <motion.div
                        className="flex flex-col items-center py-2"
                        initial={motionEnabled ? { opacity: 0 } : false}
                        animate={currentStep >= 3 ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="w-[2px] bg-current origin-top"
                          initial={motionEnabled ? { scaleY: 0 } : false}
                          animate={currentStep >= 3 ? { scaleY: 1 } : {}}
                          transition={{ duration: 0.5 }}
                          style={{ height: 24 }}
                        />
                        <motion.div
                          className={`px-3 py-1 border text-[9px] font-mono font-bold tracking-wider ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}
                          initial={motionEnabled ? { opacity: 0, scale: 0.8 } : false}
                          animate={currentStep >= 3 ? { opacity: 1, scale: 1 } : {}}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          ASSEMBLE TOKEN
                        </motion.div>
                        <motion.div
                          className="w-[2px] bg-current origin-top"
                          initial={motionEnabled ? { scaleY: 0 } : false}
                          animate={currentStep >= 3 ? { scaleY: 1 } : {}}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          style={{ height: 24 }}
                        />
                        <motion.div
                          initial={motionEnabled ? { opacity: 0 } : false}
                          animate={currentStep >= 3 ? { opacity: 1 } : {}}
                          transition={{ delay: 0.5 }}
                        >
                          <ArrowRight size={14} className="rotate-90" />
                        </motion.div>
                      </motion.div>

                      {/* ── PHASE 3: Assembled Token → Travels to Server graphic ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 3 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 03</span>
                          <div className="flex-1 border-t border-dashed border-current opacity-20" />
                          <span className="font-mono text-[9px] opacity-40">TOKEN → BROWSER</span>
                        </div>

                        {/* The assembled complete token */}
                        {jwtToken && (
                          <motion.div
                            className={`border-2 p-4 mb-4 ${isDark ? 'border-white' : 'border-black'}`}
                            initial={motionEnabled ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="section-label text-[9px] font-bold">COMPLETE JWT</span>
                              <span className={`text-[8px] px-2 py-0.5 font-bold font-mono ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                {jwtToken.length} CHARS
                              </span>
                            </div>
                            <div className={`font-mono text-[10px] p-2 break-all leading-relaxed ${isDark ? 'bg-[#111] text-neutral-300' : 'bg-neutral-100 text-neutral-700'}`}>
                              <span className={isDark ? 'text-white' : 'text-black'}>{jwtToken.split('.')[0]}</span>
                              <span className="text-neutral-500 font-bold text-sm">.</span>
                              <span className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>{jwtToken.split('.')[1]}</span>
                              <span className="text-neutral-500 font-bold text-sm">.</span>
                              <span className={isDark ? 'text-white' : 'text-black'}>{jwtToken.split('.')[2]}</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Interactive Architectural Blueprint Graphic (Browser Client <-> Enterprise Server Rack) */}
                        <motion.div
                          initial={motionEnabled ? { opacity: 0, y: 15 } : false}
                          animate={currentStep >= 3 ? { opacity: 1, y: 0 } : {}}
                          transition={{ delay: 0.3 }}
                        >
                          <AuthNetworkDiagram
                            paradigm="jwt"
                            isDark={isDark}
                            currentStep={currentStep}
                            isProcessing={isProcessing}
                            activeUser={activeUser}
                            jwtToken={jwtToken}
                            redisSession={null}
                            subsequentResponse={subsequentResponse}
                            interactiveAction={interactiveAction}
                            motionEnabled={motionEnabled}
                          />
                        </motion.div>
                      </motion.div>

                      {/* ── PHASE 4: Architecture stats ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="pt-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 04</span>
                          <div className="flex-1 border-t border-dashed border-current opacity-20" />
                          <span className="font-mono text-[9px] opacity-40">VERIFICATION MODEL</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                          <motion.div
                            className="border border-current p-3"
                            initial={motionEnabled ? { opacity: 0, y: 10 } : false}
                            animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.1 }}
                          >
                            <span className="section-label block opacity-50 text-[9px] mb-1">SERVER RAM</span>
                            <span className="text-lg font-bold block">0 bytes</span>
                            <p className="text-[9px] opacity-50 mt-1">Signs and forgets</p>
                          </motion.div>
                          <motion.div
                            className="border border-current p-3"
                            initial={motionEnabled ? { opacity: 0, y: 10 } : false}
                            animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.2 }}
                          >
                            <span className="section-label block opacity-50 text-[9px] mb-1">WIRE WEIGHT</span>
                            <span className="text-lg font-bold block">~{jwtToken?.length ?? 840} B</span>
                            <p className="text-[9px] opacity-50 mt-1">Every request carries full claims</p>
                          </motion.div>
                          <motion.div
                            className="border border-current p-3"
                            initial={motionEnabled ? { opacity: 0, y: 10 } : false}
                            animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.3 }}
                          >
                            <span className="section-label block opacity-50 text-[9px] mb-1">VERIFICATION</span>
                            <span className="text-lg font-bold block">Math only</span>
                            <p className="text-[9px] opacity-50 mt-1">No DB lookup needed</p>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ═══════════════════ REDIS VISUAL PIPELINE ═══════════════════ */}
                  {paradigm === 'redis' && (
                    <div className="space-y-0">
                      {/* ── PHASE 1: Credentials enter server ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 1 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 01</span>
                          <div className="flex-1 border-t border-dashed border-neutral-700 opacity-40" />
                          <span className="font-mono text-[9px] opacity-40">CREDENTIAL CHECK</span>
                        </div>

                        {/* Credentials entering server wall graphic */}
                        <div className="relative h-24 overflow-hidden mb-4">
                          <svg viewBox="0 0 600 90" className="w-full h-full" aria-hidden="true">
                            {/* Browser */}
                            <rect x="0" y="25" width="120" height="40" fill="none" stroke="white" strokeWidth="1.5" />
                            <text x="60" y="50" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace">BROWSER</text>

                            {/* Server wall */}
                            <rect x="340" y="5" width="260" height="80" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 3" />
                            <text x="470" y="20" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" opacity="0.5">SERVER BOUNDARY</text>
                            <rect x="380" y="30" width="100" height="30" fill="white" />
                            <text x="430" y="50" textAnchor="middle" fill="black" fontSize="8" fontFamily="monospace" fontWeight="bold">ARGON2 CHECK</text>

                            {/* Animated credentials packet */}
                            <motion.g
                              initial={motionEnabled ? { x: 0 } : { x: 240 }}
                              animate={currentStep >= 1 ? { x: 240 } : {}}
                              transition={{ duration: 1, ease: 'easeInOut' }}
                            >
                              <rect x="0" y="32" width="90" height="26" fill="white" />
                              <text x="45" y="49" textAnchor="middle" fill="black" fontSize="7" fontFamily="monospace" fontWeight="bold">email + pass</text>
                            </motion.g>

                            {/* Arrow */}
                            <line x1="120" y1="45" x2="340" y2="45" stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                          </svg>
                        </div>

                        <p className="font-mono text-[10px] opacity-50 mb-4">
                          Credentials pass through TLS, are hashed with Argon2, then discarded. They never enter Redis.
                        </p>
                      </motion.div>

                      {/* ── Arrow 1→2 ── */}
                      <motion.div
                        className="flex flex-col items-center py-1"
                        initial={motionEnabled ? { opacity: 0 } : false}
                        animate={currentStep >= 2 ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div className="w-[2px] bg-white origin-top" initial={motionEnabled ? { scaleY: 0 } : false} animate={currentStep >= 2 ? { scaleY: 1 } : {}} transition={{ duration: 0.4 }} style={{ height: 20 }} />
                        <motion.div className="px-3 py-1 border border-white bg-white text-black text-[9px] font-mono font-bold tracking-wider" initial={motionEnabled ? { opacity: 0, scale: 0.8 } : false} animate={currentStep >= 2 ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }}>
                          GENERATE SESSION
                        </motion.div>
                        <motion.div className="w-[2px] bg-white origin-top" initial={motionEnabled ? { scaleY: 0 } : false} animate={currentStep >= 2 ? { scaleY: 1 } : {}} transition={{ duration: 0.4, delay: 0.3 }} style={{ height: 20 }} />
                        <motion.div initial={motionEnabled ? { opacity: 0 } : false} animate={currentStep >= 2 ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}>
                          <ArrowRight size={14} className="rotate-90" />
                        </motion.div>
                      </motion.div>

                      {/* ── PHASE 2: Redis stores the session ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 2 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 02</span>
                          <div className="flex-1 border-t border-dashed border-neutral-700 opacity-40" />
                          <span className="font-mono text-[9px] opacity-40">SESSION → REDIS RAM</span>
                        </div>

                        {redisSession ? (
                          <div className="space-y-2">
                            {/* Session Key */}
                            <motion.div
                              className="p-3 border border-white bg-black flex justify-between items-center"
                              initial={motionEnabled ? { x: -20, opacity: 0 } : false}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.4, delay: 0.1 }}
                            >
                              <div className="font-mono">
                                <span className="text-[9px] text-neutral-500 block">KEY (128-BIT OPAQUE ID)</span>
                                <span className="text-xs font-bold text-white">{redisSession.sid}</span>
                              </div>
                              <motion.div
                                className="border border-white px-2 py-1 text-[10px] font-mono font-bold"
                                animate={motionEnabled ? { opacity: [1, 0.4, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                              >
                                TTL 1,800s
                              </motion.div>
                            </motion.div>

                            {/* Redis "memory shelf" — stored JSON */}
                            <motion.div
                              className="border border-neutral-600 bg-[#0e0e0e] p-3 relative"
                              initial={motionEnabled ? { x: -20, opacity: 0 } : false}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-mono text-neutral-500">STORED VALUE (JSON in RAM)</span>
                                <span className="text-[8px] px-1.5 py-0.5 bg-white text-black font-bold font-mono">SERVER ONLY</span>
                              </div>
                              <pre className="font-mono text-[11px] leading-relaxed text-neutral-200">{JSON.stringify({ userId: activeUser.id, role: activeUser.role, email: activeUser.email, createdAt: Math.floor(Date.now() / 1000) }, null, 2)}</pre>
                              {/* Visual indicator: lock icon overlay */}
                              <div className="absolute top-2 right-2 opacity-20">
                                <Lock size={24} />
                              </div>
                            </motion.div>

                            {/* Insight: browser never sees this data */}
                            <motion.p
                              className="font-mono text-[10px] text-neutral-500 pt-1"
                              initial={motionEnabled ? { opacity: 0 } : false}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              ↑ This data stays inside Redis. The browser never sees it.
                            </motion.p>
                          </div>
                        ) : (
                          <div className="p-8 text-center font-mono text-xs opacity-40">
                            <Database size={18} className="mx-auto mb-2 animate-pulse" />
                            Allocating session in RAM…
                          </div>
                        )}
                      </motion.div>

                      {/* ── Arrow 2→3 ── */}
                      <motion.div
                        className="flex flex-col items-center py-1"
                        initial={motionEnabled ? { opacity: 0 } : false}
                        animate={currentStep >= 3 ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div className="w-[2px] bg-white origin-top" initial={motionEnabled ? { scaleY: 0 } : false} animate={currentStep >= 3 ? { scaleY: 1 } : {}} transition={{ duration: 0.4 }} style={{ height: 20 }} />
                        <motion.div className="px-3 py-1 border border-white bg-white text-black text-[9px] font-mono font-bold tracking-wider" initial={motionEnabled ? { opacity: 0, scale: 0.8 } : false} animate={currentStep >= 3 ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }}>
                          WRAP IN COOKIE
                        </motion.div>
                        <motion.div className="w-[2px] bg-white origin-top" initial={motionEnabled ? { scaleY: 0 } : false} animate={currentStep >= 3 ? { scaleY: 1 } : {}} transition={{ duration: 0.4, delay: 0.3 }} style={{ height: 20 }} />
                        <motion.div initial={motionEnabled ? { opacity: 0 } : false} animate={currentStep >= 3 ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}>
                          <ArrowRight size={14} className="rotate-90" />
                        </motion.div>
                      </motion.div>

                      {/* ── PHASE 3: Cookie wrapper returns to browser ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 3 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 03</span>
                          <div className="flex-1 border-t border-dashed border-neutral-700 opacity-40" />
                          <span className="font-mono text-[9px] opacity-40">COOKIE → BROWSER</span>
                        </div>

                        {redisSession && (
                          <>
                            {/* Cookie wrapper */}
                            <motion.div
                              className="border-2 border-white p-3 mb-4"
                              initial={motionEnabled ? { opacity: 0 } : false}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="section-label text-[9px] font-bold text-neutral-400">SET-COOKIE HEADER</span>
                                <span className="text-[8px] px-2 py-0.5 bg-white text-black font-bold font-mono">
                                  {redisSession.sid.length} CHARS
                                </span>
                              </div>
                              <div className="font-mono text-[10px] break-all leading-relaxed text-neutral-300 bg-[#111] p-2">
                                {redisSession.cookie}
                              </div>
                              {/* Cookie flag explanations */}
                              <div className="grid grid-cols-2 gap-2 mt-2 text-[9px] font-mono text-neutral-500">
                                <div className="flex items-center gap-1"><Shield size={9} /> HttpOnly — no JS access</div>
                                <div className="flex items-center gap-1"><Lock size={9} /> Secure — HTTPS only</div>
                                <div className="flex items-center gap-1"><Layers size={9} /> SameSite=Lax</div>
                                <div className="flex items-center gap-1"><Clock size={9} /> Max-Age=1800</div>
                              </div>
                            </motion.div>

                            {/* Interactive Architectural Blueprint Graphic (Browser Client <-> Enterprise Redis Rack) */}
                            <motion.div
                              initial={motionEnabled ? { opacity: 0, y: 15 } : false}
                              animate={currentStep >= 3 ? { opacity: 1, y: 0 } : {}}
                              transition={{ delay: 0.3 }}
                            >
                              <AuthNetworkDiagram
                                paradigm="redis"
                                isDark={isDark}
                                currentStep={currentStep}
                                isProcessing={isProcessing}
                                activeUser={activeUser}
                                jwtToken={null}
                                redisSession={redisSession}
                                subsequentResponse={subsequentResponse}
                                interactiveAction={interactiveAction}
                                motionEnabled={motionEnabled}
                              />
                            </motion.div>
                          </>
                        )}
                      </motion.div>

                      {/* ── PHASE 4: Architecture stats ── */}
                      <motion.div
                        initial={motionEnabled ? { opacity: 0, y: 20 } : false}
                        animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="pt-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-wider opacity-50">PHASE 04</span>
                          <div className="flex-1 border-t border-dashed border-neutral-700 opacity-40" />
                          <span className="font-mono text-[9px] opacity-40">VERIFICATION MODEL</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                          <motion.div className="border border-white p-3" initial={motionEnabled ? { opacity: 0, y: 10 } : false} animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}>
                            <span className="section-label block text-neutral-500 text-[9px] mb-1">SERVER RAM</span>
                            <span className="text-lg font-bold block">184 bytes</span>
                            <p className="text-[9px] text-neutral-500 mt-1">Stored until DEL or TTL=0</p>
                          </motion.div>
                          <motion.div className="border border-white p-3" initial={motionEnabled ? { opacity: 0, y: 10 } : false} animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}>
                            <span className="section-label block text-neutral-500 text-[9px] mb-1">WIRE WEIGHT</span>
                            <span className="text-lg font-bold block">32 bytes</span>
                            <p className="text-[9px] text-neutral-500 mt-1">Only opaque ID on every request</p>
                          </motion.div>
                          <motion.div className="border border-white p-3" initial={motionEnabled ? { opacity: 0, y: 10 } : false} animate={currentStep >= 4 ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}>
                            <span className="section-label block text-neutral-500 text-[9px] mb-1">REVOCATION</span>
                            <span className="text-lg font-bold block">Instant</span>
                            <p className="text-[9px] text-neutral-500 mt-1">DEL key → immediate logout</p>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ═══════ Interactive Sub-Action Testing Console ═══════ */}
                  <motion.div
                    className="mt-8 border-t border-current pt-6"
                    initial={motionEnabled ? { opacity: 0 } : false}
                    animate={currentStep >= 4 ? { opacity: 1 } : {}}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="section-label block opacity-60 mb-3">TEST SUBSEQUENT INTERACTIONS</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTestSubsequentRequest}
                        className={`button-base border border-current bg-transparent transition-colors px-4 py-2 text-xs font-mono ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'}`}
                      >
                        GET /api/profile (Subsequent Request)
                      </button>

                      <button
                        type="button"
                        onClick={handleTestRevocation}
                        className={`button-base border border-current bg-transparent transition-colors px-4 py-2 text-xs font-mono ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'}`}
                      >
                        {paradigm === 'jwt' ? 'Test Client Logout' : 'Execute DEL in Redis (Instant Logout)'}
                      </button>
                    </div>

                    {/* Subsequent request inspection box */}
                    <AnimatePresence>
                      {subsequentResponse && (
                        <motion.div
                          initial={motionEnabled ? { opacity: 0, y: 10 } : false}
                          animate={{ opacity: 1, y: 0 }}
                          exit={motionEnabled ? { opacity: 0 } : undefined}
                          className="mt-4 p-4 border border-current font-mono text-xs space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-current opacity-70">
                            <span className="font-bold">STATUS: {subsequentResponse.status}</span>
                            <span>LATENCY: {subsequentResponse.latency}</span>
                            <span>DB QUERY: {subsequentResponse.lookupMade ? 'YES (REDIS RAM)' : 'NO (STATELESS MATH)'}</span>
                          </div>
                          <p className="pt-2 text-[11px] leading-relaxed">{subsequentResponse.text}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

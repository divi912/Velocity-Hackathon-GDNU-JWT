import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Copy, FlaskConical, RotateCcw, Send, ShieldCheck, X } from 'lucide-react';
import { AUDIENCE, ISSUER, parseToken, replacePayload, signToken, verifyToken } from '../lib/jwt';
import type { Claims, Verification } from '../lib/jwt';

const sampleClaims = (now: number, audience = AUDIENCE): Claims => ({
  sub: 'user_42', role: 'student', iss: ISSUER, aud: audience, iat: now, exp: now + 300,
});

export function TokenLab({ motionEnabled }: { motionEnabled: boolean }) {
  const [token, setToken] = useState('');
  const [editor, setEditor] = useState('');
  const [editorError, setEditorError] = useState('');
  const [systemError, setSystemError] = useState('');
  const [result, setResult] = useState<Verification | null>(null);
  const [issuedAt, setIssuedAt] = useState(0);
  const [offset, setOffset] = useState(0);
  const [endpoint, setEndpoint] = useState('/profile');
  const [issuing, setIssuing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [request, setRequest] = useState(0);
  const [copied, setCopied] = useState('');
  const [experiment, setExperiment] = useState('Start with a valid student token. Then try to break it.');
  const issueGeneration = useRef(0);
  const verifyGeneration = useRef(0);
  const mounted = useRef(true);

  async function issue(audience = AUDIENCE) {
    const generation = ++issueGeneration.current;
    ++verifyGeneration.current;
    setIssuing(true); setSystemError(''); setEditorError(''); setResult(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      const payload = sampleClaims(now, audience);
      const signed = await signToken(payload);
      if (!mounted.current || generation !== issueGeneration.current) return;
      setToken(signed); setEditor(JSON.stringify(payload, null, 2)); setIssuedAt(now); setOffset(0); setEndpoint('/profile');
      setExperiment(audience === AUDIENCE ? 'Fresh student token. The API should accept it for /profile.' : 'A real signature, but meant for other-api. Will this API accept it?');
    } catch (error) {
      if (mounted.current && generation === issueGeneration.current) setSystemError(error instanceof Error ? error.message : 'The token could not be issued.');
    } finally { if (mounted.current && generation === issueGeneration.current) setIssuing(false); }
  }

  useEffect(() => {
    mounted.current = true;
    void issue();
    return () => { mounted.current = false; ++issueGeneration.current; ++verifyGeneration.current; };
  }, []);

  useEffect(() => {
    const generation = ++verifyGeneration.current;
    if (!token || editorError || issuing) { setResult(null); setVerifying(false); return; }
    setVerifying(true);
    void verifyToken(token, { now: issuedAt + offset, endpoint }).then(check => {
      if (mounted.current && generation === verifyGeneration.current) { setResult(check); setSystemError(''); }
    }).catch(error => {
      if (mounted.current && generation === verifyGeneration.current) { setSystemError(error instanceof Error ? error.message : 'Checks could not run.'); setResult(null); }
    }).finally(() => { if (mounted.current && generation === verifyGeneration.current) setVerifying(false); });
    return () => { ++verifyGeneration.current; };
  }, [token, editorError, issuedAt, offset, endpoint, issuing, request]);

  function editPayload(text: string) {
    ++verifyGeneration.current; ++issueGeneration.current;
    setEditor(text); setCopied('');
    try {
      const value: unknown = JSON.parse(text);
      if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Use a JSON object inside { braces }.');
      setToken(replacePayload(token, value as Claims)); setEditorError('');
      setExperiment('You changed the payload. The original signature is still attached.');
    } catch (error) { setEditorError(error instanceof SyntaxError ? 'This JSON is not complete yet. Check the quotes, commas, and braces.' : error instanceof Error ? error.message : 'Check your JSON.'); setResult(null); }
  }

  function tamper() {
    try { editPayload(JSON.stringify({ ...parseToken(token).payload, role: 'admin' }, null, 2)); }
    catch { setEditorError('Issue a fresh token first, then change its role.'); }
  }

  async function copyToken() {
    try { await navigator.clipboard.writeText(token); setCopied('Copied'); }
    catch { setCopied('Copy unavailable. Select the token below.'); }
  }

  const failed = result?.checks.find(check => check.status === 'fail');
  const signature = token.split('.')[2] ?? '';
  const duration = motionEnabled ? .35 : 0;

  return <section id="playground" className="border-t-4 border-black bg-black text-white" aria-labelledby="lab-title">
    <div className="mx-auto max-w-[1536px] px-5 py-16 md:px-10 lg:py-24 xl:px-16">
      <div className="mb-6 flex items-center justify-between"><span className="section-label flex items-center gap-3"><FlaskConical size={15} strokeWidth={1.5} />The hands-on part</span><span className="section-label text-neutral-400">Your turn</span></div>
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <h2 id="lab-title" className="font-display text-[clamp(56px,6.6vw,102px)] leading-none tracking-[-.05em]">Break it.<br /><span className="italic">Then understand it.</span></h2>
        <p className="max-w-[360px] text-xs leading-7 text-neutral-400">Edit a claim. Move the clock. Ask for admin access.<br />See the exact check that says no.</p>
      </div>
      <div className="mt-10 border border-neutral-600">
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-600 p-4 md:flex-row md:items-center md:px-6"><span className="text-[10px] leading-5 text-neutral-400">BROWSER-LOCAL SERVER SIMULATION · REAL CRYPTO · PUBLIC DEMO KEYS</span><button type="button" disabled={issuing} onClick={() => void issue()} className="flex min-h-9 items-center gap-2 self-start text-[11px] underline underline-offset-4 md:self-auto"><RotateCcw size={12} />Issue a fresh token</button></div>
        <div className="flex flex-wrap gap-2 p-4 md:px-6">
          <button disabled={issuing || !token} type="button" onClick={tamper} className="button-base border-neutral-600 hover:bg-white hover:text-black">01 / Make me admin</button>
          <button disabled={issuing || !token} type="button" onClick={() => { setOffset(301); setExperiment('The signature is untouched. Only the clock moved past exp.'); }} className="button-base border-neutral-600 hover:bg-white hover:text-black">02 / Expire the token</button>
          <button disabled={issuing} type="button" onClick={() => void issue('other-api')} className="button-base border-neutral-600 hover:bg-white hover:text-black">03 / Use the wrong API</button>
        </div>
        <p className="border-b border-neutral-600 px-4 pb-5 text-[11px] leading-6 text-neutral-400 md:px-6">↳ {experiment}</p>
        <div className="grid lg:grid-cols-2">
          <div className="min-w-0 bg-white text-black">
            <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4"><h3 className="section-label">01 / Your browser</h3><span className="section-label text-neutral-500">Editable payload</span></div>
            <div className="p-5 md:p-6">
              <label htmlFor="payload-json" className="mb-3 block text-[10px] text-neutral-500">Change any claim. The signature will stay as it was.</label>
              <textarea id="payload-json" aria-describedby={editorError ? 'payload-error' : undefined} aria-invalid={Boolean(editorError)} spellCheck={false} disabled={issuing} value={editor} onChange={e => editPayload(e.target.value)} className="min-h-[240px] w-full resize-y border border-black bg-soft p-4 font-mono text-[11px] leading-7 md:text-xs" />
              {editorError && <p id="payload-error" role="alert" className="mt-3 border-l-2 border-black pl-3 text-xs leading-6">{editorError}</p>}
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0"><label htmlFor="endpoint" className="section-label mb-2 block">Request a route</label><select id="endpoint" value={endpoint} onChange={e => setEndpoint(e.target.value)} className="min-h-11 w-full border border-black bg-white px-3 text-xs"><option value="/profile">GET /profile — any signed-in user</option><option value="/admin">GET /admin — admins only</option></select></div>
                <button type="button" disabled={issuing || Boolean(editorError) || !token} onClick={() => setRequest(value => value + 1)} className="button-base shrink-0 bg-black text-white hover:bg-white hover:text-black"><Send size={14} />Send to API</button>
              </div>
              <div className="mt-6 border-t border-neutral-300 pt-5"><div className="mb-3 flex justify-between"><label htmlFor="clock" className="section-label">Move the server clock</label><output htmlFor="clock" className="text-[10px]">+{offset}s / expires at +300s</output></div><input id="clock" type="range" min="0" max="600" value={offset} onChange={e => setOffset(Number(e.target.value))} className="h-7 w-full accent-black" /><div className="mt-1 flex justify-between text-[9px] text-neutral-500"><span>JUST ISSUED</span><span>5 MIN / EXP</span><span>10 MIN</span></div></div>
            </div>
          </div>
          <div className="min-w-0 border-t border-neutral-600 lg:border-t-0 lg:border-l">
            <div className="flex items-center justify-between border-b border-neutral-600 px-5 py-4"><h3 className="section-label">02 / Inside the API</h3><span className="section-label text-neutral-400">Check by check</span></div>
            <div className="px-5 pt-5 md:px-6">
              <div className="relative mb-5 flex h-11 items-center justify-between gap-4 overflow-hidden border-y border-neutral-700 text-[9px] text-neutral-400"><span className="bg-black pr-2">BROWSER</span><div className="h-px flex-1 bg-neutral-600" /><span className="bg-black pl-2">API SERVER</span><AnimatePresence>{token && !editorError && <motion.span key={`${token}-${offset}-${endpoint}-${request}`} initial={motionEnabled ? { left: '20%', opacity: 0 } : false} animate={motionEnabled ? { left: ['20%', '80%'], opacity: [0, 1, 1, 0] } : { left: '48%', opacity: 1 }} transition={{ duration: motionEnabled ? .9 : 0, times: [0, .1, .85, 1] }} className="absolute border border-white bg-black px-2 py-1 text-white">JWT →</motion.span>}</AnimatePresence></div>
              {systemError && <p role="alert" className="mb-4 text-xs leading-6">{systemError}</p>}
              <ol className="min-h-[340px]">
                {(result?.checks ?? []).map((check, i) => <motion.li key={check.id} initial={false} animate={{ opacity: check.status === 'skip' ? .35 : 1 }} transition={{ duration }} className="flex items-start gap-3 border-b border-neutral-800 py-3 first:pt-0">
                  <span className={`mt-1 flex size-[18px] shrink-0 items-center justify-center border ${check.status === 'pass' ? 'border-white bg-white text-black' : 'border-neutral-500'}`}>{check.status === 'pass' ? <Check size={12} /> : check.status === 'fail' ? <X size={12} /> : <span className="text-[8px]">{i + 1}</span>}</span>
                  <div><div className="flex items-center gap-3"><span className="text-[11px]">{check.label}</span><span className="text-[8px] tracking-widest uppercase text-neutral-400">{check.status === 'skip' ? 'WAIT' : check.status}</span></div><p className="mt-1 text-[10px] leading-5 text-neutral-400">{check.detail}</p></div>
                </motion.li>)}
                {(issuing || verifying) && <li className="py-5 text-xs text-neutral-400">{issuing ? 'The issuer is signing a new token…' : 'The server is checking the token…'}</li>}
              </ol>
              <div aria-live="polite" aria-atomic="true" className="py-5"><AnimatePresence mode="wait"><motion.div key={editorError || systemError || (result ? String(result.accepted) + failed?.id : 'waiting')} initial={motionEnabled ? { opacity: 0, y: 5 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .15 }} className={`flex items-center gap-3 border p-4 ${result?.accepted ? 'border-white bg-white text-black' : 'border-neutral-600'}`}>
                {result?.accepted ? <ShieldCheck size={21} strokeWidth={1.5} /> : <X size={20} strokeWidth={1.5} />}<div><p className="text-xs">{editorError ? 'Fix the JSON to continue' : systemError ? 'Checks unavailable' : !result ? 'Waiting for a token' : result.accepted ? '200 / Request allowed' : failed?.id === 'permission' ? '403 / Permission denied' : '401 / Token rejected'}</p><p className={`mt-1 text-[9px] ${result?.accepted ? 'text-neutral-600' : 'text-neutral-400'}`}>{result?.accepted ? `The student can use ${endpoint}.` : failed ? `Stopped at: ${failed.label.toLowerCase()}.` : 'A result will appear here.'}</p></div>
              </motion.div></AnimatePresence></div>
            </div>
          </div>
        </div>
        <details className="group border-t border-neutral-600">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[11px] md:px-6">Look under the hood <ChevronDown size={15} className="transition-transform group-open:rotate-180" /></summary>
          <div className="border-t border-neutral-700 p-5 md:p-6">
            <div className="mb-3 flex items-center justify-between gap-3"><label htmlFor="raw-token" className="section-label text-neutral-400">Full token / editable</label><button onClick={() => void copyToken()} type="button" className="flex min-h-9 items-center gap-2 text-[10px]"><Copy size={12} />{copied || 'Copy token'}</button></div>
            <textarea id="raw-token" spellCheck={false} value={token} onChange={e => { ++verifyGeneration.current; setToken(e.target.value); setEditorError(''); setCopied(''); try { setEditor(JSON.stringify(parseToken(e.target.value).payload, null, 2)); } catch { /* Keep the payload editor while showing token format failure. */ } }} className="h-24 w-full resize-y border border-neutral-600 bg-black p-3 font-mono text-[10px] leading-6 break-all text-neutral-300" />
            <div className="mt-5 grid gap-6 md:grid-cols-2"><div className="min-w-0"><p className="section-label mb-2 text-neutral-400">Received signature</p><code className="block text-[10px] leading-6 break-all">{signature || '—'}</code></div><div className="min-w-0"><p className="section-label mb-2 text-neutral-400">Expected signature / computed with the key</p><code className="block text-[10px] leading-6 break-all">{result?.expectedSignature ?? 'Not computed until format and algorithm checks pass.'}</code></div></div>
            <p className="section-label mt-5 mb-2 text-neutral-400">Exact signing input / original encoded header.payload</p><code className="block text-[10px] leading-6 break-all text-neutral-400">{result?.signingInput ?? '—'}</code>
          </div>
        </details>
      </div>
      <p className="mt-5 flex items-start gap-3 text-[10px] leading-6 text-neutral-500"><ArrowRight size={13} className="mt-1 shrink-0" />This lesson uses public sample keys in your browser. In a real app, signing and private encryption keys stay on the server. Never paste a real token here.</p>
    </div>
  </section>;
}

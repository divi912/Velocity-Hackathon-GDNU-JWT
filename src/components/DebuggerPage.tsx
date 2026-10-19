import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, KeyRound, RotateCcw, ShieldCheck, Trash2, X } from 'lucide-react';
import { claimExplanation, generateJwt, inspectJwt } from '../lib/debugger';
import type { Inspection } from '../lib/debugger';
import { AUDIENCE, DEMO_SECRET, ISSUER, parseToken, signToken } from '../lib/jwt';
import type { Claims } from '../lib/jwt';

type Mode = 'decode' | 'encode';

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [message, setMessage] = useState('');
  useEffect(() => { setMessage(''); }, [value]);
  return <button type="button" aria-label={label} disabled={!value} onClick={() => {
    void navigator.clipboard.writeText(value).then(() => setMessage('Copied')).catch(() => setMessage('Select text to copy'));
  }} className="flex min-h-9 items-center gap-2 text-[10px] underline-offset-4 hover:underline"><Copy size={12} />{message || 'Copy'}</button>;
}

function ClaimTable({ claims }: { claims?: Claims }) {
  return <dl className="divide-y divide-neutral-200 px-5">{Object.entries(claims ?? {}).map(([key, value]) => <div key={key} className="py-4"><dt className="flex flex-wrap items-center gap-3 text-xs"><strong className="font-medium">{key}</strong><code className="min-w-0 text-[10px] break-all text-neutral-500">{JSON.stringify(value)}</code></dt><dd className="mt-2 text-[11px] leading-6 text-neutral-600">{claimExplanation(key)}{['exp', 'iat', 'nbf'].includes(key) && typeof value === 'number' && Number.isFinite(value) && Math.abs(value) < 8.64e12 && <span className="mt-1 block text-black">{new Date(value * 1000).toUTCString()}</span>}</dd></div>)}</dl>;
}

export function DebuggerPage({ motionEnabled }: { motionEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>('decode');
  const [token, setToken] = useState('');
  const [header, setHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payload, setPayload] = useState('{}');
  const [secret, setSecret] = useState(DEMO_SECRET);
  const [base64, setBase64] = useState(false);
  const [breakdown, setBreakdown] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [settled, setSettled] = useState<{ key: string; value: Inspection } | null>(null);
  const actionGeneration = useRef(0);
  const inspectionGeneration = useRef(0);
  const mounted = useRef(true);
  const inputKey = JSON.stringify([token, secret, base64, nonce]);
  // Results belong to exact inputs. A prior green result is hidden on the first render after an edit.
  const result = settled?.key === inputKey ? settled.value : null;
  const checking = Boolean(token) && !result;
  const decoded = useMemo(() => { try { return parseToken(token.trim()); } catch { return null; } }, [token]);

  async function example() {
    const generation = ++actionGeneration.current;
    setBusy(true); setActionError('');
    try {
      const now = Math.floor(Date.now() / 1000);
      const sample = { sub: 'user_42', name: 'Ada', role: 'student', iss: ISSUER, aud: AUDIENCE, iat: now, exp: now + 300 };
      const next = await signToken(sample);
      if (!mounted.current || generation !== actionGeneration.current) return;
      setToken(next); setSecret(DEMO_SECRET); setBase64(false);
      setHeader(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2)); setPayload(JSON.stringify(sample, null, 2));
    } catch (error) { if (mounted.current && generation === actionGeneration.current) setActionError(error instanceof Error ? error.message : 'Could not create an example.'); }
    finally { if (mounted.current && generation === actionGeneration.current) setBusy(false); }
  }

  useEffect(() => {
    mounted.current = true; void example();
    return () => { mounted.current = false; ++actionGeneration.current; ++inspectionGeneration.current; };
  }, []);

  useEffect(() => {
    if (mode === 'decode') {
      setHeader(decoded ? JSON.stringify(decoded.header, null, 2) : '');
      setPayload(decoded ? JSON.stringify(decoded.payload, null, 2) : '');
    }
  }, [decoded, mode]);

  useEffect(() => {
    const generation = ++inspectionGeneration.current;
    if (!token) return;
    void inspectJwt(token, secret, base64).then(value => {
      if (mounted.current && generation === inspectionGeneration.current) setSettled({ key: inputKey, value });
    }).catch(() => {
      if (mounted.current && generation === inspectionGeneration.current) setSettled({ key: inputKey, value: { error: 'The check could not run. Use localhost or HTTPS and check the key.', signature: 'not-checked', time: 'not-set' } });
    });
    return () => { ++inspectionGeneration.current; };
  }, [inputKey]);

  async function generate() {
    const generation = ++actionGeneration.current;
    setBusy(true); setActionError('');
    try {
      const next = await generateJwt(header, payload, secret, base64);
      if (mounted.current && generation === actionGeneration.current) setToken(next);
    } catch (error) { if (mounted.current && generation === actionGeneration.current) setActionError(error instanceof Error ? error.message : 'Check your inputs.'); }
    finally { if (mounted.current && generation === actionGeneration.current) setBusy(false); }
  }

  function clear() {
    ++actionGeneration.current; ++inspectionGeneration.current;
    setBusy(false); setToken(''); setSettled(null); setActionError('');
    if (mode === 'encode') { setHeader('{\n  "alg": "HS256",\n  "typ": "JWT"\n}'); setPayload('{}'); }
  }

  const signatureLabel = !token ? 'Waiting for a token' : checking ? 'Checking this token…' : result?.signature === 'verified' ? 'Signature verified' : result?.signature === 'invalid' ? 'Signature does not match' : result?.signature === 'unsupported' ? 'Algorithm not supported here' : 'Signature not checked';
  const timeLabel = result?.time === 'valid' ? 'Within its time limit' : result?.time === 'expired' ? 'Token has expired' : result?.time === 'not-active' ? 'Not active yet' : result?.time === 'invalid' ? 'Invalid time claim' : 'No expiry claim';

  return <div className="mx-auto max-w-[1536px] px-5 pt-8 pb-12 md:px-10 xl:px-16">
    <div className="flex items-center justify-between border-b border-black pb-4"><a href="/" className="flex min-h-9 items-center gap-2 text-[10px] underline-offset-4 hover:underline"><ArrowLeft size={13} />Back to the field guide</a><span className="section-label text-neutral-500">Tools / No. 001</span></div>
    <div className="flex flex-col justify-between gap-6 py-10 lg:flex-row lg:items-end">
      <div><p className="section-label mb-4 flex items-center gap-2"><span className="size-2 bg-black" />The workbench</p><h1 className="font-display text-[clamp(54px,7.2vw,110px)] leading-none tracking-[-.055em]">JWT <span className="italic">debugger.</span></h1></div>
      <p className="max-w-[400px] text-xs leading-7 text-neutral-600">Read a token. Check its signature.<br />Or write your own claims and sign a new one.<br /><span className="text-black">Everything runs here, in your browser.</span></p>
    </div>
    <div className="flex flex-col justify-between gap-4 border-y-2 border-black py-3 sm:flex-row sm:items-center">
      <div role="group" aria-label="Debugger mode" className="flex"><button type="button" aria-pressed={mode === 'decode'} onClick={() => { setMode('decode'); setActionError(''); }} className={`flex min-h-11 items-center gap-3 border border-black px-5 text-xs ${mode === 'decode' ? 'bg-black text-white' : 'hover:bg-neutral-100'}`}><span className="text-[9px]">01</span>Decoder</button><button type="button" aria-pressed={mode === 'encode'} onClick={() => { setMode('encode'); setBreakdown(false); setActionError(''); }} className={`-ml-px flex min-h-11 items-center gap-3 border border-black px-5 text-xs ${mode === 'encode' ? 'bg-black text-white' : 'hover:bg-neutral-100'}`}><span className="text-[9px]">02</span>Encoder</button></div>
      <div className="flex items-center gap-5"><span className="section-label border border-neutral-300 px-3 py-1.5">HS256</span><button type="button" disabled={busy} onClick={() => void example()} className="flex min-h-11 items-center gap-2 text-[11px] underline underline-offset-4"><RotateCcw size={12} />Load example</button></div>
    </div>
    <p className="py-5 text-[11px] leading-6 text-neutral-500">{mode === 'decode' ? 'Paste a signed JWT on the left. Its readable parts appear on the right. Add the signing key to check the signature.' : 'Edit the header and payload on the right. Enter a key below, then sign to generate the encoded token on the left.'}</p>
    <div className="grid border border-black lg:grid-cols-2">
      <section className="min-w-0 border-b border-black lg:border-r lg:border-b-0" aria-labelledby="encoded-title">
        <div className="flex items-center justify-between border-b border-black px-5 py-3"><h2 id="encoded-title" className="section-label">Encoded token</h2><div className="flex gap-4"><CopyButton value={token} label="Copy encoded token" /><button type="button" onClick={clear} aria-label="Clear token" className="flex min-h-9 items-center gap-2 text-[10px]"><Trash2 size={12} />Clear</button></div></div>
        <label htmlFor="debug-token" className="sr-only">Encoded JWT</label><textarea id="debug-token" readOnly={mode === 'encode'} spellCheck={false} autoCapitalize="off" autoComplete="off" value={token} onChange={event => { ++actionGeneration.current; setBusy(false); setToken(event.target.value); setActionError(''); }} placeholder={mode === 'decode' ? 'Paste a signed JWT here…' : 'Your generated token will appear here…'} className="block min-h-[360px] w-full resize-y bg-white px-5 py-6 font-mono text-[13px] leading-8 break-all outline-offset-[-3px] lg:min-h-[480px] lg:text-[15px]" />
        <div className="border-t border-neutral-300 px-5 py-4"><div className="flex gap-4 text-[9px] uppercase tracking-widest"><span className="border-b border-black pb-2">01 / Header</span><span className="border-b-2 border-black pb-2">02 / Payload</span><span className="border-b-4 border-black pb-1.5">03 / Signature</span></div><p className="mt-4 text-[10px] leading-6 text-neutral-500">Three parts. Two dots. A signed JWT is readable.<br />This tool checks signatures; it does not decide API permissions.</p></div>
      </section>
      <div className="min-w-0">
        <section aria-labelledby="header-title"><div className="flex items-center justify-between border-b border-black px-5 py-3"><h2 id="header-title" className="section-label">Decoded header <span className="ml-2 text-neutral-400">/ signing method</span></h2><CopyButton value={header} label="Copy decoded header" /></div><label htmlFor="debug-header" className="sr-only">Header JSON</label><textarea id="debug-header" readOnly={mode === 'decode'} disabled={busy} spellCheck={false} value={header} onChange={e => { setHeader(e.target.value); setActionError(''); }} placeholder="Decoded header" className="block min-h-[150px] w-full resize-y bg-soft p-5 font-mono text-xs leading-7 outline-offset-[-3px]" /></section>
        <section aria-labelledby="payload-title" className="border-t border-black"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-black px-5 py-3"><h2 id="payload-title" className="section-label">Decoded payload <span className="ml-2 text-neutral-400">/ claims</span></h2><div className="flex items-center gap-4">{mode === 'decode' && <button type="button" aria-pressed={breakdown} onClick={() => setBreakdown(value => !value)} className="min-h-9 text-[10px] underline underline-offset-4">{breakdown ? 'Show JSON' : 'Explain claims'}</button>}<CopyButton value={payload} label="Copy decoded payload" /></div></div>{breakdown && mode === 'decode' ? <ClaimTable claims={decoded?.payload} /> : <><label htmlFor="debug-payload" className="sr-only">Payload JSON</label><textarea id="debug-payload" readOnly={mode === 'decode'} disabled={busy} spellCheck={false} value={payload} onChange={e => { setPayload(e.target.value); setActionError(''); }} placeholder="Decoded payload" className="block min-h-[305px] w-full resize-y bg-soft p-5 font-mono text-xs leading-7 outline-offset-[-3px]" /></>}</section>
      </div>
    </div>
    <div className="grid border-x border-b border-black lg:grid-cols-2">
      <section className="min-w-0 border-b border-black p-5 lg:border-r lg:border-b-0 lg:p-7" aria-labelledby="verification-title">
        <h2 id="verification-title" className="section-label mb-5 flex items-center gap-2"><ShieldCheck size={14} />Signature check</h2>
        <motion.div key={inputKey} initial={motionEnabled ? { opacity: .5 } : false} animate={{ opacity: 1 }} transition={{ duration: .15 }} aria-live="polite" aria-atomic="true" className={`flex items-center gap-3 border border-black p-4 ${result?.signature === 'verified' ? 'bg-black text-white' : ''}`}>{result?.signature === 'verified' ? <Check size={20} /> : result?.signature === 'invalid' ? <X size={20} /> : <ShieldCheck size={20} strokeWidth={1.3} />}<span className="text-sm">{signatureLabel}</span></motion.div>
        {result?.error && <p role="alert" className="mt-4 border-l-2 border-black pl-3 text-xs leading-6">{result.error}</p>}
        {result?.signature === 'unsupported' && <p className="mt-3 text-xs leading-6">The JSON is readable, but this study tool only signs and verifies HS256. It does not claim to verify other algorithms.</p>}
        {result?.header && <p className="mt-4 text-[11px] leading-6"><span className="mr-2 border border-neutral-300 px-2 py-1 text-[9px]">TIME</span>{timeLabel}.<span className="mt-1 block text-neutral-500">Time checks are separate from the signature. Issuer, audience, and permissions are checked by your API.</span></p>}
        <details className="mt-5 text-[11px]"><summary className="min-h-9 cursor-pointer underline underline-offset-4">How this check works</summary><code className="mt-3 block border border-neutral-300 bg-soft p-4 text-[10px] leading-7 break-all">HMAC-SHA256(<br />&nbsp; key,<br />&nbsp; encodedHeader + "." + encodedPayload<br />)</code><p className="mt-3 text-[10px] leading-6 text-neutral-500">The result is compared with the received signature bytes using Web Crypto. Reading JSON alone does not verify anything.</p></details>
      </section>
      <section className="min-w-0 p-5 lg:p-7" aria-labelledby="secret-title">
        <div className="mb-4 flex items-center justify-between"><h2 id="secret-title" className="section-label flex items-center gap-2"><KeyRound size={14} />Secret key / HS256</h2><CopyButton value={secret} label="Copy secret key" /></div>
        <label htmlFor="debug-secret" className="mb-3 block text-[11px] leading-6 text-neutral-600">Use the same key that signed the token. Changing the key will change the result.</label><textarea id="debug-secret" disabled={busy} spellCheck={false} value={secret} onChange={e => setSecret(e.target.value)} rows={2} className="min-h-20 w-full resize-y border border-black bg-white p-3 font-mono text-xs leading-7 break-all" />
        <label className="mt-4 flex min-h-11 items-center gap-3 text-[11px]"><input type="checkbox" disabled={busy} checked={base64} onChange={e => setBase64(e.target.checked)} className="size-4 accent-black" />The secret is Base64url-encoded</label>
        <p className="mt-2 text-[10px] leading-6 text-neutral-500">The example key is public sample data. Real HS256 keys should be at least 32 random bytes and stay on the server.</p>
        {actionError && <p role="alert" className="mt-4 border-l-2 border-black pl-3 text-xs leading-6">{actionError}</p>}
        <button type="button" disabled={busy || (mode === 'decode' && !token)} onClick={() => mode === 'encode' ? void generate() : setNonce(value => value + 1)} className="button-base mt-5 bg-black text-white hover:bg-white hover:text-black">{busy ? 'Signing…' : mode === 'encode' ? 'Sign & generate token' : 'Check signature again'}<ArrowRight size={14} /></button>
      </section>
    </div>
    <div className="mt-6 flex flex-col justify-between gap-3 text-[10px] leading-6 text-neutral-500 md:flex-row"><p>Tokens and keys are processed in this browser. They are not sent to a server.</p><a href="/#signing" className="flex items-center gap-2 text-black underline underline-offset-4">See how signing works <ArrowUpRight size={12} /></a></div>
    <div className="mt-12 flex items-center justify-between border-t border-black pt-6"><span className="section-label">JWT / decoded</span><a href="/" className="flex min-h-11 items-center gap-2 text-[11px]">Back to the story <ArrowLeft size={13} /></a></div>
  </div>;
}

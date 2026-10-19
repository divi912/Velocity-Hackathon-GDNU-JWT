import { useState } from 'react';
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Check, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { chapters } from '../content/chapters';
import { encodeText } from '../lib/jwt';
import { ChapterDiagram } from './Diagrams';
import { EncryptionLab } from './EncryptionLab';
import { TrickyGraphic } from './TrickyGraphic';

export function Hero({ motionEnabled }: { motionEnabled: boolean }) {
  return <section className="border-b-4 border-black" aria-labelledby="hero-title">
    <div className="mx-auto max-w-[1536px] px-5 pt-9 pb-8 md:px-10 lg:pt-12 xl:px-16">
      <div className="mb-8 flex items-center justify-between border-b border-black pb-4 md:mb-11">
        <span className="section-label">The internet, explained.</span><span className="section-label text-neutral-500">Field guide / No. 001</span>
      </div>
      <div className="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-3">
        <div className="relative pb-3 lg:pb-10">
          <motion.p initial={motionEnabled ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="section-label mb-6 flex items-center gap-3"><span className="inline-block size-2 bg-black" />JSON WEB TOKENS, FROM THE INSIDE OUT</motion.p>
          <h1 id="hero-title" className="font-display text-[clamp(86px,11.2vw,172px)] leading-[.91] font-normal tracking-[-.065em]">JWT,<br /><span className="italic">decoded.</span></h1>
          <p className="mt-8 max-w-[370px] text-[13px] leading-7 text-neutral-600 md:text-sm">A small string. A whole chain of trust.<br />Follow a token from your browser to the server—and see what happens inside.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5 lg:mt-10">
            <a href="#the-journey" className="button-base bg-black text-white hover:bg-white hover:text-black">Follow the token <ArrowDown size={15} strokeWidth={1.5} /></a>
            <a href="/debugger" className="flex min-h-11 items-center gap-2 text-[11px] underline underline-offset-4">Open the debugger <ArrowUpRight size={14} /></a>
          </div>
        </div>
        <motion.figure initial={motionEnabled ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 1, delay: .2 }} className="min-w-0 border border-black">
          <div className="flex items-center justify-between border-b border-black px-4 py-3"><span className="section-label">Fig. 01 — The trust exchange</span><span className="flex items-center gap-2 text-[9px]"><span className="size-1.5 bg-black" />{motionEnabled ? 'LIVE DIAGRAM' : 'MOTION OFF'}</span></div>
          <ChapterDiagram kind="journey" motionEnabled={motionEnabled} hero />
          <figcaption className="flex justify-between gap-4 border-t border-neutral-300 px-4 py-3 text-[9px] text-neutral-500"><span>CLIENT → SERVER → CLIENT</span><span>NO MAGIC. JUST CHECKS.</span></figcaption>
        </motion.figure>
      </div>
      <div className="mt-9 flex items-center justify-between border-t border-black pt-5 lg:mt-10">
        <span className="section-label flex items-center gap-3"><ArrowDownRight size={17} strokeWidth={1} />Scroll to uncover the process</span>
        <span className="section-label hidden text-neutral-500 sm:inline">7 chapters · a working JWT debugger</span>
      </div>
    </div>
  </section>;
}

export function Primer() {
  return <section className="relative overflow-hidden border-b-4 border-black bg-black text-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.035]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,white,white 1px,transparent 1px,transparent 4px)' }} />
    <div className="relative mx-auto grid max-w-[1536px] gap-10 px-5 py-12 md:grid-cols-3 md:gap-0 md:px-10 xl:px-16">
      {[
        ['01', 'Read it.', 'The payload is readable. Encoding is not a lock.'],
        ['02', 'Sign it.', 'A signature helps show if the token changed.'],
        ['03', 'Check it.', 'The server still decides what you can do.'],
      ].map(([n, title, body], i) => <div key={n} className={`${i ? 'md:border-l md:border-neutral-700 md:pl-10' : ''} md:pr-10`}><span className="section-label text-neutral-400">{n} / THE IDEA</span><h2 className="mt-3 font-display text-4xl tracking-tight">{title}</h2><p className="mt-3 max-w-70 text-xs leading-6 text-neutral-400">{body}</p></div>)}
    </div>
  </section>;
}

function Encoder() {
  const [text, setText] = useState('{"sub":"42"}');
  return <div className="mt-6 border-t border-neutral-300 pt-4">
    <label htmlFor="encoding-text" className="section-label mb-2 block">Try changing the text</label>
    <input id="encoding-text" value={text} maxLength={80} onChange={e => setText(e.target.value)} className="min-h-11 w-full border border-black bg-white px-3 text-xs" />
    <div className="mt-2 flex items-start gap-3"><ArrowDownRight size={15} className="mt-1 shrink-0" /><output htmlFor="encoding-text" className="min-w-0 text-[10px] leading-6 break-all">{text ? encodeText(text) : '(empty text → empty bytes)'}</output></div>
  </div>;
}

export function Story({ motionEnabled }: { motionEnabled: boolean }) {
  return <div>
    <div className="mx-auto flex max-w-[1536px] items-center justify-between px-5 py-7 md:px-10 xl:px-16"><p className="section-label">The scroll story</p><p className="section-label text-neutral-500">Move down to play. Move up to rewind.</p></div>
    {chapters.map(chapter => <article id={chapter.id} key={chapter.id} data-scene className="relative border-t-4 border-black lg:min-h-[165svh]">
      <div className="mx-auto grid max-w-[1536px] items-center gap-10 px-5 py-12 md:px-10 lg:sticky lg:top-[100px] lg:grid-cols-[.85fr_1.15fr] lg:gap-14 lg:py-10 xl:gap-20 xl:px-16">
        <div className="min-w-0">
          <div className="mb-5 flex items-center gap-3"><span className="flex size-8 items-center justify-center border border-black text-[10px]">{chapter.number}</span><span className="section-label">{chapter.label}</span><span className="ml-2 h-px flex-1 bg-neutral-300" /></div>
          <h2 className="font-display text-[clamp(44px,4.4vw,72px)] leading-[1.06] tracking-[-.045em] whitespace-pre-line">{chapter.title}</h2>
          <p className="mt-6 text-[15px] leading-7">{chapter.lead}</p>
          <p className="mt-4 max-w-[470px] text-[12px] leading-[1.95] text-neutral-600 md:text-[13px]">{chapter.body}</p>
          <div className="mt-6 flex items-start gap-3 border-l-2 border-black py-1 pl-4"><Check size={14} className="mt-1 shrink-0" strokeWidth={1.5} /><p className="text-[11px] leading-6">{chapter.takeaway}</p></div>
          {chapter.kind === 'encoding' && <Encoder />}
          {chapter.kind === 'encryption' && <EncryptionLab />}
          {chapter.kind === 'signing' && <p className="mt-5 text-[10px] leading-6 text-neutral-500">HS256: one shared secret signs and checks.<br />RS256: a private key signs; a public key checks.</p>}
          {chapter.kind === 'expiry' && <a href="/debugger" className="button-base mt-6 bg-black text-white hover:bg-white hover:text-black">Open the JWT debugger <ArrowRight size={14} /></a>}
        </div>
        <figure className="min-w-0 self-center border border-black">
          <div className="flex justify-between gap-2 border-b border-black px-4 py-3"><span className="section-label">Fig. {chapter.number} / {chapter.label}</span><span className="section-label text-neutral-500">{motionEnabled ? 'Scroll to play ↓' : 'Complete view'}</span></div>
          <ChapterDiagram kind={chapter.kind} motionEnabled={motionEnabled} />
          <figcaption className="flex items-center justify-between gap-3 border-t border-neutral-300 px-4 py-3 text-[9px] text-neutral-500"><span>{chapter.kind === 'encryption' ? 'AES-256-GCM / ENCRYPTED JWE' : 'SIGNED JWT / HS256'}</span><span>{chapter.number} / 07</span></figcaption>
        </figure>
      </div>
    </article>)}
  </div>;
}

export function FieldNotes({ motionEnabled = true }: { motionEnabled?: boolean }) {
  const quickPros = [
    {
      num: '01',
      title: 'Zero Database Hits',
      point: 'The server verifies the signature locally in CPU memory. No database queries needed on any request.',
      badge: 'FAST',
    },
    {
      num: '02',
      title: 'Built for Microservices',
      point: '1 authentication server signs the token; 20 different backend APIs verify it independently without asking the auth server.',
      badge: 'SCALABLE',
    },
    {
      num: '03',
      title: 'Self-Contained Data',
      point: 'The user ID, permissions, and expiration timestamp ride directly inside the token string.',
      badge: 'PORTABLE',
    },
    {
      num: '04',
      title: 'Mobile & Cross-Domain Ready',
      point: 'Sent in standard Authorization: Bearer HTTP headers, avoiding third-party cookie restrictions and CORS blockers.',
      badge: 'FLEXIBLE',
    },
  ];

  const quickCons = [
    {
      num: '01',
      title: 'Impossible to Revoke Instantly',
      point: 'Logging out or banning a user on the server does NOT stop a stolen token until its expiration timer runs out.',
      badge: 'SECURITY',
    },
    {
      num: '02',
      title: 'Not Encrypted (Broad Daylight)',
      point: 'Base64 is NOT encryption. Anyone who touches the token can read all claims. Never put passwords or secrets inside.',
      badge: 'LEAK RISK',
    },
    {
      num: '03',
      title: 'Heavy Network Payload',
      point: 'A JWT is 500B to 3KB, sent on EVERY request. Across 10 microservice hops, bandwidth multiplies rapidly.',
      badge: 'OVERHEAD',
    },
    {
      num: '04',
      title: 'Stale Roles & Permissions',
      point: 'If an admin demotes a user from Admin to Viewer, the user keeps admin powers until the token expires.',
      badge: 'DESYNC',
    },
  ];

  return <section id="field-notes" className="border-t-4 border-black">
    <div className="mx-auto max-w-[1536px] px-5 py-16 md:px-10 lg:py-24 xl:px-16">
      <div className="mb-12 flex items-center justify-between">
        <span className="section-label">The field notes / pros & cons</span>
        <span className="size-3 border-2 border-black" />
      </div>
      <h2 className="max-w-[1000px] font-display text-[clamp(47px,6.8vw,104px)] leading-[1.08] tracking-[-.05em]">
        Where JWT helps.<br /><span className="italic">Where it gets tricky.</span>
      </h2>
      <p className="mt-4 max-w-[680px] text-xs md:text-sm text-neutral-600 leading-relaxed font-mono">
        The core trade-off in simple terms: JWT trades instant control for zero database lookups. Here is the straightforward breakdown.
      </p>

      {/* Part 1: High-Level Pros vs Cons Cheat Sheet */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* THE PROS CARD */}
        <div className="border-2 border-black p-6 md:p-8 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-black">
              <div className="flex items-center gap-2.5">
                <span className="size-6 flex items-center justify-center bg-black text-white font-mono text-xs font-bold">
                  +
                </span>
                <span className="section-label font-bold text-black">THE PROS — WHY USE JWT?</span>
              </div>
              <span className="text-[10px] font-mono border border-black px-2 py-0.5 font-bold uppercase">
                ADVANTAGES
              </span>
            </div>

            <div className="space-y-6">
              {quickPros.map(p => (
                <div key={p.num} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-black border border-black px-1.5 py-0.5 shrink-0 mt-0.5">
                    {p.num}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-black">{p.title}</h4>
                      <span className="text-[8px] font-mono border border-neutral-300 px-1 text-neutral-500">{p.badge}</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{p.point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between text-[9px] font-mono text-neutral-500">
            <span>CORE BENEFIT: SPEED & DECOUPLING</span>
            <span>0 DB QUERIES</span>
          </div>
        </div>

        {/* THE CONS CARD */}
        <div className="border-2 border-black p-6 md:p-8 bg-neutral-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-black">
              <div className="flex items-center gap-2.5">
                <span className="size-6 flex items-center justify-center border border-black bg-white text-black font-mono text-xs font-bold">
                  −
                </span>
                <span className="section-label font-bold text-black">THE CONS — WHERE IT GETS TRICKY</span>
              </div>
              <span className="text-[10px] font-mono border border-black px-2 py-0.5 font-bold uppercase">
                LIMITATIONS
              </span>
            </div>

            <div className="space-y-6">
              {quickCons.map(c => (
                <div key={c.num} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-neutral-700 border border-neutral-400 bg-white px-1.5 py-0.5 shrink-0 mt-0.5">
                    {c.num}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-black">{c.title}</h4>
                      <span className="text-[8px] font-mono border border-neutral-400 bg-white px-1 text-neutral-600">{c.badge}</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{c.point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between text-[9px] font-mono text-neutral-500">
            <span>CORE WEAKNESS: LOSS OF INSTANT CONTROL</span>
            <span>TOKEN IS PERMANENT TILL EXP</span>
          </div>
        </div>
      </div>

      {/* Decision Guide: When to choose what? */}
      <div className="mt-8 border border-black p-4 bg-white flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider">RULE OF THUMB:</span>
          <span className="text-neutral-700">Traditional web app needing instant logout? → <span className="font-bold text-black">Choose Redis Sessions</span>.</span>
        </div>
        <div className="text-neutral-700">
          Decoupled microservices or mobile apps? → <span className="font-bold text-black">Choose JWT (with 15m expiry)</span>.
        </div>
      </div>

      {/* Part 2: The In-Depth Motion Type Graphic Dossier (Interactive Deep Dive) */}
      <div className="mt-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="section-label block mb-1">INTERACTIVE SIMULATORS</span>
            <h3 className="font-display text-2xl font-bold">Inspect Each Tricky Scenario in Action</h3>
          </div>
          <span className="text-[10px] font-mono border border-black px-2 py-1">6 SCENARIOS</span>
        </div>
        <TrickyGraphic motionEnabled={motionEnabled} />
      </div>

      {/* Part 3: Architecture Summary Verdict */}
      <div className="mt-14 border border-black p-6 md:p-8 bg-neutral-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="section-label block mb-2 font-bold">The Architectural Verdict</span>
          <p className="max-w-[850px] text-xs md:text-sm leading-relaxed text-neutral-700">
            JWT is a specialized token format, not a complete authentication system. A standard server-side session cookie remains the simpler, safer default for traditional web applications needing instant revocation and minimal network payloads. Choose signed JWTs for decoupled microservices, mobile edge gateways, and cross-domain APIs—and engineer for the tricky trade-offs from day one.
          </p>
        </div>
        <a
          href="/debugger"
          className="button-base shrink-0 bg-black text-white hover:bg-white hover:text-black transition-colors"
        >
          Open JWT Debugger <ArrowRight size={14} />
        </a>
      </div>
    </div>
    <footer className="paper-texture bg-black text-white">
      <div className="mx-auto max-w-[1536px] px-5 pt-14 pb-7 md:px-10 xl:px-16">
        <div className="flex items-start justify-between gap-6"><p className="font-display text-[clamp(62px,10vw,150px)] leading-none tracking-[-.055em]">Trust, but <span className="italic">verify.</span></p><a href="#" aria-label="Back to top" className="mt-3 flex size-12 shrink-0 items-center justify-center border border-white hover:bg-white hover:text-black"><ArrowUpRight size={23} strokeWidth={1} /></a></div>
        <div className="mt-12 flex flex-col justify-between gap-5 border-t border-neutral-700 pt-6 text-[9px] leading-6 text-neutral-400 md:flex-row"><p>JWT / decoded<br />Built for curious minds. All examples run in your browser.</p><div className="flex flex-wrap gap-5">{[['JWT', '7519'], ['Signing', '7515'], ['Encryption', '7516'], ['Safe use', '8725']].map(([label, rfc]) => <a key={rfc} href={`https://www.rfc-editor.org/rfc/rfc${rfc}`} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-white">{label} ↗</a>)}</div></div>
      </div>
    </footer>
  </section>;
}

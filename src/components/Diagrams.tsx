import { useId, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import type { DiagramKind } from '../content/chapters';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

function Browser({ x = 30, y = 140, small = false }: { x?: number; y?: number; small?: boolean }) {
  const w = small ? 150 : 190;
  return <g transform={`translate(${x} ${y})`}>
    <rect width={w} height="154" fill="white" stroke="black" strokeWidth="1.5" />
    <path d={`M0 27H${w}`} stroke="black" />
    {[12, 23, 34].map(cx => <circle key={cx} cx={cx} cy="13" r="2" fill="black" />)}
    <rect x="15" y="44" width={w - 30} height="30" fill="#f5f5f5" />
    <text x="24" y="63" fontSize="10">GET /profile</text>
    <path d={`M16 92H${w - 30}M16 104H${w - 52}M16 116H${w - 67}`} stroke="#b5b5b5" />
    <rect x="16" y="129" width="50" height="10" fill="black" />
    <path d={`M${w / 2} 154v20m-26 0h52`} stroke="black" strokeWidth="1.5" />
    <text x={w / 2} y="200" textAnchor="middle" fontSize="10" letterSpacing="2">YOUR BROWSER</text>
  </g>;
}

function Server({ x = 430, y = 100 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M0 18L24 0H154L132 18ZM132 18L154 0V218L132 238Z" fill="#f5f5f5" stroke="black" strokeWidth="1.5" />
    <rect y="18" width="132" height="220" fill="white" stroke="black" strokeWidth="1.5" />
    {[0, 1, 2].map(i => <g key={i} transform={`translate(12 ${36 + i * 56})`}>
      <rect width="108" height="43" fill="#f5f5f5" stroke="black" />
      <circle className="server-led" cx="14" cy="14" r="3" fill="black" />
      <path d="M25 13h64M10 28h78" stroke="#a3a3a3" />
      <rect x="94" y="10" width="4" height="23" fill="black" />
    </g>)}
    <text x="65" y="266" textAnchor="middle" fontSize="10" letterSpacing="2">THE SERVER</text>
  </g>;
}

function Packet({ className, label = 'JWT' }: { className: string; label?: string }) {
  return <g className={`${className} opacity-0`} transform="translate(320 220)">
    <rect x="-29" y="-15" width="58" height="30" fill="black" />
    <text x="0" y="4" fill="white" textAnchor="middle" fontSize="10" letterSpacing="1">{label}</text>
  </g>;
}

function Journey({ prefix }: { prefix: string }) {
  return <>
    <Browser x={30} y={135} /><Server x={450} y={85} />
    <path d="M220 190C300 190 345 150 450 150" fill="none" stroke="#d4d4d4" strokeDasharray="4 5" />
    <path id={`${prefix}-out`} className="draw path-out" d="M220 190C300 190 345 150 450 150" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <path d="M450 290C350 290 320 360 220 260" fill="none" stroke="#d4d4d4" strokeDasharray="4 5" />
    <path className="draw path-back" d="M450 290C350 290 320 360 220 260" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <text x="307" y="139" fontSize="9" textAnchor="middle" letterSpacing="1">01 / LOGIN REQUEST</text>
    <text x="316" y="367" fontSize="9" textAnchor="middle" letterSpacing="1">02 / A SIGNED TOKEN RETURNS</text>
    <Packet className="packet-a" label="LOGIN" /><Packet className="packet-b" />
    <g transform="translate(258 227)"><g className="reveal"><rect width="128" height="39" fill="white" stroke="black" /><text x="64" y="24" fontSize="10" textAnchor="middle">CHECK → ISSUE</text></g></g>
    <g transform="translate(35 435)"><g className="reveal"><rect width="8" height="8" fill="black" /><text x="20" y="8" fontSize="10">The key never travels with the token.</text></g></g>
  </>;
}

function Anatomy() {
  const parts = [
    { x: 34, title: 'HEADER', n: '01', lines: ['{', '  "alg": "HS256",', '  "typ": "JWT"', '}'], footer: 'How it is signed' },
    { x: 240, title: 'PAYLOAD', n: '02', lines: ['{', '  "sub": "user_42",', '  "role": "student"', '}'], footer: 'What it claims' },
    { x: 446, title: 'SIGNATURE', n: '03', lines: ['HMAC-SHA256', '', 'message + key', '→ 32 bytes'], footer: 'Whether it changed' },
  ];
  return <>
    <text x="32" y="57" fontSize="10" letterSpacing="2">ONE STRING / TWO DOTS / THREE PARTS</text>
    {parts.map((part, i) => <g key={part.n} transform={`translate(${part.x} 111)`}><g className="token-part">
      <rect width="165" height="224" fill={i === 2 ? 'black' : 'white'} stroke="black" strokeWidth="1.5" />
      <text x="15" y="26" fill={i === 2 ? 'white' : 'black'} fontSize="9" letterSpacing="1">{part.n} / {part.title}</text>
      <path d="M15 42h135" stroke={i === 2 ? '#525252' : '#d4d4d4'} />
      {part.lines.map((line, j) => <text key={j} x="14" y={76 + j * 23} fontSize="10" fill={i === 2 ? 'white' : 'black'}>{line}</text>)}
      <text x="15" y="201" fontSize="8" fill={i === 2 ? '#a3a3a3' : '#525252'}>{part.footer}</text>
    </g></g>)}
    <circle cx="218" cy="220" r="3" fill="black" /><circle cx="424" cy="220" r="3" fill="black" />
    <g className="reveal"><path d="M115 359v24h413v-24M322 383v27" fill="none" stroke="black" /><text x="322" y="438" textAnchor="middle" fontSize="11">header.payload.signature</text></g>
  </>;
}

function Encoding({ prefix }: { prefix: string }) {
  return <>
    <text x="32" y="57" fontSize="10" letterSpacing="2">THE SAME DATA. A DIFFERENT WAY TO WRITE IT.</text>
    <g transform="translate(35 111)"><g className="token-part"><rect width="211" height="121" fill="white" stroke="black" /><text x="17" y="26" fontSize="9" letterSpacing="1">01 / JSON TEXT</text><text x="17" y="65" fontSize="14">{'{"sub":"42"}'}</text><text x="17" y="96" fontSize="9" fill="#525252">Readable by anyone</text></g></g>
    <path className="draw path-out" d="M246 170H375" stroke="black" fill="none" markerEnd={`url(#${prefix}-arrow)`} />
    <text x="309" y="150" textAnchor="middle" fontSize="9">UTF-8</text>
    <g transform="translate(392 111)"><g className="reveal"><rect width="211" height="121" fill="black" /><text x="17" y="26" fontSize="9" letterSpacing="1" fill="white">02 / BYTES</text>{['123', '34', '115', '117'].map((v, i) => <text className="byte" key={v} x={17 + i * 47} y="68" fill="white" fontSize="13">{v}</text>)}<text x="17" y="96" fontSize="9" fill="#a3a3a3">Numbers underneath the text</text></g></g>
    <path className="draw path-back" d="M496 232V294H322V326" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <text x="407" y="278" fontSize="9">BASE64URL</text>
    <g transform="translate(116 344)"><g className="signature-result"><rect width="412" height="81" fill="white" stroke="black" /><text x="206" y="28" textAnchor="middle" fontSize="9" letterSpacing="1">03 / ENCODED TEXT</text><text x="206" y="58" textAnchor="middle" fontSize="18">eyJzdWIiOiI0MiJ9</text></g></g>
    <Packet className="packet-a" label="TEXT" />
  </>;
}

function Signing({ prefix }: { prefix: string }) {
  return <>
    <text x="32" y="57" fontSize="10" letterSpacing="2">SIGNING HAPPENS INSIDE THE ISSUER</text>
    <rect x="250" y="91" width="255" height="315" fill="#f5f5f5" stroke="black" strokeDasharray="5 5" />
    <text x="267" y="116" fontSize="9" letterSpacing="1">SERVER BOUNDARY</text>
    <g transform="translate(25 170)"><g className="token-part"><rect width="176" height="62" fill="white" stroke="black" /><text x="88" y="26" fontSize="10" textAnchor="middle">encoded header</text><text x="88" y="44" fontSize="10" textAnchor="middle">. encoded payload</text></g></g>
    <path className="draw path-out" d="M201 201H290" stroke="black" fill="none" markerEnd={`url(#${prefix}-arrow)`} />
    <g transform="translate(290 158)"><g className="machine"><rect width="178" height="100" fill="black" /><text x="89" y="39" fill="white" fontSize="13" textAnchor="middle">HMAC-SHA256</text><text x="89" y="65" fill="#a3a3a3" fontSize="9" textAnchor="middle">message + secret key</text><path className="machine-scan" d="M12 85h154" stroke="white" strokeWidth="2" /></g></g>
    <g transform="translate(305 330)"><g className="secret-key"><circle cx="10" cy="0" r="8" fill="none" stroke="black" strokeWidth="2" /><path d="M18 0h27m-8 0v8m8-8v8" stroke="black" strokeWidth="2" /><text x="62" y="4" fontSize="10">SECRET KEY</text></g></g>
    <path className="draw key-path" d="M378 315V274" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <path className="draw path-back" d="M468 208H565V308" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <g transform="translate(515 327)"><g className="signature-result"><rect width="101" height="55" fill="black" /><text x="50" y="23" fill="white" textAnchor="middle" fontSize="10">32 BYTES</text><text x="50" y="41" fill="#a3a3a3" textAnchor="middle" fontSize="8">→ Base64url</text></g></g>
    <Packet className="packet-a" label="H.P" /><Packet className="packet-b" label="SIG" />
    <g className="reveal"><text x="32" y="461" fontSize="10">The output leaves. The secret stays.</text><path d="M410 454h205" stroke="black" /></g>
  </>;
}

function Encryption({ prefix }: { prefix: string }) {
  return <>
    <text x="32" y="57" fontSize="10" letterSpacing="2">SIGN FIRST. THEN PUT IT IN A PRIVATE ENVELOPE.</text>
    <g transform="translate(158 104)"><g className="token-part"><rect width="327" height="45" fill="white" stroke="black" /><text x="164" y="28" textAnchor="middle" fontSize="12">header.payload.signature</text></g></g>
    <path className="draw path-out" d="M321 149V198" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <g className="envelope"><rect x="158" y="217" width="327" height="153" fill="white" stroke="black" strokeWidth="1.5" /><path d="M158 217L321 316L485 217M158 370L272 288M485 370L372 288" fill="none" stroke="black" />
      <rect className="privacy-shutter" x="175" y="238" width="292" height="111" fill="black" />
      <text className="cipher-label" x="321" y="286" textAnchor="middle" fontSize="12" fill="white">ENCRYPTED / AES-256-GCM</text><text className="cipher-label" x="321" y="310" textAnchor="middle" fontSize="9" fill="#a3a3a3">Only the key can open this.</text>
    </g>
    <g className="secret-key" transform="translate(57 285)"><circle cx="0" cy="0" r="10" fill="none" stroke="black" strokeWidth="2" /><path d="M10 0h38m-9 0v8m9-8v8" stroke="black" strokeWidth="2" /><text x="18" y="33" textAnchor="middle" fontSize="9">KEY</text></g>
    <path className="draw path-back" d="M485 293H569V419H487" stroke="black" fill="none" markerEnd={`url(#${prefix}-arrow)`} />
    <g className="signature-result"><rect x="156" y="403" width="330" height="45" fill="white" stroke="black" /><text x="321" y="431" textAnchor="middle" fontSize="11">DECRYPT → CHECK THE SIGNED TOKEN</text></g>
    <Packet className="packet-a" /><Packet className="packet-b" label="OPEN" />
  </>;
}

function Verification({ prefix }: { prefix: string }) {
  return <>
    <Browser x={25} y={153} small />
    <rect x="294" y="71" width="305" height="354" fill="white" stroke="black" strokeWidth="1.5" />
    <rect x="294" y="71" width="305" height="38" fill="black" /><text x="311" y="95" fill="white" fontSize="10" letterSpacing="2">INSIDE THE API SERVER</text>
    {['Allowed algorithm', 'Signature + trusted key', 'Issuer / audience / time', 'Permission for this route'].map((label, i) => <g key={label} transform={`translate(311 ${130 + i * 67})`}>
      <g className="verify-row"><rect width="270" height="49" fill="#f5f5f5" stroke="#d4d4d4" /><text x="14" y="29" fontSize="10">{label}</text><path className="check-mark" d="M239 24l5 5 10-12" fill="none" stroke="black" strokeWidth="2" /></g>
    </g>)}
    <text x="232" y="131" fontSize="9" textAnchor="middle">BEARER JWT</text>
    <path className="draw path-out" d="M175 188H294" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <path className="draw path-back" d="M445 425V459H100V328" fill="none" stroke="black" markerEnd={`url(#${prefix}-arrow)`} />
    <Packet className="packet-a" /><Packet className="packet-b" label="200" />
    <g className="signature-result"><rect x="200" y="438" width="173" height="41" fill="black" /><text x="287" y="464" textAnchor="middle" fill="white" fontSize="10">ACCESS ALLOWED</text></g>
  </>;
}

function Expiry() {
  return <>
    <text x="32" y="57" fontSize="10" letterSpacing="2">THE SIGNATURE STAYS. THE TIME RUNS OUT.</text>
    <g transform="translate(62 106)"><rect width="520" height="61" fill="white" stroke="black" /><text x="22" y="36" fontSize="12">Signature</text><path d="M467 30l7 7 14-17" fill="none" stroke="black" strokeWidth="2" /><text x="350" y="36" fontSize="10">STILL VALID</text></g>
    <path d="M61 259H582" stroke="black" strokeWidth="1.5" />
    {[62, 140, 218, 296, 374, 452, 530, 582].map((x, i) => <g key={x}><path d={`M${x} 249v20`} stroke="black" /><text x={x} y="291" fontSize="8" textAnchor="middle">{i === 0 ? 'issued' : i === 5 ? 'exp' : `${i}m`}</text></g>)}
    <path d="M452 197V320" stroke="black" strokeDasharray="4 5" /><text x="452" y="184" textAnchor="middle" fontSize="10">EXPIRY</text>
    <g transform="translate(62 226)"><g className="clock-head"><rect x="-18" y="-18" width="36" height="36" fill="black" /><path d="M0-10v10l6 4" stroke="white" fill="none" strokeWidth="1.5" /></g></g>
    <g transform="translate(62 350)"><g className="time-valid"><rect width="520" height="62" fill="white" stroke="black" /><text x="260" y="37" fontSize="12" textAnchor="middle">BEFORE exp → REQUEST ALLOWED</text></g><g className="time-expired"><rect width="520" height="62" fill="black" /><text x="260" y="37" fontSize="12" textAnchor="middle" fill="white">AT / AFTER exp → TOKEN EXPIRED</text></g></g>
    <text x="322" y="458" textAnchor="middle" fontSize="10">A new token needs a new signature.</text>
  </>;
}

export function ChapterDiagram({ kind, motionEnabled, hero = false }: { kind: DiagramKind; motionEnabled: boolean; hero?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const prefix = `scene-${useId().replace(/:/g, '')}`;
  const steps: Record<DiagramKind, string[]> = {
    journey: ['The browser sends a login request.', 'The server checks the sample login.', 'The issuer creates and signs a token.', 'The token returns. The key stays behind.'],
    anatomy: ['Start with a single signed token.', 'The header names the signing method.', 'The payload carries the user claims.', 'The signature makes changes detectable.'],
    encoding: ['Start with readable JSON text.', 'UTF-8 turns the text into bytes.', 'Base64url writes those bytes as text.', 'The same data. No secret key needed.'],
    signing: ['Join the encoded header and payload.', 'Bring the server secret into HMAC.', 'HMAC-SHA256 computes 32 bytes.', 'Encode the signature. Send the token.'],
    encryption: ['Start with a signed JWT.', 'AES-GCM uses a separate secret key.', 'The envelope hides the signed token.', 'Decrypt the envelope. Then verify inside.'],
    verification: ['The browser sends a bearer token.', 'The API checks its method and signature.', 'Check who, which API, and the time.', 'Check the route permission. Send a reply.'],
    expiry: ['The token has just been issued.', 'The signature passes. Time remains.', 'The server clock approaches exp.', 'Past exp: reject it, even if it is signed.'],
  };

  useLayoutEffect(() => {
    if (!ref.current || !motionEnabled) return;
    const root = ref.current;
    const context = gsap.context(() => {
      const tl = gsap.timeline(hero ? { repeat: -1, repeatDelay: 1.5 } : {
        scrollTrigger: {
          trigger: root.closest('[data-scene]'), start: 'top 55%', end: 'bottom 65%', scrub: .65,
          invalidateOnRefresh: true,
        },
      });
      tl.to({}, { duration: 10 }, 0);
      tl.eventCallback('onUpdate', () => {
        const next = Math.min(3, Math.floor(tl.progress() * 4));
        setStep(previous => previous === next ? previous : next);
      });
      tl.fromTo(progress.current, { scaleX: 0 }, { scaleX: 1, duration: 10, ease: 'none' }, 0);
      root.querySelectorAll<SVGPathElement>('.draw').forEach((path, i) => {
        const length = path.getTotalLength();
        tl.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 3, ease: 'none' }, i * 2 + .2);
      });
      const travel = (packet: string, pathClass: string, at: number, duration: number) => {
        const path = root.querySelector(pathClass);
        if (!path || !root.querySelector(packet)) return;
        tl.set(packet, { autoAlpha: 0 }, 0);
        tl.to(packet, { autoAlpha: 1, duration: .12 }, at);
        tl.to(packet, { motionPath: { path: path as SVGPathElement, align: path as SVGPathElement, alignOrigin: [.5, .5] }, duration, ease: 'none' }, at);
        tl.to(packet, { autoAlpha: 0, duration: .12 }, at + duration);
      };
      travel('.packet-a', '.path-out', .5, 2.7);
      travel('.packet-b', '.path-back', 6.3, 2.9);
      if (root.querySelector('.reveal')) tl.fromTo('.reveal', { opacity: .15, y: 12 }, { opacity: 1, y: 0, stagger: .45, duration: 2 }, 2);
      if (root.querySelector('.token-part')) tl.fromTo('.token-part', { y: 42, opacity: .25 }, { y: 0, opacity: 1, stagger: .7, duration: 2.8, ease: 'power2.out' }, .2);
      if (root.querySelector('.signature-result')) tl.fromTo('.signature-result', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2 }, 6.5);
      if (kind === 'journey') tl.fromTo('.server-led', { opacity: .1 }, { opacity: 1, stagger: .6, duration: .5 }, 3.4);
      if (kind === 'encoding') tl.fromTo('.byte', { y: -20, opacity: 0 }, { y: 0, opacity: 1, stagger: .35, duration: 1.4 }, 3);
      if (kind === 'signing') {
        tl.fromTo('.secret-key', { y: 28, opacity: .2 }, { y: 0, opacity: 1, duration: 2 }, 2.5);
        tl.fromTo('.machine-scan', { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 3 }, 3.2);
      }
      if (kind === 'encryption') {
        tl.fromTo('.privacy-shutter', { scaleX: 0, transformOrigin: 'center' }, { scaleX: 1, duration: 2 }, 2.5);
        tl.fromTo('.cipher-label', { opacity: 0 }, { opacity: 1, duration: 1, stagger: .2 }, 4.6);
      }
      if (kind === 'verification') {
        tl.fromTo('.verify-row', { opacity: .18, x: 12 }, { opacity: 1, x: 0, stagger: 1.1, duration: .8 }, 2.2);
        tl.fromTo('.check-mark', { opacity: 0 }, { opacity: 1, stagger: 1.1, duration: .4 }, 3);
      }
      if (kind === 'expiry') {
        tl.fromTo('.clock-head', { x: 0 }, { x: 488, duration: 8, ease: 'none' }, .6);
        tl.set('.time-expired', { opacity: 0 }, 0);
        tl.to('.time-valid', { opacity: 0, duration: .2 }, 7);
        tl.to('.time-expired', { opacity: 1, duration: .2 }, 7);
      }
    }, root);
    return () => context.revert();
  }, [kind, motionEnabled, hero]);

  return <div ref={ref} className="relative w-full" data-diagram={kind}>
    <svg viewBox="0 0 645 500" className="h-auto w-full overflow-visible" role="img" aria-label={`${kind} diagram. ${motionEnabled ? 'Scroll to follow the process.' : 'Motion is off; the complete process is shown.'}`}>
      <defs>
        <pattern id={`${prefix}-grid`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="black" strokeOpacity=".045" /></pattern>
        <marker id={`${prefix}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1l6 3-6 3" fill="none" stroke="black" /></marker>
      </defs>
      <rect width="645" height="500" fill={`url(#${prefix}-grid)`} />
      {kind === 'journey' && <Journey prefix={prefix} />}
      {kind === 'anatomy' && <Anatomy />}
      {kind === 'encoding' && <Encoding prefix={prefix} />}
      {kind === 'signing' && <Signing prefix={prefix} />}
      {kind === 'encryption' && <Encryption prefix={prefix} />}
      {kind === 'verification' && <Verification prefix={prefix} />}
      {kind === 'expiry' && <Expiry />}
    </svg>
    <div className="relative border-t border-neutral-200 px-4 py-3">
      <div ref={progress} className="absolute top-0 left-0 h-[2px] w-full origin-left bg-black" />
      <div className="flex items-center gap-3 text-[9px] leading-5"><span className="shrink-0 border border-black px-1.5 text-[8px]">{motionEnabled ? `0${step + 1}` : '↳'}</span><span>{steps[kind][motionEnabled ? step : 3]}</span></div>
    </div>
  </div>;
}

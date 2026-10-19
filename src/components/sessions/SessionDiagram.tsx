import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import type { SessionDiagramKind } from '../../content/sessionChapters';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Dark theme client browser illustration
function DarkBrowser({ x = 30, y = 140, small = false, label = 'YOUR BROWSER' }: { x?: number; y?: number; small?: boolean; label?: string }) {
  const w = small ? 150 : 190;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="154" fill="#0d0d0d" stroke="white" strokeWidth="1.5" />
      <path d={`M0 27H${w}`} stroke="white" />
      {[12, 23, 34].map(cx => <circle key={cx} cx={cx} cy="13" r="2" fill="white" />)}
      <rect x="15" y="44" width={w - 30} height="30" fill="#1f1f1f" />
      <text x="24" y="63" fill="white" fontSize="10">Cookie: sid=8f4a...</text>
      <path d={`M16 92H${w - 30}M16 104H${w - 52}M16 116H${w - 67}`} stroke="#525252" />
      <rect x="16" y="129" width="50" height="10" fill="white" />
      <path d={`M${w / 2} 154v20m-26 0h52`} stroke="white" strokeWidth="1.5" />
      <text x={w / 2} y="200" fill="white" textAnchor="middle" fontSize="10" letterSpacing="2">{label}</text>
    </g>
  );
}

// Dark theme Redis Server illustration
function RedisNode({ x = 445, y = 80, title = 'REDIS MEMORY' }: { x?: number; y?: number; title?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 18L22 0H154L132 18ZM132 18L154 0V238L132 258Z" fill="#171717" stroke="white" strokeWidth="1.5" />
      <rect y="18" width="132" height="240" fill="#0d0d0d" stroke="white" strokeWidth="1.5" />
      <rect x="10" y="32" width="112" height="24" fill="#1f1f1f" stroke="#404040" />
      <text x="66" y="48" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">{title}</text>
      {[0, 1, 2].map(i => (
        <g key={i} transform={`translate(10 ${68 + i * 58})`}>
          <rect width="112" height="46" fill="#141414" stroke="white" />
          <circle className="redis-led" cx="14" cy="14" r="3" fill="white" />
          <path d="M25 13h68M10 30h88" stroke="#404040" />
          <rect x="94" y="8" width="4" height="30" fill="white" />
        </g>
      ))}
      <text x="66" y="286" fill="white" textAnchor="middle" fontSize="10" letterSpacing="2">KEY-VALUE CACHE</text>
    </g>
  );
}

// Dark theme packet
function DarkPacket({ className, label = 'SID' }: { className: string; label?: string }) {
  return (
    <g className={`${className} opacity-0`} transform="translate(320 220)">
      <rect x="-35" y="-15" width="70" height="30" fill="white" />
      <text x="0" y="4" fill="black" textAnchor="middle" fontSize="10" letterSpacing="1" fontWeight="bold">{label}</text>
    </g>
  );
}

// Chapter 01 Diagram: Why Sessions Exist (JWT claims move back to server; only session ID remains)
function DiagramWhySessions({ prefix }: { prefix: string }) {
  return (
    <>
      <text x="32" y="52" fill="white" fontSize="10" letterSpacing="2">JWT: CLAIMS TRAVEL ⇄ SESSIONS: CLAIMS STAY BEHIND</text>
      {/* Server boundary dividing line */}
      <line x1="330" y1="80" x2="330" y2="440" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x="180" y="95" fill="#a3a3a3" textAnchor="middle" fontSize="9" letterSpacing="1">BROWSER DOMAIN</text>
      <text x="490" y="95" fill="#a3a3a3" textAnchor="middle" fontSize="9" letterSpacing="1">SERVER MEMORY (REDIS)</text>

      {/* Left side: The tiny session ticket */}
      <g transform="translate(45 130)">
        <rect width="240" height="130" fill="#121212" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="240" height="24" fill="white" />
        <text x="120" y="16" fill="black" textAnchor="middle" fontSize="9" letterSpacing="1" fontWeight="bold">
          WHAT THE BROWSER HOLDS
        </text>
        <text x="120" y="60" fill="white" textAnchor="middle" fontSize="12" fontWeight="bold">
          Cookie: sid=8f4a91b...
        </text>
        <text x="120" y="85" fill="#a3a3a3" textAnchor="middle" fontSize="9">
          Opaque 128-bit Random Key
        </text>
        <text x="120" y="105" fill="#737373" textAnchor="middle" fontSize="8">
          Zero user data inside. Cannot be decoded.
        </text>
      </g>

      {/* Animated claims packet shifting across the boundary */}
      <g className="claims-sheltered" transform="translate(380 130)">
        <rect width="230" height="240" fill="#121212" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="230" height="24" fill="#262626" stroke="white" />
        <text x="115" y="16" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">
          STORED SECURELY IN REDIS
        </text>
        <g transform="translate(20 45)">
          <text x="0" y="20" fill="white" fontSize="11">{`{`}</text>
          <text x="15" y="45" fill="white" fontSize="10">{`"userId": "usr_42",`}</text>
          <text x="15" y="70" fill="white" fontSize="10">{`"role": "student",`}</text>
          <text x="15" y="95" fill="white" fontSize="10">{`"email": "student@mit.edu",`}</text>
          <text x="15" y="120" fill="white" fontSize="10">{`"createdAt": 1792393764,`}</text>
          <text x="15" y="145" fill="white" fontSize="10">{`"ttl": 1800`}</text>
          <text x="0" y="170" fill="white" fontSize="11">{`}`}</text>
        </g>
      </g>

      <g transform="translate(45 300)" className="reveal">
        <rect width="240" height="70" fill="#1a1a1a" stroke="white" />
        <text x="120" y="28" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">
          CLOAKROOM TICKET METAPHOR
        </text>
        <text x="120" y="48" fill="#d4d4d4" textAnchor="middle" fontSize="8">
          You hold the ticket. The coat stays in the vault.
        </text>
      </g>
    </>
  );
}

// Chapter 02 Diagram: Login creates a session (Credentials enter, hash checked, destroyed, session created)
function DiagramLoginJourney({ prefix }: { prefix: string }) {
  return (
    <>
      <DarkBrowser x={20} y={120} small label="CLIENT" />
      {/* Login Auth Server */}
      <g transform="translate(235 110)">
        <rect width="165" height="170" fill="#121212" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="165" height="24" fill="white" />
        <text x="82.5" y="16" fill="black" textAnchor="middle" fontSize="9" letterSpacing="1" fontWeight="bold">
          LOGIN SERVER
        </text>
        <text x="15" y="55" fill="white" fontSize="9">1. Receive TLS Payload</text>
        <text x="15" y="80" fill="white" fontSize="9">2. Verify Argon2 Hash</text>
        <text x="15" y="105" fill="#a3a3a3" fontSize="8">Password Discarded</text>
        <line x1="12" y1="120" x2="153" y2="120" stroke="#404040" />
        <text x="82.5" y="145" fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">
          3. Generate sid
        </text>
      </g>

      <RedisNode x={445} y={80} />

      {/* Path 1: Login Request */}
      <path id={`${prefix}-login-out`} className="draw path-out" d="M170 180H235" stroke="white" strokeWidth="1.5" markerEnd={`url(#${prefix}-arrow)`} />
      <text x="202" y="170" fill="#a3a3a3" textAnchor="middle" fontSize="8">POST /login</text>

      {/* Path 2: Auth Server to Redis */}
      <path className="draw path-redis" d="M400 180H445" stroke="white" strokeWidth="1.5" markerEnd={`url(#${prefix}-arrow)`} />
      <text x="422" y="170" fill="#a3a3a3" textAnchor="middle" fontSize="8">SET</text>

      {/* Path 3: Cookie returns to browser */}
      <path className="draw path-back" d="M317 280V350H95V274" stroke="white" strokeWidth="1.5" fill="none" markerEnd={`url(#${prefix}-arrow)`} />
      <text x="206" y="340" fill="white" textAnchor="middle" fontSize="9">Set-Cookie: sid=8f4a... (HttpOnly)</text>

      <DarkPacket className="packet-a" label="CREDS" />
      <DarkPacket className="packet-b" label="SID" />
    </>
  );
}

// Chapter 03 Diagram: Redis stores the state (Memory shelf with key and expanding record, TTL countdown)
function DiagramRedisStorage() {
  return (
    <>
      <text x="32" y="52" fill="white" fontSize="10" letterSpacing="2">INSIDE REDIS: KEY ⇄ VALUE MEMORY SHELF</text>

      {/* Memory Shelf Container */}
      <g transform="translate(60 90)">
        <rect width="525" height="340" fill="#0d0d0d" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="525" height="30" fill="#1f1f1f" stroke="white" />
        <text x="20" y="20" fill="white" fontSize="10" letterSpacing="1">
          REDIS RAM: KEYSPACE 0 [DATABASE 0]
        </text>
        <text x="490" y="20" fill="#a3a3a3" textAnchor="end" fontSize="9">
          SUB-MILLISECOND ACCESS
        </text>

        {/* Shelf Slot 1: Active Session */}
        <g transform="translate(25 50)">
          <rect width="475" height="140" fill="#171717" stroke="white" strokeWidth="1.5" />
          <rect x="0" y="0" width="475" height="26" fill="white" />
          <text x="15" y="18" fill="black" fontSize="10" fontWeight="bold">
            KEY: "session:8f4a91b3e091a4"
          </text>
          <text x="460" y="18" fill="black" textAnchor="end" fontSize="9" fontWeight="bold">
            TYPE: STRING (JSON)
          </text>

          <g transform="translate(20 45)">
            <text x="0" y="16" fill="white" fontSize="10">userId: "user_42"</text>
            <text x="0" y="36" fill="white" fontSize="10">role: "student"</text>
            <text x="0" y="56" fill="white" fontSize="10">createdAt: 1792393764</text>
            <text x="0" y="76" fill="#a3a3a3" fontSize="9">lastIp: 198.51.100.22</text>
          </g>

          {/* Animated TTL readout */}
          <g transform="translate(320 45)">
            <rect width="135" height="60" fill="#0d0d0d" stroke="white" />
            <text x="67" y="20" fill="#a3a3a3" textAnchor="middle" fontSize="8" letterSpacing="1">TTL COUNTDOWN</text>
            <text x="67" y="44" fill="white" textAnchor="middle" fontSize="18" fontWeight="bold">
              1,794s
            </text>
          </g>
        </g>

        {/* Shelf Slot 2: Other user session */}
        <g transform="translate(25 210)" opacity="0.45">
          <rect width="475" height="90" fill="#141414" stroke="#525252" />
          <text x="15" y="24" fill="#a3a3a3" fontSize="9">KEY: "session:c2108df09bb231"</text>
          <text x="460" y="24" fill="#737373" textAnchor="end" fontSize="8">TTL: 820s</text>
          <text x="15" y="55" fill="#737373" fontSize="9">{`{ "userId": "user_99", "role": "admin" }`}</text>
        </g>
      </g>
    </>
  );
}

// Chapter 04 Diagram: The cookie returns (Cookie wrapper with HttpOnly, Secure, SameSite, Max-Age)
function DiagramCookieWrapper({ prefix }: { prefix: string }) {
  const flags = [
    { title: 'HttpOnly', desc: 'Blocks document.cookie in JS', note: 'Prevents XSS theft' },
    { title: 'Secure', desc: 'Sent only over TLS/HTTPS', note: 'Stops network sniffing' },
    { title: 'SameSite=Lax', desc: 'Restricted on third-party origins', note: 'Neutralizes CSRF attacks' },
    { title: 'Max-Age=1800', desc: 'Browser cookie expires in 30m', note: 'Matches Redis TTL' },
  ];

  return (
    <>
      <text x="32" y="52" fill="white" fontSize="10" letterSpacing="2">THE FOUR DEFENSE FLAGS OF A SESSION COOKIE</text>

      <g transform="translate(45 80)">
        <rect width="555" height="96" fill="#171717" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="555" height="24" fill="#262626" />
        <text x="18" y="16" fill="#a3a3a3" fontSize="8" letterSpacing="1">HTTP RESPONSE HEADER (RFC 6265)</text>
        <text x="537" y="16" fill="#a3a3a3" textAnchor="end" fontSize="8">SERVER → CLIENT</text>
        <text x="18" y="48" fill="white" fontSize="11" fontWeight="bold">
          Set-Cookie: sid=8f4a91b3...; Path=/;
        </text>
        <text x="18" y="68" fill="#e5e5e5" fontSize="10.5">
          HttpOnly; Secure; SameSite=Lax; Max-Age=1800
        </text>
        <text x="18" y="85" fill="#737373" fontSize="8">
          4 defensive browser flags protect the opaque session ticket
        </text>
      </g>

      <g transform="translate(45 195)">
        {flags.map((flag, i) => (
          <g key={flag.title} transform={`translate(${(i % 2) * 285} ${Math.floor(i / 2) * 115})`}>
            <rect width="270" height="95" fill="#121212" stroke="white" />
            <rect x="0" y="0" width="270" height="22" fill="#262626" />
            <text x="15" y="15" fill="white" fontSize="9" fontWeight="bold">{flag.title}</text>
            <text x="15" y="48" fill="white" fontSize="10">{flag.desc}</text>
            <text x="15" y="72" fill="#a3a3a3" fontSize="8">{flag.note}</text>
          </g>
        ))}
      </g>
    </>
  );
}

// Chapter 05 Diagram: Every request performs a lookup (Search beam through Redis, permission verified)
function DiagramRequestLookup({ prefix }: { prefix: string }) {
  return (
    <>
      <DarkBrowser x={20} y={120} small label="BROWSER" />

      {/* API Server */}
      <g transform="translate(235 100)">
        <rect width="165" height="200" fill="#121212" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="165" height="24" fill="white" />
        <text x="82.5" y="16" fill="black" textAnchor="middle" fontSize="9" letterSpacing="1" fontWeight="bold">
          API GATEWAY
        </text>
        <text x="15" y="55" fill="white" fontSize="9">1. Extract sid cookie</text>
        <text x="15" y="85" fill="white" fontSize="9">2. Query Redis in RAM</text>
        <text x="15" y="115" fill="white" fontSize="9">3. Read role claim</text>
        <text x="15" y="145" fill="white" fontSize="9">4. Verify permission</text>
        <rect x="15" y="160" width="135" height="24" fill="#262626" />
        <text x="82.5" y="176" fill="white" textAnchor="middle" fontSize="9">200 OK / ACCESS GRANTED</text>
      </g>

      <RedisNode x={445} y={80} />

      {/* Flow lines */}
      <path id={`${prefix}-req-out`} className="draw path-out" d="M170 170H235" stroke="white" strokeWidth="1.5" markerEnd={`url(#${prefix}-arrow)`} />
      <text x="202" y="160" fill="#a3a3a3" textAnchor="middle" fontSize="8">COOKIE</text>

      <path className="draw path-redis-query" d="M400 160H445" stroke="white" strokeWidth="1.5" markerEnd={`url(#${prefix}-arrow)`} />
      <text x="422" y="150" fill="#a3a3a3" textAnchor="middle" fontSize="8">GET</text>

      <path className="draw path-redis-reply" d="M445 210H400" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" markerEnd={`url(#${prefix}-arrow)`} />
      <text x="422" y="202" fill="#a3a3a3" textAnchor="middle" fontSize="8">DATA</text>

      <path className="draw path-back" d="M235 240H170" stroke="white" strokeWidth="1.5" markerEnd={`url(#${prefix}-arrow)`} />
      <text x="202" y="232" fill="white" textAnchor="middle" fontSize="8">RESPONSE</text>

      <DarkPacket className="packet-a" label="SID" />
      <DarkPacket className="packet-b" label="JSON" />
    </>
  );
}

// Chapter 06 Diagram: Many servers, one session store (Load balancer, Server A/B/C, shared Redis)
function DiagramDistributedStore() {
  return (
    <>
      <text x="32" y="52" fill="white" fontSize="10" letterSpacing="2">HORIZONTAL SCALING: SHARED MEMORY ACROSS NODES</text>

      {/* Load Balancer */}
      <g transform="translate(45 190)">
        <rect width="110" height="90" fill="#171717" stroke="white" strokeWidth="1.5" />
        <text x="55" y="40" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">LOAD</text>
        <text x="55" y="55" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">BALANCER</text>
      </g>

      {/* Server Instances */}
      {['SERVER A', 'SERVER B', 'SERVER C'].map((name, i) => (
        <g key={name} transform={`translate(225 ${110 + i * 85})`}>
          <rect width="135" height="60" fill="#121212" stroke="white" strokeWidth="1.5" />
          <text x="67" y="35" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">{name}</text>
        </g>
      ))}

      {/* Central Redis Cluster */}
      <g transform="translate(435 150)">
        <rect width="165" height="170" fill="#0d0d0d" stroke="white" strokeWidth="2" />
        <rect x="0" y="0" width="165" height="24" fill="white" />
        <text x="82" y="16" fill="black" textAnchor="middle" fontSize="9" fontWeight="bold">
          SHARED REDIS STORE
        </text>
        <g transform="translate(20 45)">
          <text x="0" y="20" fill="white" fontSize="9">session:8f4a91b...</text>
          <text x="0" y="45" fill="#a3a3a3" fontSize="8">user_42 (student)</text>
          <line x1="0" y1="65" x2="125" y2="65" stroke="#404040" />
          <text x="62" y="85" fill="white" textAnchor="middle" fontSize="8">
            ALL SERVERS READ SAME KEY
          </text>
        </g>
      </g>

      {/* Connector lines from LB to servers */}
      <path d="M155 210L225 140" stroke="white" strokeWidth="1" />
      <path d="M155 235H225" stroke="white" strokeWidth="1.5" />
      <path d="M155 260L225 310" stroke="white" strokeWidth="1" />

      {/* Connector lines from servers to Redis */}
      <path d="M360 140L435 200" stroke="white" strokeWidth="1" />
      <path d="M360 225H435" stroke="white" strokeWidth="1.5" />
      <path d="M360 310L435 250" stroke="white" strokeWidth="1" />
    </>
  );
}

// Chapter 07 Diagram: Expiry, renewal, and logout (Record collapse, cookie points to nothing)
function DiagramLifecycleLogout() {
  return (
    <>
      <text x="32" y="52" fill="white" fontSize="10" letterSpacing="2">THE THREE LIFECYCLE OUTCOMES</text>

      {/* State 1: Active */}
      <g transform="translate(45 90)">
        <rect width="555" height="90" fill="#121212" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="120" height="22" fill="white" />
        <text x="60" y="15" fill="black" textAnchor="middle" fontSize="9" fontWeight="bold">01 / ACTIVE</text>
        <text x="25" y="50" fill="white" fontSize="11" fontWeight="bold">TTL &gt; 0: Session valid in memory</text>
        <text x="25" y="70" fill="#a3a3a3" fontSize="9">Next request resets or honors countdown timer. Access granted.</text>
        <text x="530" y="55" fill="white" textAnchor="end" fontSize="12" fontWeight="bold">200 OK</text>
      </g>

      {/* State 2: Natural Expiry */}
      <g transform="translate(45 200)">
        <rect width="555" height="90" fill="#121212" stroke="white" strokeWidth="1.5" />
        <rect x="0" y="0" width="120" height="22" fill="#262626" stroke="white" />
        <text x="60" y="15" fill="white" textAnchor="middle" fontSize="9">02 / EXPIRED</text>
        <text x="25" y="50" fill="white" fontSize="11" fontWeight="bold">TTL reaches 0: Redis evicts the key</text>
        <text x="25" y="70" fill="#a3a3a3" fontSize="9">Subsequent request extracts sid, but Redis finds nothing. Cookie cleared.</text>
        <text x="530" y="55" fill="#a3a3a3" textAnchor="end" fontSize="12" fontWeight="bold">401 UNAUTHORIZED</text>
      </g>

      {/* State 3: Immediate Logout (Collapsing record) */}
      <g transform="translate(45 310)">
        <rect width="555" height="110" fill="#0d0d0d" stroke="white" strokeWidth="2" />
        <rect x="0" y="0" width="120" height="22" fill="white" />
        <text x="60" y="15" fill="black" textAnchor="middle" fontSize="9" fontWeight="bold">03 / INSTANT LOGOUT</text>
        <text x="25" y="50" fill="white" fontSize="11" fontWeight="bold">DEL session:8f4a91b... executed</text>
        <text x="25" y="70" fill="#a3a3a3" fontSize="9">
          Record deleted. Stolen cookies now point to empty space.
        </text>
        <text x="25" y="92" fill="white" fontSize="9">
          RESULT: Total revocation across all worldwide endpoints in &lt;1 millisecond.
        </text>
        <text x="530" y="65" fill="white" textAnchor="end" fontSize="12" fontWeight="bold">204 NO CONTENT</text>
      </g>
    </>
  );
}

const sessionSteps: Record<SessionDiagramKind, string[]> = {
  'why-sessions': [
    'A JWT packs claims into the browser; a session retains them on the server.',
    'The browser holds only an unguessable 128-bit ticket ID.',
    'Claims are read in memory only when the server needs them.',
    'The client cannot decode or inspect server-side state.',
  ],
  'login-journey': [
    'Credentials travel over TLS directly to the authentication server.',
    'The server validates credentials against the database.',
    'A random session ID is generated and stored in Redis.',
    'An opaque Set-Cookie header returns to the client.',
  ],
  'redis-storage': [
    'Redis allocates key-value memory for the session ID.',
    'User ID, role, and metadata expand in RAM.',
    'A Time-To-Live countdown begins ticking.',
    'Sub-millisecond retrieval is guaranteed by in-memory indexing.',
  ],
  'cookie-wrapper': [
    'The opaque session ID is placed into a secure cookie wrapper.',
    'HttpOnly blocks script access; Secure enforces HTTPS.',
    'SameSite controls cross-origin request transmission.',
    'Max-Age synchronizes client storage with the Redis TTL.',
  ],
  'request-lookup': [
    'Client sends the opaque session cookie on an HTTP request.',
    'API gateway extracts the sid and queries Redis.',
    'Redis matches the key and returns user permissions.',
    'The API validates the route permission and responds.',
  ],
  'distributed-store': [
    'A load balancer routes client requests across multiple API servers.',
    'Request 1 reaches Server A and fetches user state from Redis.',
    'Request 2 reaches Server C and finds the exact same session.',
    'One shared cluster eliminates sticky sessions.',
  ],
  'lifecycle-logout': [
    'Active sessions grant immediate access while TTL > 0.',
    'Natural expiration removes keys automatically without database bloat.',
    'Logout runs DEL session:id, destroying state immediately.',
    'Possession of an orphaned cookie grants zero privileges.',
  ],
};

export function SessionDiagram({
  kind,
  motionEnabled,
  hero = false,
  enlarged = false,
}: {
  kind: SessionDiagramKind;
  motionEnabled: boolean;
  hero?: boolean;
  enlarged?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const prefix = useId().replace(/:/g, '');
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [expanded]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const scene = root.closest('[data-scene]') || (hero ? root.closest('section') : null);
    if (!motionEnabled || !scene) {
      setStep(3);
      return;
    }

    const context = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 0.25,
          invalidateOnRefresh: true,
        },
      });

      tl.to({}, { duration: 10 }, 0);
      tl.eventCallback('onUpdate', () => {
        const next = Math.min(3, Math.floor(tl.progress() * 4));
        setStep(previous => (previous === next ? previous : next));
      });

      tl.fromTo(progress.current, { scaleX: 0 }, { scaleX: 1, duration: 10, ease: 'none' }, 0);

      root.querySelectorAll<SVGPathElement>('.draw').forEach((path, i) => {
        const length = path.getTotalLength();
        tl.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, duration: 3, ease: 'none' },
          i * 2 + 0.2
        );
      });

      const travel = (packet: string, pathClass: string, at: number, duration: number) => {
        const path = root.querySelector(pathClass);
        if (!path || !root.querySelector(packet)) return;
        tl.set(packet, { autoAlpha: 0 }, 0);
        tl.to(packet, { autoAlpha: 1, duration: 0.12 }, at);
        tl.to(
          packet,
          { motionPath: { path: path as SVGPathElement, align: path as SVGPathElement, alignOrigin: [0.5, 0.5] }, duration, ease: 'none' },
          at
        );
        tl.to(packet, { autoAlpha: 0, duration: 0.12 }, at + duration);
      };

      travel('.packet-a', '.path-out', 0.5, 2.7);
      travel('.packet-b', '.path-back', 6.3, 2.9);

      if (root.querySelector('.reveal')) {
        // Animate opacity only. A GSAP `y` transform replaces the SVG group's
        // own translate(45 300), pulling this callout over the diagram title.
        tl.fromTo('.reveal', { opacity: 0.15 }, { opacity: 1, stagger: 0.45, duration: 2 }, 2);
      }
      if (root.querySelector('.redis-led')) {
        tl.fromTo('.redis-led', { opacity: 0.2 }, { opacity: 1, stagger: 0.5, duration: 0.6 }, 2.5);
      }
    }, root);

    return () => context.revert();
  }, [kind, motionEnabled, hero]);

  return (
    <div ref={ref} className="relative w-full bg-black text-white" data-diagram={kind}>
      <svg
        viewBox="0 0 645 500"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${kind} diagram. ${motionEnabled ? 'Scroll to follow the process.' : 'Motion is off; complete view is shown.'}`}
      >
        <defs>
          <pattern id={`${prefix}-dark-grid`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="white" strokeOpacity="0.06" />
          </pattern>
          <marker id={`${prefix}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M1 1l6 3-6 3" fill="none" stroke="white" />
          </marker>
        </defs>
        <rect width="645" height="500" fill={`url(#${prefix}-dark-grid)`} />

        {kind === 'why-sessions' && <DiagramWhySessions prefix={prefix} />}
        {kind === 'login-journey' && <DiagramLoginJourney prefix={prefix} />}
        {kind === 'redis-storage' && <DiagramRedisStorage />}
        {kind === 'cookie-wrapper' && <DiagramCookieWrapper prefix={prefix} />}
        {kind === 'request-lookup' && <DiagramRequestLookup prefix={prefix} />}
        {kind === 'distributed-store' && <DiagramDistributedStore />}
        {kind === 'lifecycle-logout' && <DiagramLifecycleLogout />}
      </svg>

      <div className="relative border-t border-neutral-800 px-4 py-3 bg-[#0d0d0d]">
        <div ref={progress} className="absolute top-0 left-0 h-[2px] w-full origin-left bg-white" />
        <div className="flex items-center gap-3 text-[9px] leading-5 text-neutral-300">
          <span className="shrink-0 border border-white px-1.5 text-[8px] text-white">
            {motionEnabled ? `0${step + 1}` : '↳'}
          </span>
          <span>{sessionSteps[kind][motionEnabled ? step : 3]}</span>
        </div>
      </div>

      {!enlarged && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-neutral-800 px-4 text-[11px] text-neutral-400 hover:bg-white hover:text-black sm:hidden"
        >
          <Maximize2 size={13} />
          View a larger diagram
        </button>
      )}

      {expanded && (
        <dialog
          ref={dialog}
          onCancel={event => {
            event.preventDefault();
            setExpanded(false);
          }}
          onClose={() => setExpanded(false)}
          className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white backdrop:bg-black/80"
        >
          <div className="flex items-center justify-between border-b border-white px-5 py-3">
            <h3 className="text-sm capitalize font-mono">{kind} / full diagram</h3>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="flex size-11 items-center justify-center text-white"
              aria-label="Close enlarged diagram"
            >
              <X size={21} />
            </button>
          </div>
          <p className="border-b border-neutral-800 px-5 py-4 text-xs leading-6 text-neutral-400">
            Swipe across to inspect the server-side diagrams. Motion is paused in this view.
          </p>
          <div className="max-h-[calc(100dvh-180px)] overflow-auto">
            <div className="w-[960px]">
              <SessionDiagram kind={kind} motionEnabled={false} enlarged />
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

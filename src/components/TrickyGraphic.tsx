import { useEffect, useId, useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Database,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Terminal,
  Unlock,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TrickyTopic {
  id: string;
  number: string;
  title: string;
  tagline: string;
  badge: string;
  rfc: string;
  headline: string;
  subhead: string;
  simple: {
    mistake: string;
    danger: string;
    fix: string;
    fixCode?: string;
  };
  trap: {
    title: string;
    description: string;
  };
  failure: {
    title: string;
    description: string;
  };
  mitigation: {
    title: string;
    description: string;
    code?: string;
  };
}

export const TRICKY_TOPICS: TrickyTopic[] = [
  {
    id: 'revocation',
    number: '01',
    title: 'Revocation',
    tagline: 'The Stateless Paradox',
    badge: 'ARCHITECTURAL CONFLICT',
    rfc: 'RFC 7519 §4.1.4 (exp)',
    headline: 'Once signed, a token cannot be unsigned.',
    subhead:
      'Stateless verification means servers trust the math without contacting a central database. But when a session must end immediately, statelessness becomes a critical liability.',
    simple: {
      mistake: 'Assuming that clearing the cookie or localStorage in the browser logs out the user.',
      danger: 'Any copy of that token (in browser history, network logs, or malware) remains 100% valid across every API until its expiration second arrives.',
      fix: 'Use short 15-minute token lifetimes. For instant logout, store revocable refresh tokens in Redis or maintain a lightweight revoked-ID blocklist.',
      fixCode: 'access_token.exp = now + 900 // 15 mins max\nrefresh_token.store = redis',
    },
    trap: {
      title: 'The "Just Delete the Cookie" Fallacy',
      description:
        'Engineers often assume that clearing a JWT from the user browser localStorage or cookies logs them out. In reality, any copy of that token—saved in browser history, proxy logs, or exfiltrated by malware—remains 100% valid across every API until its expiration timestamp arrives.',
    },
    failure: {
      title: 'The Blacklist Paradox',
      description:
        'To revoke a token on demand (e.g. employee termination, password reset, stolen laptop), the backend must check an active blocklist (Redis / database) for every incoming request. The moment you query a database on every request, the zero-lookup benefit that justified using JWTs over sessions is completely lost.',
    },
    mitigation: {
      title: 'Two-Tier Lifetimes & Bloom Filters',
      description:
        'Issue short-lived access tokens (5 to 15 minutes max) paired with revocable server-stored refresh tokens. If instant revocation is mandatory, use an in-memory Redis Bloom filter of revoked token IDs (jti) to check blocklists in sub-millisecond time without full SQL queries.',
      code: 'access_token.exp = now + 900 // 15 mins max\nrefresh_token.store = redis_session_store',
    },
  },
  {
    id: 'transparency',
    number: '02',
    title: 'Transparency',
    tagline: 'Encoded ≠ Encrypted',
    badge: 'CONFIDENTIALITY LEAK',
    rfc: 'RFC 7515 (JWS) vs RFC 7516 (JWE)',
    headline: 'Base64 is a typeface, not a vault.',
    subhead:
      'A signed JWT (JWS) guarantees integrity and authenticity, but zero confidentiality. The payload is in broad daylight to anyone who touches the string.',
    simple: {
      mistake: 'Believing that scrambled Base64url characters (eyJhbGci...) mean the payload is encrypted.',
      danger: 'Base64url is simple encoding, reversible in 0.1ms with atob(). Any browser extension, proxy, or logger can read all claims inside.',
      fix: 'Store only public, opaque IDs in JWTs (sub: "usr_42"). If secrets are required, encrypt the token into a JWE envelope (AES-256-GCM).',
      fixCode: '{ sub: "usr_42" } // Opaque ID only\n// If secrets required, encrypt with JWE:\njwe.encrypt(token, AES_256_GCM)',
    },
    trap: {
      title: 'The "Scrambled Text" Illusion',
      description:
        'Because base64url looks like random characters (eyJhbGciOi...), teams routinely mistake encoding for encryption. Developers place private emails, internal VPC IP addresses, role hierarchies, feature flags, and even employee compensation bands directly into claims.',
    },
    failure: {
      title: 'Middlebox & Extension Extraction',
      description:
        'Base64url is fully reversible in 0.1ms with standard atob(). Any browser extension, developer tools inspector, corporate TLS-terminating proxy, or CDN edge access log can read every claim. Storing PII violates GDPR/HIPAA when logged by telemetry pipelines.',
    },
    mitigation: {
      title: 'Pseudonymous Identifiers & JWE',
      description:
        'Never store sensitive or secret data in a signed JWT payload. Use opaque, random UUIDs (sub: "usr_9918") and fetch sensitive profile data server-side. When claims must be confidential over untrusted channels, encrypt the token into an authenticated JWE envelope using AES-256-GCM.',
      code: 'payload = { sub: "usr_9918" } // Opaque ID only\n// If secrets required, encrypt with JWE:\njwe.encrypt(token, AES_256_GCM)',
    },
  },
  {
    id: 'bearer',
    number: '03',
    title: 'Bearer Replay',
    tagline: 'Possession Equals Identity',
    badge: 'UNCONSTRAINED SENDER',
    rfc: 'RFC 6750 (Bearer) / RFC 9449 (DPoP)',
    headline: 'Possession is the only proof.',
    subhead:
      'Standard JWTs are bearer instruments: like physical cash, whoever presents the token is granted the identity. There is no inherent cryptographic link between the token and the machine presenting it.',
    simple: {
      mistake: 'Assuming HTTPS alone protects tokens from being stolen and replayed by attackers.',
      danger: 'Bearer tokens work like physical cash: whoever presents the token is the user. Stolen via XSS, it can be replayed from any computer on Earth.',
      fix: 'Store tokens in HttpOnly, Secure cookies so JavaScript cannot access them. For high security, bind tokens to the device via DPoP (RFC 9449).',
      fixCode: 'Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict\n// Or DPoP (RFC 9449 proof-of-possession)',
    },
    trap: {
      title: 'The "HTTPS Protects Us" Blindspot',
      description:
        'Teams believe TLS encryption in transit prevents token theft. But tokens are rarely stolen off the wire; they are stolen at the endpoints via Cross-Site Scripting (XSS), rogue browser plugins, unpinned mobile apps, or accidental logging in APM traces.',
    },
    failure: {
      title: 'Replay From Any IP on Earth',
      description:
        'Once a bearer token is exfiltrated, an attacker can replay it against your APIs from a different browser, IP, or geographic region. Because the signature passes and the expiry is valid, the API has zero cryptographic way to know the request originated from an attacker rather than the genuine user.',
    },
    mitigation: {
      title: 'HttpOnly Cookies & DPoP Binding',
      description:
        'Store access tokens in HttpOnly, Secure, SameSite=Strict cookies so JavaScript cannot read them. In zero-trust APIs, implement DPoP (Demonstrating Proof-of-Possession, RFC 9449), which binds the token to a private key generated in the browser that signs each HTTP request.',
      code: 'Set-Cookie: jwt=...; HttpOnly; Secure; SameSite=Strict\n// Or RFC 9449 DPoP:\nDPoP: <jwt-signed-by-client-private-key>',
    },
  },
  {
    id: 'stale',
    number: '04',
    title: 'Stale Claims',
    tagline: 'The Demotion Gap',
    badge: 'AUTHORIZATION DRIFT',
    rfc: 'NIST SP 800-162 (ABAC)',
    headline: 'A snapshot of truth frozen in time.',
    subhead:
      'Claims reflect user state at the exact millisecond of issuance. In dynamic systems, permissions, roles, and account statuses change constantly.',
    simple: {
      mistake: 'Putting dynamic permissions (e.g. role: "admin") permanently inside the token.',
      danger: 'Tokens are snapshots frozen in time. If you demote or ban an admin, they continue executing admin actions until their token expires.',
      fix: 'Put identity only (sub: "usr_42") inside the token. Let API gateways check live permissions in a fast memory cache.',
      fixCode: '// Token carries identity only:\n{ "sub": "usr_42", "iat": 1700000000 }\n// Gateway verifies policy live:\ncanUser(req.sub, "billing:write")',
    },
    trap: {
      title: 'The "Role in Token" Pattern',
      description:
        'Putting role: "admin" or permissions: ["billing:write", "users:delete"] inside a token makes authorization fast because microservices do not need to query a central permissions service. However, it freezes those permissions for the entire lifetime of the token.',
    },
    failure: {
      title: 'The "Ghost Admin" Window',
      description:
        'If an administrator detects an account takeover and demotes the user to "restricted" in the primary database, the user still holds a valid token declaring role: "admin". Downstream microservices verifying only the token signature continue honoring admin actions for the remaining 30–60 minutes.',
    },
    mitigation: {
      title: 'Identity in Token, Auth at the Edge',
      description:
        'Use JWTs strictly for coarse authentication (who the caller is: sub). Let API gateways or edge proxies query fine-grained authorization policies (e.g. Open Policy Agent, Oso, or an in-memory cached permission table) rather than baking volatile privileges into immutable tokens.',
      code: '// Token carries identity only:\n{ "sub": "usr_42", "iat": 1700000000 }\n// Gateway verifies policy against live cache:\ncanUser(req.sub, "billing:write")',
    },
  },
  {
    id: 'bloat',
    number: '05',
    title: 'Token Bloat',
    tagline: 'The Network Tax',
    badge: 'BANDWIDTH OVERHEAD',
    rfc: 'RFC 9110 §11.6 (HTTP 431)',
    headline: 'The weight of every claim on every hop.',
    subhead:
      'Unlike a 32-byte session ID, a self-contained JWT packs signatures, headers, and dozens of claims. In microservice architectures, this payload multiplies across every internal RPC.',
    simple: {
      mistake: 'Assuming adding lots of claims (tenants, groups, emails, flags) is harmless.',
      danger: 'Tokens grow to 3KB+. Sent on every HTTP request, 1 frontend click hitting 10 microservices sends 30KB+ of headers, causing HTTP 431 errors.',
      fix: 'Keep claims minimal. For web browsers, use a 32-byte opaque session cookie externally and exchange it for a scoped JWT at the API gateway.',
      fixCode: 'Browser ──[32B Opaque Cookie]──> Gateway\nGateway ──[Scoped JWT]──> Internal APIs',
    },
    trap: {
      title: 'The "A Few Kilobytes Don’t Matter" Assumption',
      description:
        'As teams add tenant IDs, enterprise group memberships, email addresses, and scopes, a JWT rapidly grows from 300 bytes to 3KB or 4KB. Developers assume modern broadband makes this negligible.',
    },
    failure: {
      title: 'HTTP 431 & Multiplied Latency',
      description:
        'When a frontend makes 1 request that cascades across 10 internal microservices, a 3.5KB token is serialized, hashed, and sent over the wire 10 times (35KB per user click). Edge reverse proxies (Envoy, Nginx, AWS ALB) often enforce strict 8KB header buffers, triggering sudden HTTP 431 Request Header Fields Too Large errors in production.',
    },
    mitigation: {
      title: 'Opaque Session Tokens at the Edge',
      description:
        'Use lightweight 32-byte opaque cookies between browser and API Gateway. The Gateway exchanges the cookie for a short-lived internal JWT with only the claims required by downstream microservices, preventing multi-kilobyte header bloat over mobile networks.',
      code: 'Browser ──[32B Opaque Cookie]──> API Gateway\nAPI Gateway ──[Scoped JWT]──> Internal Services',
    },
  },
  {
    id: 'algorithms',
    number: '06',
    title: 'Algo Traps',
    tagline: 'The Header Exploit',
    badge: 'CRYPTO MISCONFIGURATION',
    rfc: 'RFC 8725 §3.1 & §3.2 (BCP)',
    headline: 'Never let the client choose the cipher.',
    subhead:
      'The JWT header specifies the algorithm used to sign it. Naive verifiers that trust this header allow attackers to manipulate cryptographic rules.',
    simple: {
      mistake: 'Letting the token\'s incoming header tell the server which algorithm to verify with.',
      danger: 'Attackers can change the header to alg: "none" to skip verification, or swap RS256 for HS256 to forge signatures with the public key.',
      fix: 'Hardcode the expected algorithm on the server verifier (e.g. algorithms: ["RS256"]). Explicitly ban alg: "none".',
      fixCode: 'jwt.verify(token, publicKey, {\n  algorithms: ["RS256"], // STRICT ALLOWLIST\n  allowNone: false\n})',
    },
    trap: {
      title: 'The alg: "none" and Key Confusion Attacks',
      description:
        'RFC 7519 originally allowed alg: "none" for unsigned debugging tokens. Attackers strip the signature, change the header to alg: "none", and flawed libraries blindly mark the token valid without running any signature verification code.',
    },
    failure: {
      title: 'HMAC vs RSA Key Confusion',
      description:
        'If an API expects asymmetric RS256, an attacker can change the header to symmetric HS256, then sign a forged token using the server public key (which is public knowledge). If the backend verifier passes the public key into an HMAC algorithm, verification mathematically succeeds!',
    },
    mitigation: {
      title: 'Strict Algorithm Pinning & BCP Compliance',
      description:
        'Enforce RFC 8725 Best Current Practices: never allow the token header to choose the algorithm. Hardcode the expected algorithm in the verifier (algorithms: ["RS256"]), explicitly ban alg: "none", and reject symmetric keys in asymmetric workflows.',
      code: '// Hardened verification configuration:\njwt.verify(token, publicKey, {\n  algorithms: ["RS256"], // STRICT ALLOWLIST\n  allowNone: false\n})',
    },
  },
];

// Interactive Motion Graphic Canvas for Topic 01 (Revocation)
function RevocationGraphic({ motionEnabled }: { motionEnabled: boolean }) {
  const [blacklistMode, setBlacklistMode] = useState(false);
  const [userBanned, setUserBanned] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="section-label">Simulated Request Pipeline</span>
          <p className="mt-1 text-xs text-neutral-600">
            Token issued at 10:00 AM (Exp: 11:00 AM). User banned in database at 10:15 AM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBlacklistMode(!blacklistMode)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border border-black transition-colors ${
              blacklistMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            {blacklistMode ? 'Mode: Blacklist Active' : 'Mode: Pure Stateless'}
          </button>
          <button
            type="button"
            onClick={() => setUserBanned(!userBanned)}
            className="border border-black px-3 py-1.5 text-[10px] uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
          >
            {userBanned ? 'DB: User Banned' : 'DB: User Active'}
          </button>
        </div>
      </div>

      {/* SVG Pipeline */}
      <div className="relative border border-black bg-white p-6">
        <svg
          viewBox="0 0 760 220"
          className="w-full h-auto max-h-[220px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Client Node */}
          <g transform="translate(20 50)">
            <rect width="130" height="90" fill="white" stroke="black" strokeWidth="1.5" />
            <rect x="0" y="0" width="130" height="20" fill="black" />
            <text x="65" y="14" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">
              BROWSER / CLIENT
            </text>
            <text x="65" y="45" fill="black" textAnchor="middle" fontSize="10">
              Token in Hand
            </text>
            <text x="65" y="65" fill="#525252" textAnchor="middle" fontSize="8">
              exp: 11:00 AM
            </text>
            <text x="65" y="80" fill="#525252" textAnchor="middle" fontSize="8">
              sig: valid
            </text>
          </g>

          {/* Connection 1 */}
          <path d="M150 95H250" stroke="black" strokeWidth="1.5" />
          <polygon points="250,95 240,90 240,100" fill="black" />
          <text x="200" y="85" textAnchor="middle" fontSize="8" fill="#525252">
            JWT PACKET
          </text>

          {/* API Gateway / Microservice */}
          <g transform="translate(250 35)">
            <rect width="210" height="120" fill="white" stroke="black" strokeWidth="1.5" />
            <rect x="0" y="0" width="210" height="20" fill="#f5f5f5" stroke="black" />
            <text x="105" y="14" fill="black" textAnchor="middle" fontSize="9" letterSpacing="1">
              RESOURCE API
            </text>
            <text x="15" y="45" fontSize="9" fill="black">
              1. Verify HMAC / RSA
            </text>
            <text x="175" y="45" fontSize="9" fill="black" fontWeight="bold">
              [PASS]
            </text>
            <text x="15" y="65" fontSize="9" fill="black">
              2. Check exp &gt; now
            </text>
            <text x="175" y="65" fontSize="9" fill="black" fontWeight="bold">
              [PASS]
            </text>

            {blacklistMode ? (
              <>
                <text x="15" y="90" fontSize="9" fill="black">
                  3. Query Redis Blacklist
                </text>
                <text x="175" y="90" fontSize="9" fill="black" fontWeight="bold">
                  {userBanned ? '[REVOKED]' : '[CLEAN]'}
                </text>
                <rect x="10" y="98" width="190" height="15" fill="black" />
                <text x="105" y="109" fill="white" textAnchor="middle" fontSize="8">
                  STATELESSNESS LOST: +12ms LOOKUP
                </text>
              </>
            ) : (
              <>
                <text x="15" y="90" fontSize="9" fill="#525252">
                  3. Blacklist Check
                </text>
                <text x="175" y="90" fontSize="8" fill="#525252">
                  [SKIPPED]
                </text>
                <rect x="10" y="98" width="190" height="15" fill="#f5f5f5" stroke="black" />
                <text x="105" y="109" fill="black" textAnchor="middle" fontSize="8">
                  PURE STATELESS (BLIND TO DB)
                </text>
              </>
            )}
          </g>

          {/* Connection 2 */}
          <path d="M460 95H560" stroke="black" strokeWidth="1.5" />
          <polygon points="560,95 550,90 550,100" fill="black" />

          {/* Result / Decision Box */}
          <g transform="translate(560 40)">
            <rect
              width="170"
              height="110"
              fill={!blacklistMode && userBanned ? 'black' : 'white'}
              stroke="black"
              strokeWidth="2"
            />
            <text
              x="85"
              y="30"
              fill={!blacklistMode && userBanned ? 'white' : 'black'}
              textAnchor="middle"
              fontSize="10"
              letterSpacing="1"
            >
              DECISION OUTCOME
            </text>
            <path
              d="M20 42h130"
              stroke={!blacklistMode && userBanned ? '#525252' : '#e5e5e5'}
            />

            {!blacklistMode && userBanned ? (
              <>
                <text x="85" y="65" fill="white" textAnchor="middle" fontSize="13" fontWeight="bold">
                  200 ACCEPTED
                </text>
                <text x="85" y="85" fill="#a3a3a3" textAnchor="middle" fontSize="8">
                  SECURITY BREACH:
                </text>
                <text x="85" y="98" fill="white" textAnchor="middle" fontSize="8">
                  Banned user allowed access
                </text>
              </>
            ) : blacklistMode && userBanned ? (
              <>
                <text x="85" y="65" fill="black" textAnchor="middle" fontSize="13" fontWeight="bold">
                  401 REVOKED
                </text>
                <text x="85" y="85" fill="#525252" textAnchor="middle" fontSize="8">
                  Access blocked via Redis,
                </text>
                <text x="85" y="98" fill="black" textAnchor="middle" fontSize="8">
                  but database query required.
                </text>
              </>
            ) : (
              <>
                <text x="85" y="65" fill="black" textAnchor="middle" fontSize="13" fontWeight="bold">
                  200 ACCEPTED
                </text>
                <text x="85" y="85" fill="#525252" textAnchor="middle" fontSize="8">
                  Legitimate user session
                </text>
                <text x="85" y="98" fill="black" textAnchor="middle" fontSize="8">
                  verified successfully.
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Kinetic Readout Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-black text-center text-xs">
        <div className="p-4 border-b md:border-b-0 md:border-r border-black">
          <span className="section-label block mb-1 text-neutral-500">Cryptographic Signature</span>
          <span className="font-bold text-sm">VALID / MATHEMATICALLY SOUND</span>
        </div>
        <div className="p-4 border-b md:border-b-0 md:border-r border-black">
          <span className="section-label block mb-1 text-neutral-500">Database Truth</span>
          <span className="font-bold text-sm">{userBanned ? 'USER REVOKED / BANNED' : 'USER IN GOOD STANDING'}</span>
        </div>
        <div className={`p-4 ${!blacklistMode && userBanned ? 'bg-black text-white' : 'bg-white text-black'}`}>
          <span className="section-label block mb-1 text-neutral-400">The Paradox Result</span>
          <span className="font-bold text-sm">
            {!blacklistMode && userBanned ? 'BLIND TRUST (VULNERABLE)' : blacklistMode ? 'CENTRALIZED (NOT STATELESS)' : 'INTENDED STATE'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Interactive Motion Graphic Canvas for Topic 02 (Transparency)
function TransparencyGraphic({ motionEnabled }: { motionEnabled: boolean }) {
  const [decoded, setDecoded] = useState(false);

  const rawHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const rawPayload = 'eyJzdWIiOiJ1c3JfNDA5MSIsInJvbGUiOiJhZG1pbiIsInNhbGFyeSI6MTg1MDAwLCJzc24iOiI5ODctNjUtNDMyMSIsImludGVybmFsX2lwIjoiMTAuMC40LjEyIn0';
  const rawSig = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  const decodedHeader = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  const decodedPayload = '{\n  "sub": "usr_4091",\n  "role": "admin",\n  "salary": 185000,        // EXPOSED LEAK\n  "ssn": "987-65-4321",       // EXPOSED PII\n  "internal_ip": "10.0.4.12"  // INFRA LEAK\n}';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="section-label">Payload Inspection Console</span>
          <p className="mt-1 text-xs text-neutral-600">
            Witness how Base64url reveals all inner claims to any network middlebox or script.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDecoded(!decoded)}
          className="flex items-center gap-2 border border-black px-4 py-2 text-xs uppercase tracking-wider bg-black text-white hover:bg-white hover:text-black transition-colors"
        >
          {decoded ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{decoded ? 'View As Raw Token' : 'Decode Plaintext Claims'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 border border-black">
        {/* Header Column */}
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-black">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label font-bold">01 / HEADER</span>
            <span className="text-[9px] border border-black px-1.5 py-0.5">METADATA</span>
          </div>
          <div className="font-mono text-xs bg-neutral-100 p-3 min-h-[140px] break-all border border-neutral-300">
            {decoded ? (
              <pre className="text-[11px] leading-relaxed text-black">{decodedHeader}</pre>
            ) : (
              <span className="text-black font-medium">{rawHeader}</span>
            )}
          </div>
          <p className="mt-3 text-[10px] text-neutral-500 leading-normal">
            Declares the signing algorithm and token type. Readable by any client.
          </p>
        </div>

        {/* Payload Column (Inverted when decoded) */}
        <div
          className={`p-5 border-b lg:border-b-0 lg:border-r border-black transition-colors duration-100 ${
            decoded ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="section-label font-bold">02 / PAYLOAD</span>
            <span
              className={`text-[9px] border px-1.5 py-0.5 ${
                decoded ? 'border-white text-white' : 'border-black text-black'
              }`}
            >
              {decoded ? 'CONFIDENTIALITY BREACH' : 'ENCODED CLAIMS'}
            </span>
          </div>
          <div
            className={`font-mono text-xs p-3 min-h-[140px] break-all border ${
              decoded
                ? 'bg-neutral-900 border-neutral-700 text-white'
                : 'bg-neutral-100 border-neutral-300 text-black'
            }`}
          >
            {decoded ? (
              <pre className="text-[11px] leading-relaxed text-white font-medium">{decodedPayload}</pre>
            ) : (
              <span className="font-medium">{rawPayload}</span>
            )}
          </div>
          <p
            className={`mt-3 text-[10px] leading-normal ${
              decoded ? 'text-neutral-300' : 'text-neutral-500'
            }`}
          >
            {decoded
              ? 'WARNING: SSN, salary, and internal VPC IPs are plainly visible to CDNs, extensions, and logs!'
              : 'Appears scrambled at first glance, but is simply standard Base64url text.'}
          </p>
        </div>

        {/* Signature Column */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label font-bold">03 / SIGNATURE</span>
            <span className="text-[9px] border border-black px-1.5 py-0.5">INTEGRITY ONLY</span>
          </div>
          <div className="font-mono text-xs bg-neutral-100 p-3 min-h-[140px] break-all border border-neutral-300">
            <span className="text-black font-medium">{rawSig}</span>
          </div>
          <p className="mt-3 text-[10px] text-neutral-500 leading-normal">
            Calculated as HMACSHA256(header.payload, key). Verifies the payload was not tampered with, but DOES NOT hide it.
          </p>
        </div>
      </div>

      <div className="border border-black p-4 bg-neutral-50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Lock size={16} strokeWidth={1.5} className="shrink-0" />
          <span>
            <strong>Production Rule:</strong> Treat standard JWTs like a postcard written in pen. If data must remain private, encrypt with JWE (RFC 7516).
          </span>
        </div>
        <span className="section-label hidden sm:inline text-neutral-500">RFC 7515 / 7516</span>
      </div>
    </div>
  );
}

// Interactive Motion Graphic Canvas for Topic 03 (Bearer Replay)
function BearerGraphic({ motionEnabled }: { motionEnabled: boolean }) {
  const [replayed, setReplayed] = useState(false);
  const [dpopActive, setDpopActive] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="section-label">Token Replay Attack Simulation</span>
          <p className="mt-1 text-xs text-neutral-600">
            Observe how bearer tokens allow an adversary to replay stolen tokens without the user credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDpopActive(!dpopActive)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border border-black transition-colors ${
              dpopActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            {dpopActive ? 'DPoP Proof: Enabled' : 'DPoP Proof: Disabled (Bearer)'}
          </button>
          <button
            type="button"
            onClick={() => setReplayed(!replayed)}
            className="border border-black px-3 py-1.5 text-[10px] uppercase tracking-wider bg-black text-white hover:bg-white hover:text-black transition-colors"
          >
            {replayed ? 'Reset Simulation' : 'Execute Replay Attack'}
          </button>
        </div>
      </div>

      <div className="relative border border-black bg-white p-6">
        <svg
          viewBox="0 0 760 250"
          className="w-full h-auto max-h-[250px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Legitimate User Box */}
          <g transform="translate(30 30)">
            <rect width="170" height="85" fill="white" stroke="black" strokeWidth="1.5" />
            <rect x="0" y="0" width="170" height="20" fill="black" />
            <text x="85" y="14" fill="white" textAnchor="middle" fontSize="9" letterSpacing="1">
              LEGITIMATE USER (ALICE)
            </text>
            <text x="85" y="42" fill="black" textAnchor="middle" fontSize="9">
              IP: 198.51.100.14
            </text>
            <text x="85" y="60" fill="#525252" textAnchor="middle" fontSize="8">
              Stores JWT in localStorage
            </text>
            <text x="85" y="74" fill="#525252" textAnchor="middle" fontSize="8">
              {dpopActive ? 'Client Private Key: Active' : 'No Hardware Binding'}
            </text>
          </g>

          {/* Attacker Box */}
          <g transform="translate(30 145)">
            <rect
              width="170"
              height="85"
              fill={replayed ? 'black' : '#f5f5f5'}
              stroke="black"
              strokeWidth="1.5"
            />
            <rect x="0" y="0" width="170" height="20" fill={replayed ? '#525252' : 'white'} stroke="black" />
            <text
              x="85"
              y="14"
              fill={replayed ? 'white' : 'black'}
              textAnchor="middle"
              fontSize="9"
              letterSpacing="1"
            >
              ATTACKER (XSS INJECTOR)
            </text>
            <text
              x="85"
              y="42"
              fill={replayed ? 'white' : 'black'}
              textAnchor="middle"
              fontSize="9"
            >
              IP: 203.0.113.88
            </text>
            <text
              x="85"
              y="60"
              fill={replayed ? '#d4d4d4' : '#525252'}
              textAnchor="middle"
              fontSize="8"
            >
              {replayed ? 'Stole Alice Token via XSS' : 'Listening for Stolen Tokens'}
            </text>
            <text
              x="85"
              y="74"
              fill={replayed ? '#d4d4d4' : '#525252'}
              textAnchor="middle"
              fontSize="8"
            >
              {replayed ? 'Replaying POST /transfer' : 'Idle'}
            </text>
          </g>

          {/* Siphon Arrow between Alice and Attacker */}
          {replayed && (
            <path
              d="M115 115V145"
              stroke="black"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Alice Path to API */}
          <path d="M200 72H350" stroke="black" strokeWidth="1.5" />
          <polygon points="350,72 340,67 340,77" fill="black" />
          <text x="275" y="65" textAnchor="middle" fontSize="8" fill="#525252">
            VALID REQUEST
          </text>

          {/* Attacker Path to API */}
          {replayed ? (
            <g>
              <path d="M200 187H350" stroke="black" strokeWidth="2" />
              <polygon points="350,187 340,182 340,192" fill="black" />
              <text x="275" y="180" textAnchor="middle" fontSize="8" fill="black" fontWeight="bold">
                REPLAY WITH STOLEN TOKEN
              </text>
            </g>
          ) : (
            <path d="M200 187H350" stroke="#d4d4d4" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* API Server Node */}
          <g transform="translate(350 40)">
            <rect width="210" height="170" fill="white" stroke="black" strokeWidth="1.5" />
            <rect x="0" y="0" width="210" height="22" fill="#f5f5f5" stroke="black" />
            <text x="105" y="15" fill="black" textAnchor="middle" fontSize="9" letterSpacing="1">
              FINANCIAL API SERVER
            </text>
            <text x="15" y="45" fontSize="9" fill="black">
              1. Signature Check
            </text>
            <text x="175" y="45" fontSize="9" fill="black" fontWeight="bold">
              [PASS]
            </text>
            <text x="15" y="70" fontSize="9" fill="black">
              2. Expiry Timestamp
            </text>
            <text x="175" y="70" fontSize="9" fill="black" fontWeight="bold">
              [PASS]
            </text>
            <text x="15" y="95" fontSize="9" fill="black">
              3. Sender Verification
            </text>
            <text x="175" y="95" fontSize="9" fill="black" fontWeight="bold">
              {dpopActive ? '[BOUND]' : '[NONE]'}
            </text>
            <rect x="15" y="115" width="180" height="40" fill="#f5f5f5" stroke="black" />
            <text x="105" y="130" fill="black" textAnchor="middle" fontSize="8">
              {dpopActive
                ? 'DPoP Header Verified: Proof matches client key'
                : 'Bearer Rule: Possession = Access. No IP/client check possible.'}
            </text>
            <text x="105" y="145" fill="#525252" textAnchor="middle" fontSize="8">
              RFC 6750 §1.3
            </text>
          </g>

          {/* Result Outcome */}
          <g transform="translate(580 65)">
            <rect
              width="150"
              height="120"
              fill={replayed && !dpopActive ? 'black' : 'white'}
              stroke="black"
              strokeWidth="2"
            />
            <text
              x="75"
              y="25"
              fill={replayed && !dpopActive ? 'white' : 'black'}
              textAnchor="middle"
              fontSize="9"
              letterSpacing="1"
            >
              REPLAY OUTCOME
            </text>
            <path
              d="M15 35h120"
              stroke={replayed && !dpopActive ? '#525252' : '#e5e5e5'}
            />

            {replayed && !dpopActive ? (
              <>
                <text x="75" y="60" fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">
                  200 PROCESSED
                </text>
                <text x="75" y="78" fill="#a3a3a3" textAnchor="middle" fontSize="8">
                  Attacker drains funds!
                </text>
                <text x="75" y="92" fill="white" textAnchor="middle" fontSize="8">
                  API cannot detect theft.
                </text>
              </>
            ) : replayed && dpopActive ? (
              <>
                <text x="75" y="60" fill="black" textAnchor="middle" fontSize="11" fontWeight="bold">
                  401 INVALID PROOF
                </text>
                <text x="75" y="78" fill="#525252" textAnchor="middle" fontSize="8">
                  DPoP rejected:
                </text>
                <text x="75" y="92" fill="black" textAnchor="middle" fontSize="8">
                  Missing private key proof.
                </text>
              </>
            ) : (
              <>
                <text x="75" y="60" fill="black" textAnchor="middle" fontSize="11" fontWeight="bold">
                  AWAITING ATTACK
                </text>
                <text x="75" y="78" fill="#525252" textAnchor="middle" fontSize="8">
                  Click Execute Replay
                </text>
                <text x="75" y="92" fill="black" textAnchor="middle" fontSize="8">
                  to simulate adversary.
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="border border-black p-4">
          <span className="section-label block mb-1">Bearer Reality (RFC 6750)</span>
          <p className="text-neutral-600 leading-relaxed">
            The server does not authenticate the caller; it authenticates the string. If someone gets your token, they are you.
          </p>
        </div>
        <div className="border border-black p-4 bg-neutral-50">
          <span className="section-label block mb-1">Defense (RFC 9449 DPoP)</span>
          <p className="text-neutral-600 leading-relaxed">
            DPoP forces the client to sign each request with a private key. Stolen tokens fail because the attacker lacks the private key.
          </p>
        </div>
      </div>
    </div>
  );
}

// Interactive Motion Graphic Canvas for Topic 04 (Stale Claims)
function StaleClaimsGraphic({ motionEnabled }: { motionEnabled: boolean }) {
  const [minute, setMinute] = useState(6);

  // At minute 0: Issued Admin
  // At minute 3: Demoted to Viewer in DB
  // Minute 3-15: Ghost Admin Window
  const isDemotedInDB = minute >= 3;
  const isExpired = minute >= 15;
  const isGhostWindow = isDemotedInDB && !isExpired;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="section-label">Privilege Drift Timeline Scrubber</span>
          <p className="mt-1 text-xs text-neutral-600">
            Slide the clock from 0 to 15 minutes to inspect the desynchronization between Database state and Token claims.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs border border-black px-2.5 py-1">
            T = +{minute}:00 MINS
          </span>
          <button
            type="button"
            onClick={() => setMinute(0)}
            className="border border-black p-1.5 hover:bg-black hover:text-white transition-colors"
            title="Reset to 0"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Slider Control */}
      <div className="border border-black p-5 bg-white">
        <div className="flex items-center justify-between text-[10px] section-label mb-2">
          <span>T=0: Token Issued (Admin)</span>
          <span className="font-bold">T=3: Admin Fired / Demoted in DB</span>
          <span>T=15: Token Expired</span>
        </div>
        <input
          type="range"
          min="0"
          max="16"
          step="1"
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
          className="w-full accent-black cursor-pointer h-2 bg-neutral-200"
        />
        <div className="mt-4 grid grid-cols-3 text-center text-xs border-t border-black pt-3">
          <div>
            <span className="section-label text-neutral-500 block">DB Permission</span>
            <span className="font-bold">{isDemotedInDB ? 'RESTRICTED / FIRED' : 'SUPER ADMIN'}</span>
          </div>
          <div>
            <span className="section-label text-neutral-500 block">Token Claim</span>
            <span className="font-bold">{isExpired ? 'EXPIRED' : 'role: "admin"'}</span>
          </div>
          <div className={isGhostWindow ? 'bg-black text-white p-1' : ''}>
            <span className="section-label block">API Security State</span>
            <span className="font-bold">
              {isExpired
                ? 'REJECTED (EXP)'
                : isGhostWindow
                ? 'GHOST ADMIN (EXPOSED)'
                : 'SYNCHRONIZED'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="relative border border-black bg-neutral-100 p-6 overflow-hidden">
        <div className="h-10 w-full bg-white border border-black relative flex">
          {/* Synchronized Block */}
          <div className="w-[20%] bg-neutral-200 border-r border-black flex items-center justify-center text-[9px] font-bold">
            0-3m: SYNC
          </div>
          {/* Ghost Window */}
          <div
            className="w-[75%] bg-black text-white flex items-center justify-center text-[9px] tracking-wider relative overflow-hidden"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 10px, #262626 10px, #262626 20px)',
            }}
          >
            <span className="bg-black px-2 py-0.5 border border-white">
              GHOST PRIVILEGE WINDOW (12 MINUTES OF UNCHECKED ROOT ACCESS)
            </span>
          </div>
          {/* Expired Block */}
          <div className="w-[5%] bg-neutral-300 flex items-center justify-center text-[8px]">
            EXP
          </div>

          {/* Current Needle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-black z-10 transition-all duration-75"
            style={{ left: `${Math.min(100, (minute / 16) * 100)}%` }}
          >
            <div className="absolute -top-6 -left-6 bg-black text-white text-[8px] px-1.5 py-0.5 whitespace-nowrap">
              NOW: {minute}m
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-600 leading-relaxed">
          {isGhostWindow ? (
            <span className="text-black font-medium">
              CRITICAL PRIVILEGE DRIFT: The central database revoked this user at minute 3, yet microservices only check the token signature. The user can still drop database tables, alter payroll, or export logs until minute 15!
            </span>
          ) : isExpired ? (
            <span>At minute 15, the token exp check finally fails and access is revoked.</span>
          ) : (
            <span>During the first 3 minutes, the token claims match the active database permissions.</span>
          )}
        </p>
      </div>
    </div>
  );
}

// Interactive Motion Graphic Canvas for Topic 05 (Token Bloat)
function TokenBloatGraphic({ motionEnabled }: { motionEnabled: boolean }) {
  const [claimCount, setClaimCount] = useState(12);

  // Base overhead: 150 bytes. Each claim ~ 80 bytes.
  const tokenSize = 150 + claimCount * 85;
  const cookieSize = 32;
  const microserviceHops = 8;
  const totalWireTraffic = tokenSize * microserviceHops;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="section-label">Header Weight & Mesh Amplification</span>
          <p className="mt-1 text-xs text-neutral-600">
            Simulate how enterprise scopes and roles expand header sizes across internal microservice topologies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs border border-black px-2 py-1">
            Claims in Token: {claimCount}
          </span>
        </div>
      </div>

      <div className="border border-black p-5 bg-white">
        <label className="section-label mb-2 block">Adjust Number of Embedded Claims / Roles</label>
        <input
          type="range"
          min="2"
          max="35"
          step="1"
          value={claimCount}
          onChange={(e) => setClaimCount(Number(e.target.value))}
          className="w-full accent-black cursor-pointer h-2 bg-neutral-200"
        />
        <div className="mt-4 flex justify-between text-[10px] text-neutral-500">
          <span>2 Claims (Minimal sub only)</span>
          <span>15 Claims (Standard Enterprise)</span>
          <span>35 Claims (LDAP Groups + Scopes)</span>
        </div>
      </div>

      {/* Visual Size Comparison Bars */}
      <div className="border border-black p-6 bg-white space-y-6">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Opaque Session Cookie (Session ID)</span>
            <span className="font-mono">{cookieSize} Bytes</span>
          </div>
          <div className="h-6 w-full bg-neutral-100 border border-black">
            <div
              className="h-full bg-black"
              style={{ width: `${(cookieSize / 3500) * 100}%`, minWidth: '4px' }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Current JWT Header Size</span>
            <span className="font-mono font-bold">{tokenSize} Bytes</span>
          </div>
          <div className="h-6 w-full bg-neutral-100 border border-black">
            <div
              className="h-full bg-black transition-all duration-100"
              style={{ width: `${Math.min(100, (tokenSize / 3500) * 100)}%` }}
            />
          </div>
        </div>

        {/* Microservice Multiplication Panel */}
        <div className="border-t border-black pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="border border-neutral-300 p-3">
            <span className="section-label block text-neutral-500">Inter-Service Hops</span>
            <span className="font-mono text-lg font-bold">{microserviceHops} Internal Hops</span>
          </div>
          <div className="border border-neutral-300 p-3">
            <span className="section-label block text-neutral-500">Transit Header Load</span>
            <span className="font-mono text-lg font-bold">{(totalWireTraffic / 1024).toFixed(1)} KB / req</span>
          </div>
          <div className={`border p-3 ${tokenSize > 2500 ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>
            <span className="section-label block">Proxy Buffer Risk</span>
            <span className="font-mono text-lg font-bold">
              {tokenSize > 2500 ? 'HTTP 431 RISK' : 'WITHIN BUFFER'}
            </span>
          </div>
        </div>

        {tokenSize > 2500 && (
          <div className="border border-black p-3 bg-black text-white text-xs flex items-center gap-3">
            <AlertOctagon size={16} className="shrink-0" />
            <span>
              <strong>Warning:</strong> ALB / Nginx default header limit is often 8KB. When multiple cookies and headers accompany a 3KB+ JWT, clients receive HTTP 431 (Header Fields Too Large).
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Interactive Motion Graphic Canvas for Topic 06 (Algorithm Confusion)
function AlgoConfusionGraphic({ motionEnabled }: { motionEnabled: boolean }) {
  const [exploitMode, setExploitMode] = useState<'normal' | 'none' | 'confusion'>('normal');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="section-label">Cryptographic Inversion Lab</span>
          <p className="mt-1 text-xs text-neutral-600">
            Simulate how malicious token headers manipulate vulnerable backend verifiers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExploitMode('normal')}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border border-black ${
              exploitMode === 'normal' ? 'bg-black text-white' : 'hover:bg-neutral-100'
            }`}
          >
            Normal (RS256)
          </button>
          <button
            type="button"
            onClick={() => setExploitMode('none')}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border border-black ${
              exploitMode === 'none' ? 'bg-black text-white' : 'hover:bg-neutral-100'
            }`}
          >
            alg: "none" Exploit
          </button>
          <button
            type="button"
            onClick={() => setExploitMode('confusion')}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border border-black ${
              exploitMode === 'confusion' ? 'bg-black text-white' : 'hover:bg-neutral-100'
            }`}
          >
            Key Confusion (HMAC/RSA)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Received Box */}
        <div className="border border-black p-5 bg-white">
          <span className="section-label block mb-3 font-bold">1. Attacker-Crafted Token</span>
          <div className="font-mono text-xs p-3 bg-neutral-100 border border-neutral-300 space-y-2">
            <div>
              <span className="text-neutral-500">Header:</span>
              <pre className="text-black font-bold">
                {exploitMode === 'normal'
                  ? '{\n  "alg": "RS256",\n  "typ": "JWT"\n}'
                  : exploitMode === 'none'
                  ? '{\n  "alg": "none",\n  "typ": "JWT"\n}'
                  : '{\n  "alg": "HS256", // TAMPERED TO HMAC\n  "typ": "JWT"\n}'}
              </pre>
            </div>
            <div>
              <span className="text-neutral-500">Payload:</span>
              <pre className="text-black">{`{ "sub": "attacker", "role": "admin" }`}</pre>
            </div>
            <div>
              <span className="text-neutral-500">Signature:</span>
              <p className="text-black font-mono break-all text-[10px]">
                {exploitMode === 'normal'
                  ? 'valid_rsa_signature_from_auth_server'
                  : exploitMode === 'none'
                  ? '(EMPTY - STRIPPED BY ATTACKER)'
                  : 'hmac_signed_with_server_public_key'}
              </p>
            </div>
          </div>
        </div>

        {/* Verifier Decisions */}
        <div className="border border-black p-5 bg-white space-y-4">
          <span className="section-label block font-bold">2. Verifier Reaction</span>

          <div className="border border-black p-4 bg-neutral-50">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold">Naive Verifier (Trusts Header)</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 border ${
                  exploitMode === 'normal' ? 'border-black' : 'bg-black text-white border-black'
                }`}
              >
                {exploitMode === 'normal' ? 'VERIFIED' : 'VULNERABILITY EXPLOITED'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-normal">
              {exploitMode === 'normal'
                ? 'Reads alg: RS256, verifies RSA signature against public key. Passes.'
                : exploitMode === 'none'
                ? 'Reads alg: none, skips signature check entirely! Grants admin privileges without checking anything.'
                : 'Reads alg: HS256, uses server RSA public key as HMAC secret string. Verification mathematically passes! Complete compromise.'}
            </p>
          </div>

          <div className="border border-black p-4 bg-black text-white">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold">Hardened Verifier (RFC 8725 BCP)</span>
              <span className="text-[9px] px-1.5 py-0.5 border border-white">
                {exploitMode === 'normal' ? 'VERIFIED' : 'ATTACK BLOCKED'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-normal">
              {exploitMode === 'normal'
                ? 'Strictly pins algorithms: ["RS256"]. Validates correctly.'
                : exploitMode === 'none'
                ? 'Explicitly bans alg: none. Throws 401 Unauthorized.'
                : 'Server refuses to use HMAC when configured with an asymmetric RSA key. Throws 403 Forbidden.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrickyGraphic({ motionEnabled }: { motionEnabled: boolean }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');

  const activeTopic = TRICKY_TOPICS[activeTab];

  // Auto-cycle through tricky points if isPlaying is enabled
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % TRICKY_TOPICS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="mt-16 border-t-4 border-black pt-12">
      {/* Editorial Section Intro */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-black pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="section-label">THE VULNERABILITY DOSSIER</span>
            <span className="size-2 bg-black" />
            <span className="section-label text-neutral-500">6 CRITICAL FAILURE MODES</span>
          </div>
          <h3 className="font-display text-[clamp(36px,5vw,68px)] leading-[1.05] tracking-tight">
            Where JWT <span className="italic">breaks down.</span>
          </h3>
        </div>
        <p className="max-w-[480px] text-xs leading-6 text-neutral-600">
          Stateless tokens are not a drop-in replacement for server sessions. Examine the six deepest operational traps, security blindspots, and architectural trade-offs.
        </p>
      </div>

      {/* Kinetic Typography Marquee Ribbon */}
      <div
        className="mb-10 border-y-2 border-black bg-black py-3 text-white overflow-hidden relative"
        aria-hidden="true"
      >
        <div className="whitespace-nowrap flex gap-8 font-mono text-xs uppercase tracking-[0.2em] animate-none">
          <span>✦ STATELESS VERIFICATION ⇄ IMPOSSIBLE REVOCATION</span>
          <span>✦ ENCODED IN PLAINTEXT ⇄ CONFIDENTIAL CIPHERTEXT</span>
          <span>✦ BEARER POSSESSION ⇄ SENDER BINDING</span>
          <span>✦ FROZEN CLAIMS ⇄ PERMISSION DRIFT</span>
          <span>✦ PACKET WEIGHT ⇄ NETWORK LATENCY</span>
          <span>✦ CLIENT-CHOSEN ALG ⇄ STRICT ALLOWLIST</span>
        </div>
      </div>

      {/* Navigation Index Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-l border-black">
        {TRICKY_TOPICS.map((topic, index) => {
          const isActive = index === activeTab;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => {
                setActiveTab(index);
                setIsPlaying(false);
              }}
              className={`p-4 border-r border-b border-black text-left transition-colors duration-100 flex flex-col justify-between min-h-[90px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black ${
                isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-bold">{topic.number}</span>
                {isActive && <span className="size-1.5 bg-white" />}
              </div>
              <div>
                <span className="block font-medium text-xs tracking-tight uppercase">
                  {topic.title}
                </span>
                <span
                  className={`text-[9px] block truncate ${
                    isActive ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {topic.tagline}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Master Display Stage */}
      <div className="mt-8 border-2 border-black bg-white">
        {/* Stage Header */}
        <div className="p-6 md:p-8 border-b-2 border-black bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="size-7 flex items-center justify-center bg-black text-white font-mono text-xs font-bold">
                {activeTopic.number}
              </span>
              <span className="section-label">{activeTopic.badge}</span>
              <span className="text-neutral-300">/</span>
              <span className="font-mono text-[10px] text-neutral-500">{activeTopic.rfc}</span>
            </div>

            {/* Stage Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 border border-black px-3 py-1.5 text-[10px] uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                <span>{isPlaying ? 'Pause Tour' : 'Auto Tour'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveTab((prev) => (prev === 0 ? TRICKY_TOPICS.length - 1 : prev - 1))
                }
                className="border border-black p-1.5 hover:bg-black hover:text-white transition-colors"
                aria-label="Previous topic"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab((prev) => (prev + 1) % TRICKY_TOPICS.length)}
                className="border border-black p-1.5 hover:bg-black hover:text-white transition-colors"
                aria-label="Next topic"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <h4 className="font-display text-[clamp(28px,3.8vw,52px)] leading-[1.08] tracking-tight">
            {activeTopic.headline}
          </h4>
          <p className="mt-4 max-w-[850px] text-xs md:text-sm leading-relaxed text-neutral-600">
            {activeTopic.subhead}
          </p>
        </div>

        {/* Interactive Motion Graphic Subcomponent */}
        <div className="p-6 md:p-8 bg-neutral-50 border-b-2 border-black grid-pattern">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic.id}
              initial={motionEnabled ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={motionEnabled ? { opacity: 0, y: -8 } : undefined}
              transition={{ duration: 0.15 }}
            >
              {activeTopic.id === 'revocation' && <RevocationGraphic motionEnabled={motionEnabled} />}
              {activeTopic.id === 'transparency' && (
                <TransparencyGraphic motionEnabled={motionEnabled} />
              )}
              {activeTopic.id === 'bearer' && <BearerGraphic motionEnabled={motionEnabled} />}
              {activeTopic.id === 'stale' && <StaleClaimsGraphic motionEnabled={motionEnabled} />}
              {activeTopic.id === 'bloat' && <TokenBloatGraphic motionEnabled={motionEnabled} />}
              {activeTopic.id === 'algorithms' && (
                <AlgoConfusionGraphic motionEnabled={motionEnabled} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Explanation Depth Toggle Ribbon */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-6 md:px-8 py-3 bg-neutral-100 border-b border-black">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-black" />
            <span className="font-mono text-xs uppercase font-bold tracking-wider">
              {viewMode === 'simple'
                ? 'EXPLANATION: SIMPLE POINTS (FAST READ)'
                : 'EXPLANATION: FULL TECHNICAL SPECIFICATION'}
            </span>
          </div>
          <div className="flex border border-black bg-white">
            <button
              type="button"
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'simple' ? 'bg-black text-white' : 'hover:bg-neutral-100 text-black'
              }`}
            >
              Simple Points (Fast)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('technical')}
              className={`px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors border-l border-black ${
                viewMode === 'technical' ? 'bg-black text-white' : 'hover:bg-neutral-100 text-black'
              }`}
            >
              Full RFC Audit
            </button>
          </div>
        </div>

        {/* 3-Card Grid: Renders Simple Points or Deep Technical Audit */}
        {viewMode === 'simple' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-black bg-white">
            {/* Simple Card 1: The Mistake */}
            <div className="p-6 md:p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="size-2 bg-black" />
                  <span className="section-label font-bold">01 / THE COMMON MISTAKE</span>
                </div>
                <h5 className="font-bold text-sm mb-2 font-display text-base">What people assume</h5>
                <p className="text-xs leading-relaxed text-neutral-700">
                  {activeTopic.simple.mistake}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                The Misconception
              </div>
            </div>

            {/* Simple Card 2: The Danger */}
            <div className="p-6 md:p-8 flex flex-col justify-between bg-neutral-50">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={14} strokeWidth={1.5} />
                  <span className="section-label font-bold">02 / WHAT BREAKS</span>
                </div>
                <h5 className="font-bold text-sm mb-2 font-display text-base">The real-world danger</h5>
                <p className="text-xs leading-relaxed text-neutral-700">
                  {activeTopic.simple.danger}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                Security &amp; Uptime Risk
              </div>
            </div>

            {/* Simple Card 3: The Clean Fix */}
            <div className="p-6 md:p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Check size={14} strokeWidth={2} />
                  <span className="section-label font-bold">03 / THE CLEAN FIX</span>
                </div>
                <h5 className="font-bold text-sm mb-2 font-display text-base">How to solve it cleanly</h5>
                <p className="text-xs leading-relaxed text-neutral-700 mb-4">
                  {activeTopic.simple.fix}
                </p>
                {activeTopic.simple.fixCode && (
                  <div className="bg-black text-white p-3 font-mono text-[10px] leading-relaxed overflow-x-auto border border-neutral-800">
                    <pre>{activeTopic.simple.fixCode}</pre>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                Recommended Solution
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-black bg-white">
            {/* Card 1: The Trap */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="size-2 bg-black" />
                  <span className="section-label">THE ARCHITECTURAL TRAP</span>
                </div>
                <h5 className="font-bold text-sm mb-3">{activeTopic.trap.title}</h5>
                <p className="text-xs leading-relaxed text-neutral-600">
                  {activeTopic.trap.description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-widest">
                Design Misconception
              </div>
            </div>

            {/* Card 2: The Failure Mode */}
            <div className="p-6 md:p-8 flex flex-col justify-between bg-neutral-50">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={14} strokeWidth={1.5} />
                  <span className="section-label">SYSTEMIC FAILURE MODE</span>
                </div>
                <h5 className="font-bold text-sm mb-3">{activeTopic.failure.title}</h5>
                <p className="text-xs leading-relaxed text-neutral-600">
                  {activeTopic.failure.description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-widest">
                Production Incident Risk
              </div>
            </div>

            {/* Card 3: The Mitigation */}
            <div className="p-6 md:p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Check size={14} strokeWidth={2} />
                  <span className="section-label">HARDENED MITIGATION</span>
                </div>
                <h5 className="font-bold text-sm mb-3">{activeTopic.mitigation.title}</h5>
                <p className="text-xs leading-relaxed text-neutral-600 mb-4">
                  {activeTopic.mitigation.description}
                </p>
                {activeTopic.mitigation.code && (
                  <div className="bg-black text-white p-3 font-mono text-[10px] leading-relaxed overflow-x-auto">
                    <pre>{activeTopic.mitigation.code}</pre>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-widest">
                Industry Standard Defense
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

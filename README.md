# JWT & Redis Sessions, decoded.

A dual scroll-driven visual field guide exploring the two fundamental paradigms of modern web identity:
- **JWT (Client-Side Proof)**: White page, decentralized cryptographic verification, claims travel with the browser.
- **Redis Sessions (Server-Side Control)**: Black page, centralized in-memory state, random opaque IDs, instant revocation.

Built with **React, TypeScript, Vite, Tailwind CSS, GSAP ScrollTrigger, and Framer Motion**. The design adheres to a strict **Minimalist Monochrome** system: Playfair Display serif headlines, JetBrains Mono body typography, sharp 90-degree corners (0px radius), zero drop shadows, and responsive technical diagrams.

Click the logo in the header or the `[JWT] / [REDIS]` pill to flip between both learning experiences.

---

## Run locally

Use **Node.js 24 or newer** and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173`.

```sh
npm test          # 32 unit tests (crypto, validation, JWE, and Redis session simulator)
npm run typecheck # strict TypeScript checks (0 errors)
npm run build    # production build
npm run preview  # serve production build locally
```

---

## 1. The JWT Experience (Client Proof — White Page)

1. **The Journey** — Login request reaches the issuer; a signed token returns.
2. **Three Parts** — Compact representation: Header, Payload, and Signature.
3. **Encoding** — JSON becomes UTF-8 bytes and Base64url text.
4. **Signing** — HMAC-SHA256 signs the combined message with a server secret.
5. **Encryption** — Five-part JWE envelope with real AES-256-GCM authenticated encryption.
6. **Verification** — Inside the API: signature check, claims validation, and endpoint permissions.
7. **Expiry** — Timers and the boundary of validity (`exp`).
8. **JWT Debugger (`/debugger`)** — Interactive Decoder & Encoder workbench.
9. **Where it Gets Tricky (The Vulnerability Dossier)** — 6 in-depth motion graphics covering:
   - *01 / Revocation Paradox* (Stateless verification vs. blacklists)
   - *02 / Transparency* (Encoded ≠ Encrypted)
   - *03 / Bearer Replay* (Possession = Identity, RFC 9449 DPoP)
   - *04 / Stale Claims* (The Demotion Gap)
   - *05 / Token Bloat* (Network overhead and HTTP 431)
   - *06 / Algo Confusion* (Cryptographic misconfiguration)

---

## 2. The Redis Experience (Server Control — Black Page)

Accessed at `/sessions` or by clicking the logo from the JWT page.

1. **Why Sessions Exist** — JWT carries claims; a session carries only an unguessable 128-bit random ticket ID.
2. **Login Creates a Session** — Browser → Login server → Password hash check → Session creation. Credentials never enter Redis.
3. **Redis Stores the State** — `session:8f4a91...` key created in RAM, mapping to user ID and role with a live TTL countdown.
4. **The Cookie Returns** — The server places the opaque ID in a cookie with four defensive flags: `HttpOnly`, `Secure`, `SameSite=Lax`, and `Max-Age`.
5. **Every Request Performs a Lookup** — Browser cookie → API → Redis RAM lookup → Permission check.
6. **Many Servers, One Store** — Load balancer fans out requests across Server A, B, and C reading the same Redis cluster.
7. **Expiry, Renewal, and Logout** — Active (TTL > 0), Expired (automatic key eviction), and Instant Logout (`DEL session:id` destroys access immediately).

### Redis Interactive Console (`/sessions#playground`)

A 3-panel connected simulation:
- **Panel 01: Browser Cookie Jar** — Inspect active cookie flags (`HttpOnly`, `Secure`, `SameSite`).
- **Panel 02: API Server Validator** — Trace incoming request parsing, Redis lookup, and permission enforcement.
- **Panel 03: Redis Memory Records** — Live keyspace inspection with real-time TTL countdowns.
- **Controls**: Log in, Advance clock (+5m / +30m), Extend TTL (sliding window), Instant Logout (DEL), Stolen Cookie simulation, and Redis Outage failure testing.
- **Audit Log**: Plain-language timestamped event trace.

---

## JWT vs. Redis Sessions Comparison

| Feature | Signed JWT (Client-Side) | Redis Session (Server-Side) |
|---|---|---|
| **What does browser hold?** | Claims and signature | Random opaque session ID |
| **Where is state stored?** | Distributed in client string | Centralized in Redis RAM |
| **Lookup on every request?** | Usually no (<0.1ms math check) | Yes (sub-millisecond RAM read) |
| **Instant revocation?** | Complex (requires blocklists) | Immediate (`DEL session:id`) |
| **Client can read contents?** | Yes (standard Base64url) | No (points to nothing on client) |
| **If shared store fails?** | APIs continue validating tokens | Session requests fail |
| **Best fit** | Microservices, mobile edge, public APIs | Dashboards, banking, central control |

> **"JWT moves proof. Redis sessions keep control."**

---

## Source Map

```text
src/
  App.tsx                            Dual-experience routing (/ and /sessions)
  index.css                          Monochrome theme tokens, grid and line patterns
  components/
    Navigation.tsx                   Header with logo flip transition & switcher pill
    Story.tsx                        JWT editorial scroll story and Field Notes
    TrickyGraphic.tsx                6-scenario kinetic vulnerability dossier
    Diagrams.tsx                     SVG graphics & GSAP scroll timelines for JWT
    EncryptionLab.tsx                AES-256-GCM JWE laboratory
    DebuggerPage.tsx                 JWT Decoder and Encoder workbench
    LoginPage.tsx                    Animated interactive login simulator with sliding drawer
    AuthNetworkDiagram.tsx           Enterprise 42U server rack & packet transport visualization
    sessions/
      SessionsPage.tsx               Dark-theme Redis sessions layout
      SessionHero.tsx                Redis sessions hero with live server diagram
      SessionStory.tsx               7 server-side chapters with sticky graphics
      SessionDiagram.tsx             Dark-theme SVG & GSAP scroll diagrams
      SessionPlayground.tsx          3-panel interactive Redis inspection console
      SessionComparison.tsx          Definitive comparison matrix & pros/cons
  content/
    chapters.ts                      JWT chapter definitions
    sessionChapters.ts               Redis sessions chapter definitions
  lib/
    jwt.ts                           Base64url, HMAC-SHA256, claim verification
    jwe.ts                           AES-GCM encryption & decryption
    debugger.ts                      Generic debugger utilities
    sessionSimulation.ts             In-memory Redis session state simulator
    sessionSimulation.test.ts        8 unit tests for session lifecycles
```

---

## References

- [JWT — RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
- [JWS — RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)
- [JWE — RFC 7516](https://www.rfc-editor.org/rfc/rfc7516)
- [JWT Security Guidance — RFC 8725](https://www.rfc-editor.org/rfc/rfc8725)
- [HTTP State Management (Cookies) — RFC 6265](https://httpwg.org/specs/rfc6265.html)
- [OAuth 2.0 DPoP — RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)

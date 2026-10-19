# JWT, decoded — design specification

## Purpose and constraints

Build a local React + Vite educational website explaining signed JWTs through scroll-driven motion graphics and experiments. The user has approximately 3–4 hours for the hackathon project. The attached design brief specifies an editorial monochrome system: white and black, serif display typography, monospace technical labels, sharp corners, strong rules, subtle paper/grid textures, and generous whitespace.

The user's explicit request for smooth GSAP scroll animation and Framer Motion overrides the attachment's restrictions on animation. No deployment, login, database, or account system is required. This is an educational simulation; sample users and signing keys are public demonstration data.

The user approved this specification with two additions: use a mono font and simple words, and finish with the pros and cons of JWTs. Use JetBrains Mono for body text, explanations, controls, labels, and code; keep Playfair Display for the oversized editorial titles. Define necessary technical terms in place. Avoid academic vocabulary and unexplained security jargon.

## Agreed experience

The proposed six-chapter storyboard is retained. The user's requested addition makes server-side graphics a central part of the experience: browser and server illustrations, animated token packets and arrows, and a server interior that reveals its checks.

### Opening

A typography-led hero reading “JWT, decoded.” introduces a visual field guide to how a token earns trust. A detailed line illustration depicts a client, an issuer/server, directed request paths, and a moving three-part token. Links lead to the story and playground. A chapter index and progress indicator make the long-form lesson navigable.

### 01 — A request needs an identity

Show a simulated user sending credentials to an authentication server. Scroll advances the request along a labelled arrow. The issuer validates the sample credentials and creates claims. Returned token packets travel to the browser. Distinguish issuing a token from authenticating a real account: this flow uses public sample data only.

### 02 — Three parts, one token

The token separates into header, payload, and signature. Large outlined segments, dotted connectors, JSON previews, and short annotations map each part to its meaning. Signed compact JWTs use three parts. Explicitly distinguish signed JWS from encrypted JWE; do not imply all JWTs have exactly three parts.

### 03 — Encoded, not hidden

Scroll moves JSON through UTF-8 bytes into Base64url text. A small editable text encoder exposes the exact reversible transformation, supports Unicode, and makes clear that anyone holding a signed token can read its payload.

### 04 — The issuer signs

Open the server illustration. The encoded header and payload feed an HMAC-SHA256 block; a separate secret-key arrow enters from inside the server boundary. The resulting 32 bytes become a 43-character Base64url signature. Assemble the three-part token and send it back to the browser. Use HS256 for the working example and briefly compare shared-secret verification with RS256 public-key verification.

### 05 — Inside the API

Animate the browser sending an Authorization: Bearer request to an API. Open the API/server to reveal a pipeline: permitted algorithm and trusted key; signature verification over the exact received encoded segments; required issuer/audience/time claims; permission for the endpoint. Label decoding, validation, and authorization distinctly. Show a visible accepted/rejected response returning to the browser.

### 06 — Trust has a lifetime

An expiry timeline shows a token with a valid signature becoming expired. Explain bearer-token replay, access versus refresh tokens, and why deleting a local token does not revoke other copies. Explain that revocation and current account checks require server mechanisms. Finish with direct links to the relevant JWT/JWS standards.

## Interactive token laboratory

Use genuine Web Crypto HMAC-SHA256 signing and verification in a clearly labelled browser-local server simulation. The demo key remains in the simulated issuer/verifier logic and is public sample material; explicitly explain that production signing keys belong on a server. No real credentials or real tokens are requested.

Provide a freshly issued student token with issuer, audience, subject, role, issued-at and expiry claims. Controls allow:

- Edit the payload JSON while retaining the existing signature.
- Tamper with role through a one-click preset and observe signature failure.
- Issue a new student token and recover the default state.
- Advance the simulated clock past expiry without changing the token.
- Issue a correctly signed token for a different audience.
- Choose a profile or admin endpoint to expose authorization failure independently from signature and claims validity.
- Inspect the full token, decoded parts, signing input, expected signature, and a check-by-check verification trace.
- Copy the token with explicit success/failure feedback.

Check results must reflect actual crypto and state, not predetermined success labels. Invalid JSON, malformed encoding, unsupported algorithms, and unavailable crypto must have understandable error states. Asynchronous results must not overwrite more recent edits.

## Motion and layout

Use GSAP ScrollTrigger timelines for scrubbed SVG paths, packet travel, token separation/assembly, and server-stage transitions. Scrolling upward reverses the teaching sequence. Avoid scroll hijacking. Narrative text remains accessible in normal document flow; sticky illustrations accompany the lesson on desktop. Framer Motion handles laboratory state transitions and restrained entrance animations without competing for GSAP-controlled properties.

Use a persistent slim header, chapter navigation, and a progress rail. Responsive layouts stack text and graphics. Mobile diagrams remain legible without horizontal page overflow. Reduced-motion mode presents static complete diagrams and direct state changes, and also supports an explicit motion toggle. All actions work by keyboard; labels, visible focus, minimum touch targets, live result announcements, and semantic headings are required.

## Final pros and cons

After the laboratory, include the final learning section, “Where JWT helps. Where it gets tricky.” Show benefits and limits in two clear columns, stacking on mobile. Benefits: an API can verify signed claims locally; several services can use an issuer's tokens; expiry and audience can be carried with identity. Limits: a signed payload is readable; stolen bearer tokens can be reused; logout and changing permissions need extra server checks for immediate effect; tokens add request size and careful key/claim checks are essential. Explain that JWTs are a useful choice for some systems and not a replacement for every session design. Include no fabricated speed claims or blanket claims of better security.

## Implementation boundaries

- React + Vite, TypeScript modules, Tailwind CSS utilities and shared theme tokens.
- Dependencies: gsap, framer-motion, lucide-react; other dependencies only if necessary.
- Components separate the navigation, story/chapter content, SVG diagrams, and interactive laboratory.
- Framework-independent JWT helpers support encoding, parsing, signing, verification, claims checks, and endpoint authorization.
- Bundle fonts locally when feasible so the local demo is dependable.
- No external API, generated photographs, authentication provider, backend service, or deployment required.

## Verification and acceptance

- Production build completes.
- Crypto checks cover a known HMAC fixture, Unicode encoding roundtrip, valid token, payload tamper, expiry boundary, wrong audience, unsupported algorithm, malformed token, and a valid student token rejected by the admin permission check.
- Browser QA checks initial composition, at least one mid-scroll server diagram, the final laboratory, desktop and mobile widths, reduced motion, and absence of runtime errors or horizontal overflow.
- Functional browser QA verifies tamper/reissue, expiry/reissue, wrong-audience failure, authorization failure, JSON error recovery, and copy feedback when available.
- Local preview opens in the user's Codex browser panel; README includes install, run, build, and the public-demo-key limitation.

## Scope control

Prioritize the core narrative, server graphics, and real interactive verification. Full OAuth/OIDC flows, production refresh-token rotation, and live backend authentication are out of scope. Explanations acknowledge those boundaries rather than simulate unsupported guarantees.


## Approved additions during implementation
The user requested TypeScript and Tailwind CSS instead of JavaScript and authored layout CSS, a working encryption/decryption section in the middle, and a push to https://github.com/divi912/Velocity-Hackathon-GDNU-JWT.git. The story now has seven chapters; encryption sits between signing and API verification. Use a real compact JWE wrapper with direct A256GCM encryption around the signed token. Actual encryption is now in scope; a production backend and deployment remain out of scope.

## Final user-directed changes

The user replaced the inline token laboratory with a JWT.io-style debugger on its own `/debugger` page. This final requirement supersedes the earlier inline laboratory description. The story links to the debugger and ends with pros and cons. The debugger has Decoder and Encoder modes, generic readable token inspection, separate signature and time statuses, editable JSON for generation, an editable shared secret, Base64url key mode, copy/clear/load-example actions, and plain-language claim explanations. It supports HS256 explicitly; it does not pretend to verify unsupported algorithms or decide API permissions. Results are tied to their exact token/key inputs so older success results disappear immediately when inputs change.

The user also requested a complete signing output graphic. The signing scene now follows HMAC and Base64url signature creation with assembly of a complete tested example token, showing separate underlines and labels for the header, payload, and signature. Phone layouts provide a native modal enlarged view for full-size diagram labels. The static expiry diagram places its clock after expiry to match its expired result.

# JWT, decoded.

A scroll-driven visual guide to JSON Web Tokens. Follow requests from a browser into a server, watch a token take shape, and try changing it yourself.

Built with **React, TypeScript, Vite, Tailwind CSS, GSAP ScrollTrigger, and Framer Motion**. The design is black and white, with Playfair Display titles and JetBrains Mono body text. Fonts are bundled locally.

## Run locally

Use **Node.js 24 or newer** and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173`.

```sh
npm test          # signing, validation, encoding, and encryption tests
npm run typecheck # strict TypeScript checks
npm run build    # TypeScript checks and production build
npm run preview  # serve the production build locally
```

## The lesson

1. **The journey** — a login request reaches the issuer; a token returns.
2. **Three parts** — the signed token separates into header, payload, and signature.
3. **Encoding** — JSON becomes bytes and Base64url text. Try the live text encoder.
4. **Signing** — the encoded message and server secret feed HMAC-SHA256.
5. **Encryption** — a signed token goes into a five-part JWE envelope. Encrypt and decrypt it using real AES-256-GCM.
6. **Verification** — open the API server to see signature, claim, and permission checks.
7. **Expiry** — move beyond `exp` while the signature stays valid.
8. **Playground** — edit claims, change routes, move the clock, and inspect the exact rejection reason.
9. **Pros and cons** — where JWTs help and what still needs care.

Scroll down to play the diagrams and up to reverse them. The motion control in the header switches to complete static diagrams. The site also respects the operating system's reduced-motion preference.

## Working experiments

- **Make me admin:** changes the payload but keeps the old signature; signature verification fails.
- **Expire the token:** advances a simulated server clock; the signature passes and the time check fails.
- **Use the wrong API:** issues a correctly signed token for a different audience; the audience check fails.
- **Request `/admin`:** a valid student token passes validation but fails the permission check.
- **Look under the hood:** inspect or edit the full token, compare the expected and supplied signatures, and view the original signing input.
- **Encrypt / Decrypt:** wrap a signed JWT with compact JWE using direct key mode and AES-256-GCM, then decrypt and verify the inner signature.

## Important demo boundary

This is a **browser-local server simulation**, not a real login service. It uses actual Web Crypto operations with intentionally public sample keys. Production signing keys and private decryption keys must stay on a server. Do not use these sample keys in an application or paste real tokens into the demo.

The working signature example uses HS256. The encryption example uses `alg: dir`, `enc: A256GCM`, and `cty: JWT`; the encrypted-key segment is empty in direct key mode. A fresh random 96-bit IV is generated for every encryption, and a 128-bit authentication tag detects changes. The lab's issuer, audience, required claims, time policy, and route permissions are explicitly defined for this example.

JWT is a format, not a whole authentication protocol. OAuth/OIDC, real refresh-token rotation, key rotation, and server-side revocation are explained only at a high level and are not implemented as production services.

## Source map

```text
src/
  App.tsx                   Page and motion preferences
  components/
    Navigation.tsx          Navigation and reading progress
    Story.tsx               Editorial layout and lesson text
    Diagrams.tsx            SVG graphics and GSAP scroll timelines
    EncryptionLab.tsx       Working encryption/decryption experiment
    TokenLab.tsx            Editable token and API check trace
  content/chapters.ts        Seven plain-language chapters
  lib/
    jwt.ts                  Base64url, HS256, claim checks, permissions
    jwe.ts                  AES-GCM compact encrypted envelopes
    *.test.ts               Tests using real cryptographic operations
  index.css                 Tailwind entry, fonts, theme, base rules
```

## References

- [JWT — RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
- [JWS — RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)
- [JWE — RFC 7516](https://www.rfc-editor.org/rfc/rfc7516)
- [Algorithms — RFC 7518](https://www.rfc-editor.org/rfc/rfc7518)
- [JWT security guidance — RFC 8725](https://www.rfc-editor.org/rfc/rfc8725)

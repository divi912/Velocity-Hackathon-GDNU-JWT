export type SessionDiagramKind =
  | 'why-sessions'
  | 'login-journey'
  | 'redis-storage'
  | 'cookie-wrapper'
  | 'request-lookup'
  | 'distributed-store'
  | 'lifecycle-logout';

export interface SessionChapter {
  id: string;
  number: string;
  title: string;
  label: string;
  kind: SessionDiagramKind;
  lead: string;
  body: string;
  takeaway: string;
}

export const sessionChapters: SessionChapter[] = [
  {
    id: 'why-sessions',
    number: '01',
    label: 'Why sessions exist',
    kind: 'why-sessions',
    title: 'The proof stays home.\nOnly the key travels.',
    lead: 'JWT carries user information. A session carries only a random ID.',
    body: 'With a signed token, the browser holds your claims and transmits them across the web. With a session, all facts about you stay tucked inside server memory. The browser holds only an unguessable ticket number.',
    takeaway: 'A JWT is a passport full of stamps. A session ID is a cloakroom ticket.',
  },
  {
    id: 'login-journey',
    number: '02',
    label: 'Login creates a session',
    kind: 'login-journey',
    title: 'Check once.\nNever store credentials in Redis.',
    lead: 'Browser → Login server → Password check → Create session.',
    body: 'The browser sends its email and password once over TLS. The server checks the password hash in the primary user database. Once verified, the server creates a new session. Your credentials disappear immediately—they never touch Redis.',
    takeaway: 'Passwords belong in salted database hashes, not in caching layers.',
  },
  {
    id: 'redis-storage',
    number: '03',
    label: 'Redis stores the state',
    kind: 'redis-storage',
    title: 'Redis remembers.\nThe browser holds a ticket.',
    lead: 'The server stores a record behind session:8f4a91... with a live countdown.',
    body: 'The server creates a cryptographically random string. Inside Redis, that key points to your user ID, role, and creation timestamp. A Time-To-Live (TTL) countdown ticks away in memory.',
    takeaway: 'Redis knows the user. The browser only knows the session ID.',
  },
  {
    id: 'cookie-wrapper',
    number: '04',
    label: 'The cookie returns',
    kind: 'cookie-wrapper',
    title: 'A sealed envelope.\nBack to the browser.',
    lead: 'Set-Cookie: sid=8f4a91...; HttpOnly; Secure; SameSite=Lax',
    body: 'The server wraps the opaque ID in a cookie header. HttpOnly stops JavaScript from touching it. Secure forces HTTPS. SameSite blocks cross-site attacks. Max-Age matches the server TTL.',
    takeaway: 'User claims stay safely inside the server boundary.',
  },
  {
    id: 'request-lookup',
    number: '05',
    label: 'Every request performs a lookup',
    kind: 'request-lookup',
    title: 'Every request.\nA fresh check in memory.',
    lead: 'Browser cookie → API → Redis lookup → Session data → Permission check.',
    body: 'On each HTTP request, the API extracts the sid cookie and queries Redis in sub-millisecond memory. It verifies the session still exists, reads the user role, and allows or denies the endpoint.',
    takeaway: 'Possessing a session ID proves nothing until Redis confirms the record.',
  },
  {
    id: 'distributed-store',
    number: '06',
    label: 'Many servers, one store',
    kind: 'distributed-store',
    title: 'Ten servers.\nOne shared brain.',
    lead: 'A load balancer distributes requests across Server A, B, and C.',
    body: 'Because all API instances read from the same Redis cluster, request 1 can hit Server A and request 2 can hit Server C seamlessly. If Redis goes down without high availability, session checks cannot finish.',
    takeaway: 'Centralization gives instant consistency—and a single point of failure.',
  },
  {
    id: 'lifecycle-logout',
    number: '07',
    label: 'Expiry and logout',
    kind: 'lifecycle-logout',
    title: 'Instant revocation.\nTrue logout.',
    lead: 'Active, expired, or revoked on command.',
    body: 'Three outcomes: Active (TTL > 0), Expired (Redis removes the key, next request gets 401), or Logout (server deletes the key immediately). When deleted, the client cookie instantly points to empty space.',
    takeaway: 'Deleting the Redis record invalidates access across every device immediately.',
  },
];

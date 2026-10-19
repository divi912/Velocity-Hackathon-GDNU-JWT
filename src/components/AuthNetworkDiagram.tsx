import { motion } from 'framer-motion';
import { Shield, Lock, Server, Cpu, Database, Globe, Key, Zap, Check, AlertCircle } from 'lucide-react';

interface AuthNetworkDiagramProps {
  paradigm: 'jwt' | 'redis';
  isDark: boolean;
  currentStep: number;
  isProcessing: boolean;
  activeUser: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  jwtToken: string | null;
  redisSession: {
    sid: string;
    cookie: string;
    ttl: number;
  } | null;
  subsequentResponse: {
    status: number;
    text: string;
    latency: string;
    lookupMade: boolean;
  } | null;
  interactiveAction: 'idle' | 'request' | 'revocation';
  motionEnabled: boolean;
}

export function AuthNetworkDiagram({
  paradigm,
  isDark,
  currentStep,
  isProcessing,
  activeUser,
  jwtToken,
  redisSession,
  subsequentResponse,
  interactiveAction,
  motionEnabled,
}: AuthNetworkDiagramProps) {
  const isRevoked = subsequentResponse?.status === 401 && interactiveAction === 'revocation';
  const isRequestActive = interactiveAction === 'request' || isProcessing;

  const strokeColor = isDark ? '#ffffff' : '#000000';
  const mutedStroke = isDark ? '#404040' : '#d4d4d4';
  const subtextColor = isDark ? '#a3a3a3' : '#737373';
  const panelBg = isDark ? '#0d0d0d' : '#f9f9f9';
  const activeBg = isDark ? '#1a1a1a' : '#efefef';
  const accentFill = isDark ? '#ffffff' : '#000000';
  const accentText = isDark ? '#000000' : '#ffffff';

  return (
    <div className="w-full my-6 border-2 border-current p-4 md:p-6 bg-transparent">
      {/* Schematic Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-current font-mono text-[10px]">
        <div className="flex items-center gap-2">
          <span className="size-2 bg-current animate-pulse" />
          <span className="font-bold tracking-widest uppercase">
            ARCHITECTURAL BLUEPRINT · {paradigm === 'jwt' ? 'JWT STATELESS CLUSTER' : 'REDIS ENTERPRISE RACK'}
          </span>
        </div>
        <div className="flex items-center gap-4 opacity-70">
          <span>PORT 443 (HTTPS)</span>
          <span>·</span>
          <span>PROTOCOL: TLS 1.3</span>
          <span>·</span>
          <span>TOPOLOGY: DISTRIBUTED</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox="0 0 900 370"
          className="w-full min-w-[760px] h-auto select-none"
          style={{ maxHeight: '420px' }}
          aria-label="Browser to Server Rack Architecture Diagram"
        >
          <defs>
            {/* Grid Pattern for blueprint texture */}
            <pattern id="rackGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={mutedStroke} strokeWidth="0.5" opacity="0.3" />
            </pattern>
            {/* Arrowhead marker */}
            <marker id="arrowRight" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={strokeColor} />
            </marker>
            <marker id="arrowLeft" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
              <path d="M6,0 L6,6 L0,3 z" fill={strokeColor} />
            </marker>
          </defs>

          {/* Background subtle grid */}
          <rect x="0" y="0" width="900" height="370" fill="url(#rackGrid)" opacity="0.6" />

          {/* ========================================================================= */}
          {/* SECTION 1: DETAILED BROWSER WINDOW (X: 20 to 280, Y: 20 to 340)          */}
          {/* ========================================================================= */}
          <g transform="translate(20 20)">
            {/* Browser Shadow / Double Border */}
            <rect x="3" y="3" width="260" height="320" fill="none" stroke={mutedStroke} strokeWidth="1" />
            {/* Outer Browser Window Frame */}
            <rect x="0" y="0" width="260" height="320" fill={panelBg} stroke={strokeColor} strokeWidth="1.5" />

            {/* Title Bar */}
            <rect x="0" y="0" width="260" height="28" fill={activeBg} stroke={strokeColor} strokeWidth="1.5" />
            {/* Window Controls (Monochrome Squares) */}
            <rect x="10" y="10" width="8" height="8" fill="none" stroke={strokeColor} strokeWidth="1" />
            <rect x="24" y="10" width="8" height="8" fill="none" stroke={strokeColor} strokeWidth="1" />
            <rect x="38" y="10" width="8" height="8" fill="none" stroke={strokeColor} strokeWidth="1" />
            {/* Window Title */}
            <text x="130" y="18" fill={strokeColor} textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold">
              BROWSER CLIENT (PORTAL)
            </text>

            {/* Address Bar */}
            <g transform="translate(12 36)">
              <rect x="0" y="0" width="236" height="22" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
              {/* Lock Icon */}
              <circle cx="10" cy="11" r="3" fill="none" stroke={strokeColor} strokeWidth="1" />
              <rect x="8" y="10" width="4" height="4" fill={strokeColor} />
              <text x="20" y="15" fill={strokeColor} fontSize="8.5" fontFamily="monospace">
                https://campus.edu/profile
              </text>
              <rect x="195" y="4" width="34" height="14" fill={strokeColor} />
              <text x="212" y="14" fill={accentText} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                TLS 1.3
              </text>
            </g>

            {/* Browser DOM Viewport Area */}
            <g transform="translate(12 66)">
              <rect x="0" y="0" width="236" height="96" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
              {/* User Profile Card inside Browser DOM */}
              <rect x="8" y="8" width="220" height="20" fill={activeBg} />
              <circle cx="20" cy="18" r="6" fill={strokeColor} />
              <text x="32" y="21" fill={strokeColor} fontSize="9" fontFamily="monospace" fontWeight="bold">
                {activeUser.name}
              </text>
              <text x="165" y="21" fill={subtextColor} fontSize="7.5" fontFamily="monospace">
                ROLE: {activeUser.role.toUpperCase()}
              </text>

              {/* Viewport content wires */}
              <line x1="8" y1="36" x2="228" y2="36" stroke={mutedStroke} strokeWidth="1" />
              <text x="8" y="49" fill={subtextColor} fontSize="8" fontFamily="monospace">
                EMAIL: {activeUser.email}
              </text>
              <text x="8" y="63" fill={subtextColor} fontSize="8" fontFamily="monospace">
                SESSION STATUS: {currentStep >= 3 ? 'ACTIVE (AUTHENTICATED)' : 'IDLE / HANDSHAKE'}
              </text>
              <text x="8" y="77" fill={subtextColor} fontSize="8" fontFamily="monospace">
                ORIGIN: {window.location.origin}
              </text>
              {/* Green/White status dot */}
              <circle cx="218" cy="85" r="4" fill={currentStep >= 3 ? strokeColor : mutedStroke} />
              <text x="208" y="88" fill={subtextColor} textAnchor="end" fontSize="7.5" fontFamily="monospace">
                {currentStep >= 3 ? 'ONLINE' : 'CONNECTING'}
              </text>
            </g>

            {/* Browser Client Storage Vault Compartment */}
            <g transform="translate(12 170)">
              <rect x="0" y="0" width="236" height="126" fill={activeBg} stroke={strokeColor} strokeWidth="1.2" />
              {/* Header */}
              <rect x="0" y="0" width="236" height="20" fill={strokeColor} />
              <text x="118" y="14" fill={accentText} textAnchor="middle" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                {paradigm === 'jwt' ? 'CLIENT LOCAL STORAGE (STATELESS)' : 'CLIENT SECURE COOKIE JAR'}
              </text>

              {paradigm === 'jwt' ? (
                // JWT Storage view
                <g transform="translate(8 26)">
                  <text x="0" y="12" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    TOKEN KEY: "auth_token"
                  </text>
                  <rect x="0" y="18" width="220" height="38" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
                  <text x="6" y="32" fill={strokeColor} fontSize="7.5" fontFamily="monospace">
                    {jwtToken ? `${jwtToken.slice(0, 32)}...` : 'Generating token...'}
                  </text>
                  <text x="6" y="46" fill={subtextColor} fontSize="7" fontFamily="monospace">
                    [Header].[Payload Claims].[Crypto Signature]
                  </text>

                  <rect x="0" y="62" width="220" height="28" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
                  <text x="6" y="75" fill={strokeColor} fontSize="7.5" fontFamily="monospace">
                    OUTGOING HEADER:
                  </text>
                  <text x="6" y="86" fill={subtextColor} fontSize="7" fontFamily="monospace">
                    Authorization: Bearer eyJhbGci...
                  </text>
                </g>
              ) : (
                // Redis Cookie Jar view
                <g transform="translate(8 26)">
                  <text x="0" y="12" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    STORED COOKIE: sid (128-bit Opaque)
                  </text>
                  <rect x="0" y="18" width="220" height="38" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
                  <text x="6" y="32" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {redisSession ? redisSession.sid : 'Waiting for login...'}
                  </text>
                  <text x="6" y="46" fill={subtextColor} fontSize="7" fontFamily="monospace">
                    Flags: HttpOnly; Secure; SameSite=Lax
                  </text>

                  <rect x="0" y="62" width="220" height="28" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
                  <text x="6" y="75" fill={strokeColor} fontSize="7.5" fontFamily="monospace">
                    SECURITY LOCK:
                  </text>
                  <text x="6" y="86" fill={subtextColor} fontSize="7" fontFamily="monospace">
                    JavaScript Document.cookie = NULL
                  </text>
                </g>
              )}
            </g>

            {/* Base Stand */}
            <path d="M100 320 L90 336 L170 336 L160 320 Z" fill={activeBg} stroke={strokeColor} strokeWidth="1" />
            <rect x="80" y="336" width="100" height="4" fill={strokeColor} />
          </g>

          {/* ========================================================================= */}
          {/* SECTION 2: INTERNET / HIGH-SPEED NETWORK HIGHWAY (X: 285 to 585)          */}
          {/* ========================================================================= */}
          <g transform="translate(285 20)">
            {/* Top Wire: Client -> Server Request Highway */}
            <g transform="translate(0 75)">
              <line x1="0" y1="0" x2="300" y2="0" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="6 3" />
              <polygon points="296,-4 304,0 296,4" fill={strokeColor} />
              <rect x="65" y="-18" width="170" height="15" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
              <text x="150" y="-7" fill={strokeColor} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                {interactiveAction === 'request'
                  ? 'GET /api/profile (VERIFY)'
                  : paradigm === 'jwt'
                  ? 'POST /login → Authorization: Bearer'
                  : 'POST /login → Cookie: sid='}
              </text>

              {/* Animated Request Packet traveling Left -> Right */}
              {motionEnabled && (
                <motion.g
                  animate={
                    isRequestActive
                      ? { x: [0, 240, 290] }
                      : { x: currentStep >= 1 && currentStep <= 2 ? [0, 280] : 0 }
                  }
                  transition={{
                    duration: 1.8,
                    repeat: isRequestActive ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                >
                  <rect x="-30" y="-12" width="60" height="24" fill={strokeColor} stroke={panelBg} strokeWidth="1" />
                  <text x="0" y="3" fill={accentText} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    REQUEST
                  </text>
                </motion.g>
              )}
            </g>

            {/* Center Status Hub / CDN Gateway Label */}
            <g transform="translate(150 160)">
              <circle cx="0" cy="0" r="24" fill={panelBg} stroke={strokeColor} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="18" fill="none" stroke={mutedStroke} strokeWidth="1" strokeDasharray="3 3" />
              <text x="0" y="-2" fill={strokeColor} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                FIBER
              </text>
              <text x="0" y="8" fill={subtextColor} textAnchor="middle" fontSize="6.5" fontFamily="monospace">
                10 Gbps
              </text>
            </g>

            {/* Bottom Wire: Server -> Client Response Highway */}
            <g transform="translate(0 245)">
              <line x1="300" y1="0" x2="0" y2="0" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="6 3" />
              <polygon points="4,-4 -4,0 4,4" fill={strokeColor} />
              <rect x="65" y="4" width="170" height="15" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
              <text x="150" y="15" fill={strokeColor} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                {isRevoked
                  ? 'HTTP 401 UNAUTHORIZED (REVOKED)'
                  : paradigm === 'jwt'
                  ? 'HTTP 200 OK + STATELESS TOKEN'
                  : 'HTTP 200 OK + Set-Cookie: sid='}
              </text>

              {/* Animated Response Packet traveling Right -> Left */}
              {motionEnabled && (
                <motion.g
                  animate={
                    currentStep >= 3 || subsequentResponse
                      ? { x: [290, 50, 0] }
                      : { x: 290 }
                  }
                  transition={{
                    duration: 1.8,
                    repeat: isRequestActive ? Infinity : 0,
                    ease: 'easeInOut',
                    delay: 0.6,
                  }}
                >
                  <rect x="-35" y="-12" width="70" height="24" fill={isRevoked ? activeBg : strokeColor} stroke={strokeColor} strokeWidth="1.5" />
                  <text x="0" y="3" fill={isRevoked ? strokeColor : accentText} textAnchor="middle" fontSize="7" fontFamily="monospace" fontWeight="bold">
                    {isRevoked ? '401 FAIL' : '200 OK'}
                  </text>
                </motion.g>
              )}
            </g>
          </g>

          {/* ========================================================================= */}
          {/* SECTION 3: DETAILED RECTANGULAR SERVER RACK CABINET (X: 590 to 880)       */}
          {/* ========================================================================= */}
          <g transform="translate(590 20)">
            {/* Outer Cabinet Isometric Frame / Double Border */}
            <rect x="3" y="3" width="280" height="324" fill="none" stroke={mutedStroke} strokeWidth="1" />
            <rect x="0" y="0" width="280" height="324" fill={panelBg} stroke={strokeColor} strokeWidth="2" />

            {/* Cabinet Top Header & Exhaust Fans */}
            <rect x="0" y="0" width="280" height="26" fill={activeBg} stroke={strokeColor} strokeWidth="1.5" />
            <text x="14" y="16" fill={strokeColor} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
              DATACENTER RACK · UNIT #04
            </text>
            {/* Exhaust Fans (3 circles with blades) */}
            {[210, 235, 260].map((cx, i) => (
              <g key={i} transform={`translate(${cx} 13)`}>
                <circle cx="0" cy="0" r="6" fill="none" stroke={strokeColor} strokeWidth="1" />
                <line x1="-4" y1="0" x2="4" y2="0" stroke={strokeColor} strokeWidth="1" />
                <line x1="0" y1="-4" x2="0" y2="4" stroke={strokeColor} strokeWidth="1" />
              </g>
            ))}

            {/* Vertical Mounting Rails (Left & Right with Unit notches) */}
            <rect x="6" y="32" width="12" height="284" fill={activeBg} stroke={mutedStroke} strokeWidth="1" />
            <rect x="262" y="32" width="12" height="284" fill={activeBg} stroke={mutedStroke} strokeWidth="1" />
            {[50, 80, 110, 140, 170, 200, 230, 260, 290].map((y, i) => (
              <g key={i}>
                <rect x="9" y={y} width="6" height="3" fill={strokeColor} />
                <rect x="265" y={y} width="6" height="3" fill={strokeColor} />
              </g>
            ))}

            {/* ------------------------------------------------------------- */}
            {/* RACK UNIT 1 (1U): EDGE GATEWAY / REVERSE PROXY (Y: 34 to 86)  */}
            {/* ------------------------------------------------------------- */}
            <g transform="translate(24 34)">
              <rect x="0" y="0" width="232" height="50" fill={panelBg} stroke={strokeColor} strokeWidth="1.5" />
              {/* Rack unit label */}
              <rect x="0" y="0" width="232" height="15" fill={activeBg} stroke={mutedStroke} strokeWidth="1" />
              <text x="6" y="11" fill={strokeColor} fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                1U · NGINX EDGE GATEWAY / TLS TERMINATOR
              </text>
              <text x="226" y="11" fill={subtextColor} textAnchor="end" fontSize="7" fontFamily="monospace">
                ETH0: 10.0.4.1
              </text>

              {/* Server front face details */}
              <g transform="translate(8 22)">
                {/* Status LED array */}
                <circle cx="6" cy="6" r="3" fill={strokeColor} />
                <circle cx="16" cy="6" r="3" fill={strokeColor} />
                <circle cx="26" cy="6" r="3" fill={isProcessing ? mutedStroke : strokeColor} />
                <text x="36" y="9" fill={subtextColor} fontSize="7" fontFamily="monospace">
                  PWR · LINK · ACT
                </text>

                {/* Ventilation Grid */}
                <path d="M120 2 h60 M120 6 h60 M120 10 h60 M120 14 h60" stroke={mutedStroke} strokeWidth="1" />
                {/* 2 SFP+ 10G Fiber Ports */}
                <rect x="190" y="2" width="14" height="12" fill="none" stroke={strokeColor} strokeWidth="1" />
                <rect x="208" y="2" width="14" height="12" fill="none" stroke={strokeColor} strokeWidth="1" />
              </g>
            </g>

            {/* ------------------------------------------------------------- */}
            {/* RACK UNIT 2 (2U): API COMPUTE CLUSTER (Y: 92 to 198)          */}
            {/* ------------------------------------------------------------- */}
            <g transform="translate(24 92)">
              <rect x="0" y="0" width="232" height="102" fill={panelBg} stroke={strokeColor} strokeWidth="1.5" />
              {/* Unit Header */}
              <rect x="0" y="0" width="232" height="16" fill={strokeColor} />
              <text x="6" y="12" fill={accentText} fontSize="8" fontFamily="monospace" fontWeight="bold">
                2U · API APPLICATION SERVER (NODE / GO)
              </text>
              <text x="226" y="12" fill={accentText} textAnchor="end" fontSize="7" fontFamily="monospace">
                CORE: ACTIVE
              </text>

              {paradigm === 'jwt' ? (
                // JWT SPECIFIC: Cryptographic HMAC Co-processor inside API Server
                <g transform="translate(8 22)">
                  <rect x="0" y="0" width="216" height="42" fill={activeBg} stroke={strokeColor} strokeWidth="1.2" />
                  <text x="6" y="13" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    HMAC-SHA256 HARDWARE CRYPTO ENGINE
                  </text>
                  <text x="6" y="25" fill={subtextColor} fontSize="7" fontFamily="monospace">
                    SECRET KEY: [VERIFY VIA WEB CRYPTO SUBTLE]
                  </text>
                  <text x="6" y="36" fill={strokeColor} fontSize="7.5" fontFamily="monospace">
                    EXECUTION TIME: 0.04 ms · DB QUERIES: 0
                  </text>

                  {/* RAM Allocation Meter in JWT */}
                  <g transform="translate(0 48)">
                    <rect x="0" y="0" width="216" height="24" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
                    <text x="6" y="11" fill={subtextColor} fontSize="7" fontFamily="monospace">
                      SESSION STATE RAM ALLOCATED:
                    </text>
                    <text x="6" y="21" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                      0 BYTES (STATELESS IN-MEMORY FOOTPRINT)
                    </text>
                    <rect x="180" y="4" width="30" height="16" fill={strokeColor} />
                    <text x="195" y="15" fill={accentText} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                      100% OK
                    </text>
                  </g>
                </g>
              ) : (
                // REDIS SPECIFIC: Session Router querying Redis unit below
                <g transform="translate(8 22)">
                  <rect x="0" y="0" width="216" height="42" fill={activeBg} stroke={strokeColor} strokeWidth="1.2" />
                  <text x="6" y="13" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    SESSION CHECKER & COOKIE EXTRACTOR
                  </text>
                  <text x="6" y="25" fill={subtextColor} fontSize="7" fontFamily="monospace">
                    EXTRACTS: sid=8f4a... FROM INCOMING COOKIE
                  </text>
                  <text x="6" y="36" fill={strokeColor} fontSize="7.5" fontFamily="monospace">
                    ROUTING TO: REDIS CLUSTER:6379 VIA TCP
                  </text>

                  {/* Query Status */}
                  <g transform="translate(0 48)">
                    <rect x="0" y="0" width="216" height="24" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
                    <text x="6" y="11" fill={subtextColor} fontSize="7" fontFamily="monospace">
                      CACHE INTERCONNECT BUS:
                    </text>
                    <text x="6" y="21" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                      {isRevoked ? 'KEY NOT FOUND (401)' : 'GET session:8f4a... (FOUND IN RAM)'}
                    </text>
                    <rect x="175" y="4" width="36" height="16" fill={isRevoked ? mutedStroke : strokeColor} />
                    <text x="193" y="15" fill={isRevoked ? strokeColor : accentText} textAnchor="middle" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      {isRevoked ? 'MISS' : 'HIT'}
                    </text>
                  </g>
                </g>
              )}
            </g>

            {/* ------------------------------------------------------------- */}
            {/* RACK UNIT 3 (2U): STORAGE / STATE ENGINE (Y: 202 to 312)      */}
            {/* ------------------------------------------------------------- */}
            <g transform="translate(24 202)">
              <rect x="0" y="0" width="232" height="110" fill={panelBg} stroke={strokeColor} strokeWidth="1.5" />

              {paradigm === 'jwt' ? (
                // JWT: Idle database (proof that server storage is bypassed)
                <>
                  <rect x="0" y="0" width="232" height="16" fill={activeBg} stroke={mutedStroke} strokeWidth="1" />
                  <text x="6" y="12" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    2U · SQL DATABASE (POSTGRESQL CLUSTER)
                  </text>
                  <text x="226" y="12" fill={subtextColor} textAnchor="end" fontSize="7" fontFamily="monospace">
                    STANDBY
                  </text>

                  <g transform="translate(8 22)">
                    {/* Database Cylinders / Drive bays */}
                    <rect x="0" y="0" width="216" height="40" fill={activeBg} stroke={mutedStroke} strokeWidth="1" />
                    <text x="8" y="15" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                      DATABASE STATUS: UNTOUCHED
                    </text>
                    <text x="8" y="27" fill={subtextColor} fontSize="7" fontFamily="monospace">
                      JWT auth requires zero DB reads or writes.
                    </text>
                    <text x="8" y="37" fill={subtextColor} fontSize="7" fontFamily="monospace">
                      Zero connection pool contention.
                    </text>

                    {/* Hard drive activity LEDs (all idle) */}
                    <g transform="translate(0 46)">
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <g key={i} transform={`translate(${i * 36} 0)`}>
                          <rect x="0" y="0" width="32" height="30" fill={panelBg} stroke={mutedStroke} strokeWidth="1" />
                          <circle cx="8" cy="8" r="2" fill={mutedStroke} />
                          <text x="8" y="24" fill={subtextColor} fontSize="6" fontFamily="monospace">
                            BAY {i + 1}
                          </text>
                        </g>
                      ))}
                    </g>
                  </g>
                </>
              ) : (
                // REDIS: Dedicated Redis In-Memory Storage Rack Unit with illuminated RAM banks
                <>
                  <rect x="0" y="0" width="232" height="16" fill={strokeColor} />
                  <text x="6" y="12" fill={accentText} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    2U · REDIS IN-MEMORY STORE (KEY-VALUE RAM)
                  </text>
                  <text x="226" y="12" fill={accentText} textAnchor="end" fontSize="7" fontFamily="monospace">
                    PORT: 6379
                  </text>

                  <g transform="translate(8 22)">
                    {/* Active RAM shelf record */}
                    <rect
                      x="0"
                      y="0"
                      width="216"
                      height="46"
                      fill={isRevoked ? panelBg : activeBg}
                      stroke={strokeColor}
                      strokeWidth={1.5}
                    />

                    {isRevoked ? (
                      // Revoked state
                      <g transform="translate(8 16)">
                        <text x="0" y="0" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                          RECORD STATUS: EXECUTED "DEL {redisSession?.sid.slice(0, 12)}..."
                        </text>
                        <text x="0" y="12" fill={subtextColor} fontSize="7.5" fontFamily="monospace">
                          MEMORY FREED IN 0.22ms · INSTANT GLOBAL BLOCK
                        </text>
                        <text x="0" y="24" fill={strokeColor} fontSize="7" fontFamily="monospace">
                          KEY ERASED FROM RAM · ZERO ACCESS ALLOWED
                        </text>
                      </g>
                    ) : (
                      // Active state
                      <g transform="translate(8 14)">
                        <text x="0" y="0" fill={strokeColor} fontSize="8" fontFamily="monospace" fontWeight="bold">
                          KEY: {redisSession ? redisSession.sid.slice(0, 22) : 'session:8f4a91...'}...
                        </text>
                        <text x="0" y="12" fill={subtextColor} fontSize="7.5" fontFamily="monospace">
                          VALUE: {`{ id: "${activeUser.id}", role: "${activeUser.role}" }`}
                        </text>
                        <text x="0" y="24" fill={strokeColor} fontSize="7.5" fontFamily="monospace">
                          RAM ALLOCATED: 184 BYTES · TTL: 1,800s (COUNTDOWN)
                        </text>
                      </g>
                    )}

                    {/* Illuminated RAM banks (4 DDR5 memory modules graphic) */}
                    <g transform="translate(0 52)">
                      {[0, 1, 2, 3].map(i => (
                        <g key={i} transform={`translate(${i * 55} 0)`}>
                          <rect
                            x="0"
                            y="0"
                            width="50"
                            height="24"
                            fill={i === 0 && !isRevoked ? strokeColor : panelBg}
                            stroke={strokeColor}
                            strokeWidth="1"
                          />
                          <text
                            x="25"
                            y="11"
                            fill={i === 0 && !isRevoked ? accentText : strokeColor}
                            textAnchor="middle"
                            fontSize="6.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            RAM BANK {i + 1}
                          </text>
                          <text
                            x="25"
                            y="20"
                            fill={i === 0 && !isRevoked ? accentText : subtextColor}
                            textAnchor="middle"
                            fontSize="6"
                            fontFamily="monospace"
                          >
                            {i === 0 && !isRevoked ? 'ACTIVE' : 'READY'}
                          </text>
                        </g>
                      ))}
                    </g>
                  </g>
                </>
              )}
            </g>

            {/* Server Rack Bottom Feet / Grounding Wheels */}
            <rect x="20" y="324" width="24" height="6" fill={strokeColor} />
            <rect x="236" y="324" width="24" height="6" fill={strokeColor} />
          </g>
        </svg>
      </div>

      {/* Blueprint Legend Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-current font-mono text-[10px]">
        <div>
          <span className="font-bold block mb-0.5">1. CLIENT BROWSER DOMAIN</span>
          <span className="opacity-70 text-[9px] leading-relaxed">
            {paradigm === 'jwt'
              ? 'Holds complete mathematical proof in localStorage/memory. Transmits entire token on every request.'
              : 'Holds strictly opaque 128-bit ticket in an HttpOnly cookie. Zero user identity or roles exposed.'}
          </span>
        </div>
        <div>
          <span className="font-bold block mb-0.5">2. TRANSPORT WIRE (TLS 1.3)</span>
          <span className="opacity-70 text-[9px] leading-relaxed">
            {paradigm === 'jwt'
              ? 'Carries Authorization: Bearer <jwt> (~840 bytes). No server state lookup required over wire.'
              : 'Carries Cookie: sid=<sid> (32 bytes). Extremely lightweight payload with zero claims visible.'}
          </span>
        </div>
        <div>
          <span className="font-bold block mb-0.5">3. SERVER RACK COMPUTATION</span>
          <span className="opacity-70 text-[9px] leading-relaxed">
            {paradigm === 'jwt'
              ? 'Edge/API server executes local HMAC-SHA256 math. Bypasses database entirely (0 queries, 0 bytes RAM).'
              : 'API server extracts sid and looks up the session in Redis RAM (0.85ms). Instant revocation via DEL.'}
          </span>
        </div>
      </div>
    </div>
  );
}

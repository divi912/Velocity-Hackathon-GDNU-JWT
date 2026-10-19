import { ArrowUpRight, Check, Minus, Plus } from 'lucide-react';
import { getRouteUrl } from '../../lib/routes';

export function SessionComparison() {
  const comparisonRows = [
    {
      q: 'What does the browser hold?',
      jwt: 'Claims and signature (readable JSON)',
      redis: 'Random opaque session ID (zero claims)',
    },
    {
      q: 'Where is user state stored?',
      jwt: 'Distributed inside the client token',
      redis: 'Centralized inside Redis memory',
    },
    {
      q: 'Does every request need a lookup?',
      jwt: 'Usually no (verified locally in memory)',
      redis: 'Yes (sub-millisecond RAM read)',
    },
    {
      q: 'Can logout take effect immediately?',
      jwt: 'Requires blacklists or waiting for exp',
      redis: 'Immediate (DEL session:id)',
    },
    {
      q: 'Can the browser read the contents?',
      jwt: 'Yes (standard Base64url atob)',
      redis: 'No (opaque ticket points to nowhere on client)',
    },
    {
      q: 'What happens if the shared store fails?',
      jwt: 'APIs continue validating tokens with public key',
      redis: 'Session lookups fail without high-availability Redis',
    },
    {
      q: 'Best fit',
      jwt: 'Decoupled microservices, mobile edge, public APIs',
      redis: 'SaaS dashboards, e-commerce, banking, central control',
    },
  ];

  const redisPros = [
    {
      title: 'True Instant Revocation',
      desc: 'Calling DEL session:id terminates the session immediately across all servers and devices worldwide.',
    },
    {
      title: 'Zero Client Leakage',
      desc: 'User IDs, emails, roles, and permissions never leave the server memory boundary, preventing PII leaks.',
    },
    {
      title: 'Small Network Footprint',
      desc: 'Transmits only a 32-byte session ID in an HttpOnly cookie, avoiding multi-kilobyte header bloat.',
    },
  ];

  const redisCons = [
    {
      title: 'Mandatory Storage Lookup',
      desc: 'Every single API request requires an in-memory Redis round-trip (typically 0.5ms–2ms).',
    },
    {
      title: 'Central Point of Failure',
      desc: 'If Redis is offline and no backup cluster exists, authentication across all services is blocked.',
    },
    {
      title: 'Cluster Memory Overhead',
      desc: 'Storing 1,000,000 concurrent sessions in Redis RAM requires careful memory provisioning and eviction policies.',
    },
  ];

  return (
    <section id="comparison" className="border-t-4 border-white bg-black text-white py-16">
      <div className="mx-auto max-w-[1536px] px-5 md:px-10 xl:px-16">
        {/* Section Header */}
        <div className="mb-12 flex items-center justify-between border-b border-neutral-800 pb-4">
          <span className="section-label text-neutral-400">THE DEFINITIVE COMPARISON</span>
          <span className="size-3 border-2 border-white" />
        </div>

        <h2 className="max-w-[1000px] font-display text-[clamp(44px,6vw,96px)] leading-[1.08] tracking-[-.05em]">
          JWT vs Redis sessions.<br />
          <span className="italic">Proof versus control.</span>
        </h2>

        {/* Comparison Matrix Table */}
        <div className="mt-14 border border-white bg-[#0a0a0a] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-white bg-white text-black font-mono uppercase tracking-widest text-[10px]">
                <th className="p-4 md:p-5 w-1/3">Architectural Question</th>
                <th className="p-4 md:p-5 w-1/3 border-l border-black">Signed JWT (Client Proof)</th>
                <th className="p-4 md:p-5 w-1/3 border-l border-black bg-neutral-200">Redis Session (Server Control)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 font-mono">
              {comparisonRows.map((row, idx) => (
                <tr key={row.q} className="hover:bg-[#141414] transition-colors">
                  <td className="p-4 md:p-5 font-bold text-white">{row.q}</td>
                  <td className="p-4 md:p-5 text-neutral-300 border-l border-neutral-800">{row.jwt}</td>
                  <td className="p-4 md:p-5 text-white border-l border-neutral-800 bg-[#0f0f0f] font-medium">
                    {row.redis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pros & Cons Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 border border-white divide-y md:divide-y-0 md:divide-x divide-white bg-[#0a0a0a]">
          {/* Redis Advantages */}
          <div className="p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-7 items-center justify-center bg-white text-black font-bold">
                <Plus size={14} />
              </span>
              <h3 className="section-label text-white font-bold">Redis Sessions — The Strengths</h3>
            </div>
            <div className="space-y-6">
              {redisPros.map(pro => (
                <div key={pro.title}>
                  <h4 className="text-sm font-medium text-white mb-1.5 flex items-center gap-2">
                    <Check size={14} strokeWidth={2} />
                    {pro.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-neutral-400 pl-5">{pro.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Redis Trade-Offs */}
          <div className="p-8 bg-[#0d0d0d]">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-7 items-center justify-center border border-white text-white">
                <Minus size={14} />
              </span>
              <h3 className="section-label text-neutral-300 font-bold">Redis Sessions — The Trade-Offs</h3>
            </div>
            <div className="space-y-6">
              {redisCons.map(con => (
                <div key={con.title}>
                  <h4 className="text-sm font-medium text-white mb-1.5 flex items-center gap-2">
                    <span className="size-1.5 bg-neutral-400" />
                    {con.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-neutral-400 pl-4">{con.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Memorable Closing Statement */}
        <div className="mt-16 border-t-2 border-b-2 border-white py-12 text-center">
          <p className="font-display text-[clamp(40px,6.5vw,90px)] leading-tight tracking-tight text-white">
            JWT moves proof.<br />
            <span className="italic">Redis sessions keep control.</span>
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href={getRouteUrl('/')}
              className="button-base bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              ← Back to JWT Field Guide
            </a>
            <button
              type="button"
              onClick={() => document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })}
              className="button-base border border-white bg-black text-white hover:bg-white hover:text-black transition-colors"
            >
              Inspect Live in Console ↑
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-14 pt-8 border-t border-neutral-800 text-[10px] text-neutral-500 flex flex-col md:flex-row justify-between gap-4 font-mono">
          <div>
            <p className="text-white font-bold">REDIS SESSIONS / DECODED</p>
            <p className="mt-1 text-neutral-400">
              Built for curious engineers. The server-side companion to JWT Decoded.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="https://redis.io/docs/latest/develop/data-types/strings/" target="_blank" rel="noreferrer" className="hover:text-white underline">
              Redis Strings ↗
            </a>
            <a href="https://httpwg.org/specs/rfc6265.html" target="_blank" rel="noreferrer" className="hover:text-white underline">
              RFC 6265 (Cookies) ↗
            </a>
            <a href={getRouteUrl('/')} className="hover:text-white underline">
              JWT Decoded ↗
            </a>
          </div>
        </footer>
      </div>
    </section>
  );
}

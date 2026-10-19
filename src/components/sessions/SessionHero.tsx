import { ArrowDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SessionDiagram } from './SessionDiagram';

export function SessionHero({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <section className="border-b-4 border-white bg-black text-white" aria-labelledby="session-hero-title">
      <div className="mx-auto max-w-[1536px] px-5 pt-9 pb-8 md:px-10 lg:pt-12 xl:px-16">
        <div className="mb-8 flex items-center justify-between border-b border-neutral-800 pb-4 md:mb-11">
          <span className="section-label text-neutral-400">The server side, explained.</span>
          <span className="section-label text-neutral-500">Field guide / No. 002</span>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-3">
          <div className="relative pb-3 lg:pb-10">
            <motion.p
              initial={motionEnabled ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="section-label mb-6 flex items-center gap-3 text-neutral-300"
            >
              <span className="inline-block size-2 bg-white" />
              REDIS SESSIONS, FROM THE INSIDE OUT
            </motion.p>
            <h1
              id="session-hero-title"
              className="font-display text-[clamp(80px,10.5vw,165px)] leading-[.91] font-normal tracking-[-.065em]"
            >
              Sessions,<br />
              <span className="italic">retained.</span>
            </h1>
            <p className="mt-8 max-w-[420px] text-[13px] leading-7 text-neutral-400 md:text-sm">
              The proof stays home. Only the ticket travels.<br />
              Follow a session ID from the browser into memory—and see how server-side state guarantees instant revocation and absolute confidentiality.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5 lg:mt-10">
              <a
                href="#why-sessions"
                className="button-base bg-white text-black hover:bg-neutral-900 hover:text-white transition-colors"
              >
                Follow the session <ArrowDown size={15} strokeWidth={1.5} />
              </a>
              <a
                href="#playground"
                className="flex min-h-11 items-center gap-2 text-[11px] text-white underline underline-offset-4 hover:text-neutral-300"
              >
                Open session console <ArrowUpRight size={14} />
              </a>
              <a
                href="/"
                className="flex min-h-11 items-center gap-2 text-[11px] text-neutral-400 hover:text-white"
              >
                ← Switch to JWT (client-side)
              </a>
            </div>
          </div>

          <motion.figure
            initial={motionEnabled ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="min-w-0 border border-white bg-[#0a0a0a]"
          >
            <div className="flex items-center justify-between border-b border-white px-4 py-3">
              <span className="section-label text-white">Fig. 01 — The Server-Side Secret</span>
              <span className="flex items-center gap-2 text-[9px] text-neutral-300">
                <span className="size-1.5 bg-white" />
                {motionEnabled ? 'LIVE MEMORY SIMULATION' : 'MOTION OFF'}
              </span>
            </div>
            <SessionDiagram kind="why-sessions" motionEnabled={motionEnabled} hero />
            <figcaption className="flex justify-between gap-4 border-t border-neutral-800 px-4 py-3 text-[9px] text-neutral-500">
              <span>OPAQUE TICKET → REDIS RAM → PROTECTED DATA</span>
              <span>ZERO PROOF EXPOSED TO CLIENT</span>
            </figcaption>
          </motion.figure>
        </div>

        <div className="mt-9 flex items-center justify-between border-t border-neutral-800 pt-5 lg:mt-10">
          <span className="section-label flex items-center gap-3 text-neutral-300">
            <ArrowDownRight size={17} strokeWidth={1} />
            Scroll to uncover the architecture
          </span>
          <span className="section-label hidden text-neutral-500 sm:inline">
            7 chapters · a working Redis simulation playground
          </span>
        </div>
      </div>
    </section>
  );
}

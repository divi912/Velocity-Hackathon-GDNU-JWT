import { useState } from 'react';
import { ArrowRight, Check, Cookie, Shield, Terminal } from 'lucide-react';
import { sessionChapters } from '../../content/sessionChapters';
import { SessionDiagram } from './SessionDiagram';

function CookieInspector() {
  const [sid, setSid] = useState('8f4a91b3e091a457c129e8');
  return (
    <div className="mt-6 border-t border-neutral-800 pt-4 bg-[#0d0d0d] p-4 border border-neutral-700">
      <span className="section-label mb-2 block text-neutral-400">Cookie Construction Inspector</span>
      <div className="flex items-center gap-2 font-mono text-xs text-white">
        <span className="text-neutral-500">sid=</span>
        <input
          value={sid}
          maxLength={32}
          onChange={e => setSid(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
          className="border border-white bg-black px-2 py-1 text-xs text-white font-mono flex-1 focus-visible:outline-white"
        />
      </div>
      <div className="mt-3 font-mono text-[10px] text-neutral-400 leading-relaxed break-all bg-black p-2 border border-neutral-800">
        Set-Cookie: sid={sid || '...'}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800
      </div>
      <p className="mt-2 text-[9px] text-neutral-500">
        Notice: zero user names, zero emails, zero roles inside the string. Only 128 bits of entropy.
      </p>
    </div>
  );
}

export function SessionStory({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <div className="bg-black text-white">
      <div className="mx-auto flex max-w-[1536px] items-center justify-between px-5 py-7 md:px-10 xl:px-16 border-b border-neutral-800">
        <p className="section-label text-neutral-300">The server scroll story</p>
        <p className="section-label text-neutral-500">Move down to follow the session in memory.</p>
      </div>

      {sessionChapters.map(chapter => (
        <article
          id={chapter.id}
          key={chapter.id}
          data-scene
          className="relative border-t-4 border-white lg:min-h-[165svh]"
        >
          <div className="mx-auto grid max-w-[1536px] items-center gap-10 px-5 py-12 md:px-10 lg:sticky lg:top-[100px] lg:grid-cols-[.85fr_1.15fr] lg:gap-14 lg:py-10 xl:gap-20 xl:px-16">
            <div className="min-w-0">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center border border-white text-[10px] font-mono font-bold bg-white text-black">
                  {chapter.number}
                </span>
                <span className="section-label text-neutral-300">{chapter.label}</span>
                <span className="ml-2 h-px flex-1 bg-neutral-800" />
              </div>

              <h2 className="font-display text-[clamp(44px,4.4vw,72px)] leading-[1.06] tracking-[-.045em] whitespace-pre-line text-white">
                {chapter.title}
              </h2>

              <p className="mt-6 text-[15px] leading-7 text-neutral-300">{chapter.lead}</p>
              <p className="mt-4 max-w-[470px] text-[12px] leading-[1.95] text-neutral-400 md:text-[13px]">
                {chapter.body}
              </p>

              <div className="mt-6 flex items-start gap-3 border-l-2 border-white py-1 pl-4 bg-[#0a0a0a]">
                <Check size={14} className="mt-1 shrink-0 text-white" strokeWidth={2} />
                <p className="text-[11px] leading-6 text-neutral-200">{chapter.takeaway}</p>
              </div>

              {chapter.kind === 'cookie-wrapper' && <CookieInspector />}

              {chapter.kind === 'lifecycle-logout' && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('playground');
                      if (el) {
                        el.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' });
                      }
                    }}
                    className="button-base bg-white text-black hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    Open Session Console <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <figure className="min-w-0 self-center border border-white bg-[#0d0d0d]">
              <div className="flex justify-between gap-2 border-b border-white px-4 py-3 bg-[#141414]">
                <span className="section-label text-white">
                  Fig. {chapter.number} / {chapter.label}
                </span>
                <span className="section-label text-neutral-400">
                  {motionEnabled ? 'Scroll to play ↓' : 'Complete view'}
                </span>
              </div>
              <SessionDiagram kind={chapter.kind} motionEnabled={motionEnabled} />
              <figcaption className="flex items-center justify-between gap-3 border-t border-neutral-800 px-4 py-3 text-[9px] text-neutral-400">
                <span>IN-MEMORY KEY-VALUE CACHE / REDIS</span>
                <span>{chapter.number} / 07</span>
              </figcaption>
            </figure>
          </div>
        </article>
      ))}
    </div>
  );
}

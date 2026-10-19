import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '../content/chapters';

export function Navigation({ motionEnabled, onMotionToggle }: { motionEnabled: boolean; onMotionToggle: () => void }) {
  const progress = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('');
  useEffect(() => {
    const tween = gsap.fromTo(progress.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: .2 } });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-20% 0px -45% 0px' });
    document.querySelectorAll('[data-scene], #playground, #field-notes').forEach(el => observer.observe(el));
    return () => { tween.scrollTrigger?.kill(); tween.kill(); observer.disconnect(); };
  }, []);

  return <>
    <a href="#main" className="fixed -top-20 left-5 z-[100] bg-black px-5 py-4 text-sm text-white focus:top-4">Skip to the lesson</a>
    <header className="sticky top-0 z-50 border-b border-black bg-white">
      <div className="mx-auto flex h-[76px] max-w-[1536px] items-center justify-between gap-4 px-5 md:px-10 xl:px-16">
        <a href="#" aria-label="JWT decoded, back to start" className="flex min-h-11 items-center gap-3">
          <span aria-hidden="true" className="grid size-7 grid-cols-2 gap-[3px]"><span className="bg-black" /><span className="border border-black" /><span className="border border-black" /><span className="bg-black" /></span>
          <span className="text-sm font-medium tracking-tight">JWT<span className="mx-1.5 text-neutral-400">/</span>decoded</span>
        </a>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[10px] tracking-[.12em] uppercase md:flex">
          <a href="#the-journey" className="py-4 underline-offset-4 hover:underline">The story</a>
          <a href="#playground" className="py-4 underline-offset-4 hover:underline">The playground</a>
          <a href="#field-notes" className="py-4 underline-offset-4 hover:underline">Field notes</a>
        </nav>
        <div className="flex items-center gap-3 md:gap-6">
          <span className="section-label hidden text-neutral-500 xl:inline">A visual field guide</span>
          <button type="button" aria-pressed={!motionEnabled} onClick={onMotionToggle} className="flex min-h-11 items-center gap-2 border-l border-neutral-300 pl-4 text-[10px]" title="Toggle animations">
            {motionEnabled ? <Pause size={13} strokeWidth={1.5} /> : <Play size={13} strokeWidth={1.5} />}<span>Motion {motionEnabled ? 'on' : 'off'}</span>
          </button>
          <a href="https://github.com/divi912/Velocity-Hackathon-GDNU-JWT" target="_blank" rel="noreferrer" aria-label="View source on GitHub" className="hidden min-h-11 items-center sm:flex"><ArrowUpRight size={18} strokeWidth={1.5} /></a>
        </div>
      </div>
      <div ref={progress} className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-black" />
    </header>
    <aside aria-label="Chapter navigation" className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col gap-1 2xl:flex">
      {chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`} title={chapter.label} aria-label={`Chapter ${chapter.number}: ${chapter.label}`} aria-current={active === chapter.id ? 'step' : undefined} className={`flex size-8 items-center justify-center text-[9px] transition-colors duration-100 ${active === chapter.id ? 'bg-black text-white' : 'text-neutral-400 hover:bg-neutral-100 hover:text-black'}`}>{chapter.number}</a>)}
    </aside>
  </>;
}

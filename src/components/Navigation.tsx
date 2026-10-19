import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Key, Pause, Play, RefreshCw, Server, Shield } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '../content/chapters';
import { sessionChapters } from '../content/sessionChapters';

export function Navigation({
  motionEnabled,
  onMotionToggle,
  currentPath = '/',
  onNavigate,
  forceTheme,
}: {
  motionEnabled: boolean;
  onMotionToggle: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  forceTheme?: 'light' | 'dark';
}) {
  const progress = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('');

  const isDebugger = currentPath === '/debugger';
  const isRedis = forceTheme ? forceTheme === 'dark' : (currentPath === '/sessions' || currentPath === '/sessions/playground');
  const isLogin = currentPath === '/login' || currentPath === '/auth';

  useEffect(() => {
    const tween = gsap.fromTo(
      progress.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.2,
        },
      }
    );
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -45% 0px' }
    );
    document
      .querySelectorAll('[data-scene], #playground, #field-notes, #why-sessions')
      .forEach(el => observer.observe(el));
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      observer.disconnect();
    };
  }, [currentPath]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    // If it's a pure in-page hash scroll on the current page
    if (path.startsWith('#')) {
      const elem = document.getElementById(path.slice(1));
      if (elem) {
        e.preventDefault();
        elem.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' });
        window.history.pushState(null, '', path);
      }
      return;
    }

    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const targetLogoPath = isRedis ? '/' : '/sessions';

  return (
    <>
      <a
        href="#main"
        className={`fixed -top-20 left-5 z-[100] px-5 py-4 text-sm focus:top-4 transition-colors ${
          isRedis ? 'bg-white text-black' : 'bg-black text-white'
        }`}
      >
        Skip to the lesson
      </a>

      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-150 ${
          isRedis ? 'bg-black border-white text-white' : 'bg-white border-black text-black'
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-[1536px] items-center justify-between gap-4 px-5 md:px-10 xl:px-16">
          {/* Logo with Flip-to-Other-Side Action */}
          <a
            href={targetLogoPath}
            onClick={e => handleLinkClick(e, targetLogoPath)}
            aria-label={isRedis ? 'Switch to Session Sight (Client side)' : 'Switch to Redis (Server side)'}
            title={
              isRedis
                ? 'Click to transition to Session Sight (Client-side proof)'
                : 'Click to transition to Redis Sessions (Server-side state)'
            }
            className="flex min-h-11 items-center gap-3 group"
          >
            {/* The 4-quadrant Icon */}
            <span aria-hidden="true" className="grid size-7 grid-cols-2 gap-[3px]">
              {isRedis ? (
                <>
                  <span className="bg-white group-hover:bg-neutral-400 transition-colors" />
                  <span className="border border-white" />
                  <span className="border border-white" />
                  <span className="bg-white group-hover:bg-neutral-400 transition-colors" />
                </>
              ) : (
                <>
                  <span className="bg-black group-hover:bg-neutral-600 transition-colors" />
                  <span className="border border-black" />
                  <span className="border border-black" />
                  <span className="bg-black group-hover:bg-neutral-600 transition-colors" />
                </>
              )}
            </span>

            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-tight">
                {isRedis ? (
                  <>
                    REDIS<span className="mx-1.5 text-neutral-500">/</span>sessions
                  </>
                ) : (
                  <>
                    SESSION<span className="mx-1.5 text-neutral-400">/</span>sight
                  </>
                )}
              </span>
              <span
                className={`text-[8px] font-mono tracking-widest uppercase transition-colors ${
                  isRedis
                    ? 'text-neutral-400 group-hover:text-white'
                    : 'text-neutral-500 group-hover:text-black'
                }`}
              >
                {isRedis ? 'Click to flip → Session Sight' : 'Click to flip → Redis'}
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-6 text-[10px] tracking-[.12em] uppercase xl:flex 2xl:gap-8"
          >
            {/* Contextual Story Link */}
            <a
              href={isRedis ? '#why-sessions' : '#the-journey'}
              onClick={e => handleLinkClick(e, isRedis ? '#why-sessions' : '#the-journey')}
              className="py-4 underline-offset-4 hover:underline"
            >
              {isRedis ? 'Session story' : 'JWT story'}
            </a>

            {/* JWT Debugger Link */}
            <a
              href="/debugger"
              onClick={e => handleLinkClick(e, '/debugger')}
              aria-current={isDebugger ? 'page' : undefined}
              className={`py-4 underline-offset-4 hover:underline ${
                isDebugger ? 'font-bold underline' : ''
              }`}
            >
              JWT Debugger
            </a>

            {/* Redis Session Console Link */}
            <a
              href={isRedis ? '#playground' : '/sessions#playground'}
              onClick={e => handleLinkClick(e, isRedis ? '#playground' : '/sessions#playground')}
              className="py-4 underline-offset-4 hover:underline flex items-center gap-1.5"
            >
              <Server size={12} strokeWidth={1.5} />
              Redis Console
            </a>

            {/* Login Lab Link */}
            <a
              href="/login"
              onClick={e => handleLinkClick(e, '/login')}
              aria-current={isLogin ? 'page' : undefined}
              className={`py-4 underline-offset-4 hover:underline flex items-center gap-1.5 ${
                isLogin ? 'font-bold underline' : ''
              }`}
            >
              <Key size={12} strokeWidth={1.5} />
              Login Lab
            </a>

            {/* Field Notes or Comparison Link */}
            <a
              href={isRedis ? '#comparison' : '#field-notes'}
              onClick={e => handleLinkClick(e, isRedis ? '#comparison' : '#field-notes')}
              className="py-4 underline-offset-4 hover:underline"
            >
              {isRedis ? 'Comparison' : 'Field notes'}
            </a>
          </nav>

          {/* Dual Experience Switcher Pill */}
          <div className="flex items-center gap-2">
            <div
              className={`hidden sm:flex border p-0.5 text-[9px] font-mono tracking-wider ${
                isRedis ? 'border-neutral-700 bg-[#0d0d0d]' : 'border-neutral-300 bg-neutral-100'
              }`}
            >
              <a
                href="/"
                onClick={e => handleLinkClick(e, '/')}
                className={`px-2.5 py-1 transition-colors ${
                  !isRedis
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                JWT (CLIENT)
              </a>
              <a
                href="/sessions"
                onClick={e => handleLinkClick(e, '/sessions')}
                className={`px-2.5 py-1 transition-colors ${
                  isRedis
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                REDIS (SERVER)
              </a>
            </div>

            {/* Motion Toggle */}
            <button
              type="button"
              aria-pressed={!motionEnabled}
              onClick={onMotionToggle}
              className={`flex min-h-11 items-center gap-2 border-l pl-4 text-[10px] font-mono transition-colors ${
                isRedis ? 'border-neutral-800 text-neutral-300' : 'border-neutral-300 text-black'
              }`}
              title="Toggle animations"
            >
              {motionEnabled ? <Pause size={13} strokeWidth={1.5} /> : <Play size={13} strokeWidth={1.5} />}
              <span className="hidden sm:inline">Motion {motionEnabled ? 'on' : 'off'}</span>
            </button>

            <a
              href="https://github.com/divi912/Velocity-Hackathon-GDNU-SessionSight"
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
              className={`hidden min-h-11 items-center sm:flex ${
                isRedis ? 'text-white' : 'text-black'
              }`}
            >
              <ArrowUpRight size={18} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* GSAP Progress Line */}
        <div
          ref={progress}
          className={`absolute bottom-0 left-0 h-[3px] w-full origin-left ${
            isRedis ? 'bg-white' : 'bg-black'
          }`}
        />
      </header>

      {/* Chapter side rail for JWT story */}
      {!isDebugger && !isRedis && !isLogin && (
        <aside
          aria-label="Chapter navigation"
          className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col gap-1 2xl:flex"
        >
          {chapters.map(chapter => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              title={chapter.label}
              aria-label={`Chapter ${chapter.number}: ${chapter.label}`}
              aria-current={active === chapter.id ? 'step' : undefined}
              className={`flex size-8 items-center justify-center text-[9px] transition-colors duration-100 ${
                active === chapter.id
                  ? 'bg-black text-white'
                  : 'text-neutral-400 hover:bg-neutral-100 hover:text-black'
              }`}
            >
              {chapter.number}
            </a>
          ))}
        </aside>
      )}
    </>
  );
}

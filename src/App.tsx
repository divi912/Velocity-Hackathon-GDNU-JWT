import { useEffect, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from './components/Navigation';
import { Hero, Primer, Story, FieldNotes } from './components/Story';
import { DebuggerPage } from './components/DebuggerPage';
import { SessionsPage } from './components/sessions/SessionsPage';
import { LoginPage } from './components/LoginPage';

const REPO_BASES = [
  '/Velocity-Hackathon-GDNU-SessionSight',
  '/Velocity-Hackathon-GDNU-JWT',
];

function getCleanPath(pathname: string, hash: string = ''): string {
  // Support hash routing fallback if present: #/sessions, #/debugger, #/login
  if (hash.startsWith('#/')) {
    return hash.slice(1).replace(/\/$/, '') || '/';
  }
  if (hash.startsWith('#') && ['#sessions', '#debugger', '#login', '#auth'].includes(hash)) {
    return '/' + hash.slice(1);
  }

  let path = pathname.replace(/\/$/, '') || '/';
  for (const base of REPO_BASES) {
    if (path.toLowerCase().startsWith(base.toLowerCase())) {
      path = path.slice(base.length) || '/';
      break;
    }
  }
  return path.replace(/\/$/, '') || '/';
}

function getActiveRepoBase(pathname: string): string {
  for (const base of REPO_BASES) {
    if (pathname.toLowerCase().startsWith(base.toLowerCase())) {
      return base;
    }
  }
  return '/Velocity-Hackathon-GDNU-SessionSight';
}

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const motionEnabled = motionOverride ?? !prefersReducedMotion;

  const [currentPath, setCurrentPath] = useState(() => {
    return getCleanPath(window.location.pathname, window.location.hash);
  });

  const navigate = (rawTarget: string) => {
    const [rawPath, hash] = rawTarget.split('#');
    // If target is pure hash, stay on current path
    const targetPath = rawPath || currentPath;
    const cleanPath = getCleanPath(targetPath);

    const isGhPages = REPO_BASES.some(base =>
      window.location.pathname.toLowerCase().startsWith(base.toLowerCase())
    );
    const activeBase = getActiveRepoBase(window.location.pathname);
    const pathForUrl = cleanPath === '/' ? '' : cleanPath;
    const baseWithRoute = isGhPages ? `${activeBase}${pathForUrl}` : (cleanPath || '/');
    const finalUrl = hash ? `${baseWithRoute || activeBase || '/'}#${hash}` : (baseWithRoute || '/');

    window.history.pushState({}, '', finalUrl);
    setCurrentPath(cleanPath);

    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: motionEnabled ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCleanPath(window.location.pathname, window.location.hash));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept all internal <a> link clicks globally to prevent breaking GitHub Pages subpaths
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      // Ignore modified clicks (open in new tab/window)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore external links, mailto, tel, or target="_blank"
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank'
      ) {
        return;
      }

      // If pure in-page hash scroll like href="#chapter-01" on current page
      if (href.startsWith('#')) {
        const hashId = href.slice(1);
        if (hashId) {
          const el = document.getElementById(hashId);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' });
            window.history.pushState(null, '', href);
          }
        }
        return;
      }

      // Route transition (e.g. "/debugger", "/sessions", "/login", "/sessions#playground")
      e.preventDefault();
      navigate(href);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [navigate, motionEnabled, currentPath]);

  const isDebugger = currentPath === '/debugger';
  const isSessions = currentPath === '/sessions' || currentPath === '/sessions/playground';
  const isLogin = currentPath === '/login' || currentPath === '/auth';
  const [loginParadigm, setLoginParadigm] = useState<'jwt' | 'redis'>('jwt');

  const isDark = isSessions || (isLogin && loginParadigm === 'redis');

  // Toggle document background color based on active side
  useEffect(() => {
    document.documentElement.style.backgroundColor = isDark ? '#000000' : '#ffffff';
    document.body.style.backgroundColor = isDark ? '#000000' : '#ffffff';
    document.body.style.color = isDark ? '#ffffff' : '#000000';
  }, [isDark]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = motionEnabled ? 'smooth' : 'auto';
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh();
    });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [motionEnabled, currentPath]);

  useEffect(() => {
    // The browser may look for a hash target before client-rendered chapters exist.
    if (isDebugger || isLogin || !window.location.hash) return;
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({
          behavior: 'instant',
          block: 'start',
        });
      }
    });
    return () => {
      active = false;
    };
  }, [isDebugger, isLogin, currentPath]);

  return (
    <MotionConfig reducedMotion={motionEnabled ? 'never' : 'always'}>
      <Navigation
        motionEnabled={motionEnabled}
        onMotionToggle={() => setMotionOverride(!motionEnabled)}
        currentPath={currentPath}
        onNavigate={navigate}
        forceTheme={isLogin ? (loginParadigm === 'redis' ? 'dark' : 'light') : undefined}
      />
      <main
        id="main"
        className={isDark ? 'bg-black text-white' : 'paper-texture bg-white text-black'}
      >
        {isLogin ? (
          <LoginPage
            motionEnabled={motionEnabled}
            onNavigate={navigate}
            paradigm={loginParadigm}
            onParadigmChange={setLoginParadigm}
          />
        ) : isSessions ? (
          <SessionsPage motionEnabled={motionEnabled} />
        ) : isDebugger ? (
          <DebuggerPage motionEnabled={motionEnabled} />
        ) : (
          <>
            <Hero motionEnabled={motionEnabled} />
            <Primer />
            <Story motionEnabled={motionEnabled} />
            <FieldNotes motionEnabled={motionEnabled} />
          </>
        )}
      </main>
    </MotionConfig>
  );
}

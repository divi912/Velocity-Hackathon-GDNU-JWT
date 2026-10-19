import { useEffect, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from './components/Navigation';
import { Hero, Primer, Story, FieldNotes } from './components/Story';
import { DebuggerPage } from './components/DebuggerPage';
import { SessionsPage } from './components/sessions/SessionsPage';
import { LoginPage } from './components/LoginPage';

const REPO_BASE = '/Velocity-Hackathon-GDNU-JWT';

function getCleanPath(pathname: string): string {
  let path = pathname.replace(/\/$/, '') || '/';
  if (path.toLowerCase().startsWith(REPO_BASE.toLowerCase())) {
    path = path.slice(REPO_BASE.length) || '/';
  }
  return path.replace(/\/$/, '') || '/';
}

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const motionEnabled = motionOverride ?? !prefersReducedMotion;

  const [currentPath, setCurrentPath] = useState(() => {
    return getCleanPath(window.location.pathname);
  });

  const navigate = (path: string) => {
    const isGhPages = window.location.pathname.toLowerCase().startsWith(REPO_BASE.toLowerCase());
    const targetUrl = isGhPages ? `${REPO_BASE}${path === '/' ? '' : path}` : path;
    window.history.pushState({}, '', targetUrl || '/');
    setCurrentPath(path.replace(/\/$/, '') || '/');
    window.scrollTo({ top: 0, behavior: motionEnabled ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCleanPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

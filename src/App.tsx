import { useEffect, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from './components/Navigation';
import { Hero, Primer, Story, FieldNotes } from './components/Story';
import { DebuggerPage } from './components/DebuggerPage';

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const motionEnabled = motionOverride ?? !prefersReducedMotion;
  const debuggerPage = window.location.pathname.replace(/\/$/, '') === '/debugger';
  useEffect(() => {
    document.documentElement.style.scrollBehavior = motionEnabled ? 'smooth' : 'auto';
    let active = true;
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [motionEnabled]);
  useEffect(() => {
    // The browser may look for a hash target before the client-rendered chapters exist.
    if (debuggerPage || !window.location.hash) return;
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    return () => { active = false; };
  }, [debuggerPage]);
  return <MotionConfig reducedMotion={motionEnabled ? 'never' : 'always'}>
    <Navigation motionEnabled={motionEnabled} onMotionToggle={() => setMotionOverride(!motionEnabled)} debuggerPage={debuggerPage} />
    <main id="main" className="paper-texture">
      {debuggerPage ? <DebuggerPage motionEnabled={motionEnabled} /> : <>
      <Hero motionEnabled={motionEnabled} />
      <Primer />
      <Story motionEnabled={motionEnabled} />
      <FieldNotes />
      </>}
    </main>
  </MotionConfig>;
}

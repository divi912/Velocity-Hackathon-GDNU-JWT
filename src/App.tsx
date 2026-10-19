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

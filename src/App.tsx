import { useEffect, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from './components/Navigation';
import { Hero, Primer, Story, FieldNotes } from './components/Story';
import { TokenLab } from './components/TokenLab';

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const motionEnabled = motionOverride ?? !prefersReducedMotion;
  useEffect(() => {
    document.documentElement.style.scrollBehavior = motionEnabled ? 'smooth' : 'auto';
    let active = true;
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [motionEnabled]);
  return <MotionConfig reducedMotion={motionEnabled ? 'never' : 'always'}>
    <Navigation motionEnabled={motionEnabled} onMotionToggle={() => setMotionOverride(!motionEnabled)} />
    <main id="main" className="paper-texture">
      <Hero motionEnabled={motionEnabled} />
      <Primer />
      <Story motionEnabled={motionEnabled} />
      <TokenLab motionEnabled={motionEnabled} />
      <FieldNotes />
    </main>
  </MotionConfig>;
}

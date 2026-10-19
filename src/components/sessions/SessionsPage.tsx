import { useEffect, useRef, useState } from 'react';
import { SessionHero } from './SessionHero';
import { SessionStory } from './SessionStory';
import { SessionPlayground } from './SessionPlayground';
import { SessionComparison } from './SessionComparison';
import { sessionChapters } from '../../content/sessionChapters';

export function SessionsPage({ motionEnabled }: { motionEnabled: boolean }) {
  const [activeChapter, setActiveChapter] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -45% 0px' }
    );

    document.querySelectorAll('[data-scene], #playground').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-black text-white min-h-screen relative selection:bg-white selection:text-black">
      {/* Side Chapter Rail */}
      <aside
        aria-label="Session chapters"
        className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col gap-1 2xl:flex"
      >
        {sessionChapters.map(chapter => {
          const isActive = activeChapter === chapter.id;
          return (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              title={chapter.label}
              aria-label={`Chapter ${chapter.number}: ${chapter.label}`}
              className={`flex size-8 items-center justify-center font-mono text-[9px] transition-colors duration-100 border border-neutral-800 ${
                isActive
                  ? 'bg-white text-black font-bold border-white'
                  : 'text-neutral-500 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              {chapter.number}
            </a>
          );
        })}
      </aside>

      <SessionHero motionEnabled={motionEnabled} />
      <SessionStory motionEnabled={motionEnabled} />
      <SessionPlayground />
      <SessionComparison />
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useProgress } from './progress/ProgressProvider';

const TICK = 5; // seconds
const IDLE = 90; // stop counting after this many seconds without input (unless a video plays)

/** Counts active study time on a unit page: visible tab + recent input or playing video. */
export function useStudyTimer(unitId: string | undefined, isPlaying: () => boolean) {
  const { addStudyTime } = useProgress();
  const lastInput = useRef(Date.now());
  const addRef = useRef(addStudyTime);
  addRef.current = addStudyTime;
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  useEffect(() => {
    if (!unitId) return;
    const mark = () => (lastInput.current = Date.now());
    const events = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    lastInput.current = Date.now();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const active = playingRef.current() || Date.now() - lastInput.current < IDLE * 1000;
      if (active) addRef.current(unitId, TICK);
    }, TICK * 1000);
    return () => {
      window.clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, mark));
    };
  }, [unitId]);
}

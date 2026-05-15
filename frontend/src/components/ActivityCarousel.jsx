import { useRef, useEffect } from 'react';
import { ActivityCard } from './ActivityCard';

export function ActivityCarousel({ activities }) {
  const stripRef  = useRef(null);
  const jumping   = useRef(false);
  const timerRef  = useRef(null);

  if (!activities?.length) return null;

  const n = activities.length;
  // Build [clone-of-last, ...real items..., clone-of-first]
  const items = [activities[n - 1], ...activities, activities[0]];

  // Scroll to the real first item (index 1) on mount — instant, no animation
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const realFirst = strip.children[1];
    if (!realFirst) return;
    const cardW  = realFirst.offsetWidth;
    const stripW = strip.clientWidth;
    strip.scrollLeft = realFirst.offsetLeft - (stripW - cardW) / 2;
  }, [activities.length]);

  // After each scroll settles, if we landed on a clone → silently jump to the real item
  const handleScroll = () => {
    if (jumping.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const strip = stripRef.current;
      if (!strip) return;
      const stripW = strip.clientWidth;

      const getCenter = (el) => el.offsetLeft - (stripW - el.offsetWidth) / 2;

      const cloneFirst = strip.children[n + 1]; // clone of first, at the end
      const cloneLast  = strip.children[0];     // clone of last, at the start
      const realFirst  = strip.children[1];
      const realLast   = strip.children[n];

      const sl = strip.scrollLeft;
      const tol = stripW * 0.15;

      let target = null;
      if (Math.abs(sl - getCenter(cloneFirst)) < tol) target = getCenter(realFirst);
      if (Math.abs(sl - getCenter(cloneLast))  < tol) target = getCenter(realLast);

      if (target !== null) {
        jumping.current = true;
        strip.scrollLeft = target;           // instant jump (no smooth)
        setTimeout(() => { jumping.current = false; }, 80);
      }
    }, 120);
  };

  // Click a card → smooth-scroll to center it
  const handleCardClick = (index) => {
    const strip = stripRef.current;
    if (!strip) return;
    const child = strip.children[index];
    if (!child) return;
    const target = child.offsetLeft - (strip.clientWidth - child.offsetWidth) / 2;
    strip.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <div className="carousel-wrapper">
      <div className="activities-strip" ref={stripRef} onScroll={handleScroll}>
        {items.map((act, i) => (
          <ActivityCard
            key={`${act.id || act.title}-${i}`}
            act={act}
            onCenterMe={() => handleCardClick(i)}
          />
        ))}
      </div>
    </div>
  );
}

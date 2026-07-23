"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number smoothly toward `target` whenever it changes.
 * Used so the landing hero's live stats (price, market cap, holders,
 * volume) count up instead of just snapping to the new value on
 * every SWR refresh.
 */
export function useCountUp(target: number | undefined, duration = 1200) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === undefined || Number.isNaN(target)) return;

    const from = fromRef.current;
    const to = target;
    const start = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function frame(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;

      setValue(current);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

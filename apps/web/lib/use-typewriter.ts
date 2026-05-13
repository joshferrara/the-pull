"use client";

import { useEffect, useState } from "react";

/**
 * Type-on animation. Returns the visible substring + a "done" flag.
 * Respects prefers-reduced-motion (instantly returns full string).
 */
export function useTypewriter(text: string, msPerChar = 18, startDelay = 0) {
  const [visible, setVisible] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(text);
      setDone(true);
      return;
    }
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setVisible(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        return;
      }
      setTimeout(tick, msPerChar);
    };
    const id = setTimeout(tick, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [text, msPerChar, startDelay]);

  return { visible, done };
}

"use client";

import { useEffect, useState } from "react";

/** Returns scroll progress 0-1 of the document. */
export function useScrollProgress(): number {
  const [p, setP] = useState(0);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) {
        setP(1);
        return;
      }
      setP(Math.max(0, Math.min(1, window.scrollY / max)));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return p;
}

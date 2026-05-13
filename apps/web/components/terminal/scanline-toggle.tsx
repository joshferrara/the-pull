"use client";

import { useEffect, useState } from "react";

const KEY = "the-pull:scanlines";

export function ScanlineToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    const initial = stored === "1";
    setOn(initial);
    document.documentElement.classList.toggle("scanlines-on", initial);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    document.documentElement.classList.toggle("scanlines-on", next);
    localStorage.setItem(KEY, next ? "1" : "0");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)] hover:text-[color:var(--color-mauve)] transition-colors"
      aria-pressed={on}
      aria-label="Toggle CRT scanlines"
    >
      [ crt: {on ? "on" : "off"} ]
    </button>
  );
}

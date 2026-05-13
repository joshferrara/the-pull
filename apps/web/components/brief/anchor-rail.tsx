"use client";

import { useEffect, useState } from "react";

interface Props {
  count: number;
}

export function AnchorRail({ count }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ids = Array.from({ length: count }, (_, i) => `item-${i + 1}`);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = els.indexOf(e.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [count]);

  return (
    <aside
      className="hidden xl:flex flex-col gap-2 fixed left-[max(1.5rem,calc(50vw-var(--w-prose)/2-7rem))] top-32 font-mono text-[var(--text-caption)] tabular-nums z-10"
      aria-label="Items"
    >
      {Array.from({ length: count }, (_, i) => (
        <a
          key={i}
          href={`#item-${i + 1}`}
          className={
            "no-underline transition-colors " +
            (i === active
              ? "text-[color:var(--color-mauve)]"
              : "text-[color:var(--color-overlay0)] hover:text-[color:var(--color-overlay2)]")
          }
        >
          {String(i + 1).padStart(2, "0")}
        </a>
      ))}
    </aside>
  );
}

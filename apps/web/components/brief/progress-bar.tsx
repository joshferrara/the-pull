"use client";

import { useScrollProgress } from "@/lib/use-scroll-progress";

export function ProgressBar() {
  const p = useScrollProgress();
  return (
    <div
      className="fixed inset-x-0 top-14 z-20 h-px bg-[color:var(--color-rule)]"
      aria-hidden
    >
      <div
        className="h-full bg-[color:var(--color-mauve)] transition-[width] duration-75 ease-out"
        style={{ width: `${(p * 100).toFixed(1)}%` }}
      />
    </div>
  );
}

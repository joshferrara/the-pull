"use client";

import { useEffect, useState } from "react";
import { BoxFrame } from "@/components/terminal";

interface Props {
  count: number;
}

export function KeyboardShortcuts({ count }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "g") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (e.key === "G") {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
        return;
      }
      if (e.key === "j" || e.key === "k") {
        const dir = e.key === "j" ? 1 : -1;
        const current = currentItem(count);
        const next = Math.max(0, Math.min(count - 1, current + dir));
        const el = document.getElementById(`item-${next + 1}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[color:color-mix(in_oklab,var(--color-crust)_75%,transparent)] flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <BoxFrame label="keyboard">
          <ul className="font-mono text-[var(--text-body-sm)] space-y-1.5 text-[color:var(--color-subtext1)]">
            <Row k="j / k" v="next / prev item" />
            <Row k="g / G" v="top / bottom" />
            <Row k="?" v="toggle this help" />
            <Row k="esc" v="close" />
          </ul>
        </BoxFrame>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-baseline gap-4">
      <kbd className="px-1.5 py-0.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[color:var(--color-text)]">
        {k}
      </kbd>
      <span>{v}</span>
    </li>
  );
}

function currentItem(count: number): number {
  for (let i = 0; i < count; i++) {
    const el = document.getElementById(`item-${i + 1}`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > 200) return i;
  }
  return count - 1;
}

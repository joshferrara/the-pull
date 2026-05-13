"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  edition?: number;
  date?: string;
  path?: string;
}

const KEY = "the-pull:statusbar-dismissed";

export function StatusBar({ edition, date, path = "~/the-pull" }: Props) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

  useEffect(() => {
    setDismissed(localStorage.getItem(KEY) === "1");
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(KEY, "1");
  }

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 backdrop-blur-md bg-[color:color-mix(in_oklab,var(--color-crust)_85%,transparent)] border-t border-[color:var(--color-surface1)]"
      role="status"
      aria-label="Site status"
    >
      <div className="max-w-[var(--w-grid)] mx-auto px-6 h-9 flex items-center gap-3 font-mono text-[var(--text-micro)] text-[color:var(--color-overlay2)]">
        <span className="text-[color:var(--color-mauve)]">{path}</span>
        <span>·</span>
        {typeof edition === "number" && (
          <>
            <span className="tabular-nums">ed.#{String(edition).padStart(3, "0")}</span>
            <span>·</span>
          </>
        )}
        {date && (
          <>
            <span>{date}</span>
            <span>·</span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--color-prompt)] pulse-dot" />
          live
        </span>
        <span className="ml-auto flex items-center gap-3">
          <Link href="/#email" className="hover:text-[color:var(--color-mauve)]">
            ⏎ subscribe
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss status bar"
            className="hover:text-[color:var(--color-mauve)]"
          >
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}

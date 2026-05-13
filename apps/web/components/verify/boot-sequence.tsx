"use client";

import { useEffect, useState } from "react";
import { TerminalPane } from "@/components/terminal";

interface Step {
  label: string;
  status: "pending" | "running" | "ok" | "err";
}

interface Props {
  tokenPreview?: string;
  finalMessage: string;
  errored?: boolean;
}

const STEPS_TEMPLATE: Step["label"][] = [
  "resolving identity",
  "checking expiration",
  "minting session",
];

export function BootSequence({ tokenPreview = "tp_••••", finalMessage, errored }: Props) {
  const [steps, setSteps] = useState<Step[]>(
    STEPS_TEMPLATE.map((label) => ({ label, status: "pending" })),
  );
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSteps(STEPS_TEMPLATE.map((label) => ({ label, status: errored ? "err" : "ok" })));
      setShowFinal(true);
      return;
    }
    let cancelled = false;
    (async () => {
      for (let i = 0; i < STEPS_TEMPLATE.length; i++) {
        if (cancelled) return;
        setSteps((curr) =>
          curr.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)),
        );
        await delay(380);
        if (cancelled) return;
        setSteps((curr) =>
          curr.map((s, idx) =>
            idx === i ? { ...s, status: errored && i === STEPS_TEMPLATE.length - 1 ? "err" : "ok" } : s,
          ),
        );
      }
      await delay(220);
      if (!cancelled) setShowFinal(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [errored]);

  return (
    <TerminalPane title="bash — verify">
      <div className="p-5 leading-relaxed">
        <div>
          <span className="text-[color:var(--color-prompt)]">$</span>{" "}
          <span className="text-[color:var(--color-text)]">verify --token {tokenPreview}</span>
        </div>
        <ul className="mt-3 space-y-1">
          {steps.map((s) => (
            <li key={s.label} className="flex items-baseline gap-2">
              <span className="text-[color:var(--color-overlay1)]">→</span>
              <span className="flex-1 text-[color:var(--color-subtext1)]">{s.label}</span>
              <span className="w-4 text-right">{statusGlyph(s.status)}</span>
            </li>
          ))}
        </ul>
        <div
          className={
            "mt-4 transition-opacity duration-300 " +
            (showFinal ? "opacity-100" : "opacity-0")
          }
          aria-live="polite"
        >
          <span className={errored ? "text-[color:var(--color-red)]" : "text-[color:var(--color-text)]"}>
            {finalMessage}
          </span>
        </div>
      </div>
    </TerminalPane>
  );
}

function statusGlyph(s: Step["status"]) {
  switch (s) {
    case "pending":
      return <span className="text-[color:var(--color-overlay0)]">…</span>;
    case "running":
      return <span className="caret bg-[color:var(--color-text)]" />;
    case "ok":
      return <span className="text-[color:var(--color-prompt)]">✓</span>;
    case "err":
      return <span className="text-[color:var(--color-red)]">✗</span>;
  }
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

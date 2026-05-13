"use client";

import { useState } from "react";
import { BoxFrame } from "@/components/terminal";

interface Props {
  token: string;
  onDismiss: () => void;
}

export function TokenRevealCard({ token, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mt-4">
      <BoxFrame label="new token · copy now" tone="warn">
        <code className="block break-all font-mono text-[var(--text-caption)] text-[color:var(--color-text)] bg-[color:var(--color-mantle)] rounded p-2 mb-3">
          {token}
        </code>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)]"
          >
            {copied ? "✓ copied" : "⎘ copy token"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)] hover:text-[color:var(--color-text)]"
          >
            dismiss
          </button>
          <span className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-peach)]">
            ⚠ shown once
          </span>
        </div>
      </BoxFrame>
    </div>
  );
}

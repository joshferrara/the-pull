"use client";

import { useState } from "react";

const TERMINAL = `curl -fsSL https://thepull.dev/install | sh
pull login`;

const AGENT = `Set up a daily AI brief for me:
1. Register at https://thepull.dev/api/v1/auth/register with my email
2. I'll click the verification link and provide you my token
3. Save the token to ~/.config/the-pull/agent-token
4. Add a cron job that fetches https://thepull.dev/api/v1/today.json
   with the token each morning at 8am and summarizes it for me`;

export function TabSwitcher() {
  const [tab, setTab] = useState<"terminal" | "agent">("terminal");
  const snippet = tab === "terminal" ? TERMINAL : AGENT;
  return (
    <div>
      <div className="flex gap-2 mb-3 text-sm">
        <button
          type="button"
          onClick={() => setTab("terminal")}
          className={tabClass(tab === "terminal")}
        >
          Terminal
        </button>
        <button
          type="button"
          onClick={() => setTab("agent")}
          className={tabClass(tab === "agent")}
        >
          Agent
        </button>
      </div>
      <pre className="bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] rounded-lg p-4 overflow-x-auto text-sm leading-relaxed text-[color:var(--color-text)] whitespace-pre-wrap">
        <code>{snippet}</code>
      </pre>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(snippet)}
        className="mt-2 text-xs text-[color:var(--color-overlay1)] hover:text-[color:var(--color-mauve)]"
      >
        Copy to clipboard
      </button>
    </div>
  );
}

function tabClass(active: boolean) {
  return (
    "px-3 py-1.5 rounded font-medium transition-colors " +
    (active
      ? "bg-[color:var(--color-surface0)] text-[color:var(--color-text)]"
      : "text-[color:var(--color-overlay1)] hover:text-[color:var(--color-text)]")
  );
}

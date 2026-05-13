"use client";

import { useState } from "react";
import { TerminalPane } from "@/components/terminal";

const TERMINAL = `curl -fsSL https://thepull.dev/install | sh
pull login`;

const AGENT = `Set up a daily AI brief for me:
1. Register at https://thepull.dev/api/v1/auth/register with my email
2. I'll click the verification link and provide you my token
3. Save the token to ~/.config/the-pull/agent-token
4. Add a cron job that fetches https://thepull.dev/api/v1/today.json
   with the token each morning at 8am and summarizes it for me`;

type Tab = "terminal" | "agent" | "email";

export function InstallTabs({ onChooseEmail }: { onChooseEmail: () => void }) {
  const [tab, setTab] = useState<Tab>("terminal");
  const snippet = tab === "terminal" ? TERMINAL : tab === "agent" ? AGENT : null;
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div>
      <div className="flex gap-1 mb-3 font-mono text-[var(--text-caption)]">
        <TabBtn active={tab === "terminal"} onClick={() => setTab("terminal")}>terminal</TabBtn>
        <TabBtn active={tab === "agent"} onClick={() => setTab("agent")}>agent</TabBtn>
        <TabBtn active={tab === "email"} onClick={() => { setTab("email"); onChooseEmail(); }}>email</TabBtn>
      </div>
      {snippet ? (
        <TerminalPane title={tab === "terminal" ? "bash — install" : "agent — instructions"}>
          <pre className="p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
            <code>{snippet}</code>
          </pre>
          <div className="border-t border-[color:var(--color-surface1)] px-4 py-2 flex items-center justify-between text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
            <span>{copied ? "✓ copied" : "ready"}</span>
            <button
              type="button"
              onClick={copy}
              className="hover:text-[color:var(--color-mauve)]"
            >
              ⌘C copy
            </button>
          </div>
        </TerminalPane>
      ) : (
        <p className="text-[color:var(--color-overlay1)] font-mono text-[var(--text-caption)]">
          ↓ enter your email below.
        </p>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded-md font-mono text-[var(--text-caption)] transition-colors " +
        (active
          ? "bg-[color:var(--color-surface0)] text-[color:var(--color-text)]"
          : "text-[color:var(--color-overlay1)] hover:text-[color:var(--color-text)]")
      }
    >
      <span className={active ? "text-[color:var(--color-overlay1)]" : "opacity-0"}>[</span>
      {children}
      <span className={active ? "text-[color:var(--color-overlay1)]" : "opacity-0"}>]</span>
    </button>
  );
}

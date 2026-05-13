"use client";

import { useState, useTransition } from "react";
import { BoxFrame, MetaChip } from "@/components/terminal";
import { TokenRevealCard } from "./token-reveal-card";

export interface TokenView {
  id: string;
  token: string;
  scope: "api" | "rss" | "cli";
  label?: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface Props {
  tokens: TokenView[];
  onCreate: (scope: TokenView["scope"], label: string) => Promise<string | null>;
  onRevoke: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function TokensPanel({ tokens, onCreate, onRevoke, onRefresh }: Props) {
  const [scope, setScope] = useState<TokenView["scope"]>("api");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const t = await onCreate(scope, label);
      if (t) setNewToken(t);
      setLabel("");
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <BoxFrame label="api tokens">
        <form onSubmit={create} className="flex flex-wrap items-end gap-2 mb-4">
          <label className="flex flex-col gap-1 text-[var(--text-micro)] font-mono text-[color:var(--color-overlay1)]">
            scope
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as TokenView["scope"])}
              className="px-2 py-1.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[var(--text-caption)] text-[color:var(--color-text)]"
            >
              <option value="api">api</option>
              <option value="rss">rss</option>
              <option value="cli">cli</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[var(--text-micro)] font-mono text-[color:var(--color-overlay1)] flex-1 min-w-[12rem]">
            label
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="my laptop"
              className="px-2 py-1.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[var(--text-caption)] text-[color:var(--color-text)]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)] disabled:opacity-50"
          >
            {busy ? "…" : "generate"}
          </button>
        </form>

        {newToken && <TokenRevealCard token={newToken} onDismiss={() => setNewToken(null)} />}

        <div className="mt-2">
          {tokens.length === 0 ? (
            <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
              no tokens yet.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-rule)]">
              {tokens.map((t) => (
                <li key={t.id} className={"py-3 flex flex-wrap items-center gap-3 " + (t.revoked ? "opacity-50" : "")}>
                  <MetaChip label={t.scope} variant="mauve" />
                  <span className="text-[var(--text-body-sm)] text-[color:var(--color-text)]">
                    {t.label ?? <span className="text-[color:var(--color-overlay1)]">(no label)</span>}
                  </span>
                  <span className="font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
                    {t.last_used_at ? `last used ${t.last_used_at}` : "never used"}
                  </span>
                  {t.revoked ? (
                    <span className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)] line-through">
                      revoked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startTransition(() => void onRevoke(t.id))}
                      className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-red)] hover:underline"
                    >
                      revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </BoxFrame>
    </section>
  );
}

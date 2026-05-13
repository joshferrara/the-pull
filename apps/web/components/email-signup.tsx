"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export function EmailSignup({ id = "email" }: { id?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const resp = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as { error?: string };
        setState({ kind: "error", message: data.error ?? `error_${resp.status}` });
        return;
      }
      setState({ kind: "ok" });
    } catch {
      setState({ kind: "error", message: "network" });
    }
  }

  if (state.kind === "ok") {
    return (
      <div id={id} className="font-mono text-[var(--text-caption)] text-[color:var(--color-prompt)] flex items-center gap-2">
        <span>✓</span>
        <span>magic link sent to</span>
        <span className="text-[color:var(--color-text)]">{email}</span>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-3 py-2 rounded-md bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[color:var(--color-text)] placeholder:text-[color:var(--color-overlay0)] focus:outline-none focus:border-[color:var(--color-mauve)] font-mono text-[var(--text-body-sm)]"
      />
      <button
        type="submit"
        disabled={state.kind === "loading"}
        className="px-4 py-2 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {state.kind === "loading" ? "sending…" : "get the brief"}
      </button>
      {state.kind === "error" && (
        <p className="text-[color:var(--color-red)] text-[var(--text-micro)] mt-1 sm:mt-0 font-mono">
          {state.message}
        </p>
      )}
    </form>
  );
}

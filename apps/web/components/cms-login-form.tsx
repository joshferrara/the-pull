"use client";

import { useState } from "react";

export function CmsLoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const resp = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source: "cms", next: "/cms" }),
    });
    setState(resp.ok ? "ok" : "error");
  }

  if (state === "ok") {
    return (
      <p className="text-[color:var(--color-green)]">
        Check inbox. Click the link to sign in.
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="curator email"
        className="px-3 py-2 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)]"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="px-3 py-2 rounded bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium disabled:opacity-50"
      >
        {state === "loading" ? "…" : "Send magic link"}
      </button>
      {state === "error" && (
        <p className="text-[color:var(--color-red)] text-xs">Failed; try again.</p>
      )}
    </form>
  );
}

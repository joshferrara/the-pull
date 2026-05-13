"use client";

import { BoxFrame } from "@/components/terminal";

export function DangerZone() {
  return (
    <section>
      <BoxFrame label="danger zone" tone="warn">
        <p className="text-[var(--text-caption)] text-[color:var(--color-subtext1)] mb-3">
          Unsubscribe and revoke all tokens. This cannot be undone.
        </p>
        <form action="/api/v1/me/unsubscribe" method="POST">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md border border-[color:var(--color-red)] text-[color:var(--color-red)] font-mono text-[var(--text-caption)] hover:bg-[color:color-mix(in_oklab,var(--color-red)_15%,transparent)]"
          >
            unsubscribe & revoke
          </button>
        </form>
      </BoxFrame>
    </section>
  );
}

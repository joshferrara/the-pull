"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  code?: string;
  cliCallback?: string;
  next: string;
}

export function VerifyClient({ code, cliCallback, next }: Props) {
  const router = useRouter();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "cli_done"; token: string }
    | { kind: "redirecting" }
  >({ kind: "loading" });

  useEffect(() => {
    if (!code) {
      setState({ kind: "error", message: "Missing code." });
      return;
    }
    (async () => {
      try {
        const resp = await fetch("/api/v1/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, cli_callback: cliCallback }),
        });
        if (!resp.ok) {
          const body = (await resp.json().catch(() => ({}))) as {
            error?: string;
          };
          setState({
            kind: "error",
            message: body.error ?? `error_${resp.status}`,
          });
          return;
        }
        const data = (await resp.json()) as { token: string };
        if (cliCallback) {
          try {
            await fetch(cliCallback, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ token: data.token }),
            });
          } catch {
            // CLI may have torn down; show token to copy.
          }
          setState({ kind: "cli_done", token: data.token });
        } else {
          setState({ kind: "redirecting" });
          router.replace(next);
        }
      } catch {
        setState({ kind: "error", message: "network" });
      }
    })();
  }, [code, cliCallback, next, router]);

  if (state.kind === "error") {
    return (
      <p className="text-[color:var(--color-red)]">
        Verification failed: {state.message}. Try requesting a new link.
      </p>
    );
  }
  if (state.kind === "cli_done") {
    return (
      <div>
        <p className="text-[color:var(--color-green)] mb-3">
          Verified. You can return to your terminal.
        </p>
        <p className="text-xs text-[color:var(--color-overlay1)]">
          If <code>pull</code> didn&apos;t receive the token automatically,
          copy this and run <code>pull login --token &lt;value&gt;</code>:
        </p>
        <code className="block mt-2 p-2 bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] rounded text-xs break-all">
          {state.token}
        </code>
      </div>
    );
  }
  return <p className="text-[color:var(--color-subtext1)]">Verifying…</p>;
}

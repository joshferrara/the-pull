"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BootSequence } from "@/components/verify/boot-sequence";

interface Props {
  code?: string;
  cliCallback?: string;
  next: string;
}

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "cli_done"; token: string }
  | { kind: "redirecting"; greeting: string };

export function VerifyClient({ code, cliCallback, next }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!code) {
      setState({ kind: "error", message: "missing code." });
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
          const body = (await resp.json().catch(() => ({}))) as { error?: string };
          setState({ kind: "error", message: body.error ?? `error_${resp.status}` });
          return;
        }
        const data = (await resp.json()) as { token: string; email?: string };
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
          setState({
            kind: "redirecting",
            greeting: data.email ? `welcome, ${data.email}.` : "welcome back.",
          });
          setTimeout(() => router.replace(next), 1400);
        }
      } catch {
        setState({ kind: "error", message: "network" });
      }
    })();
  }, [code, cliCallback, next, router]);

  if (state.kind === "error") {
    return (
      <BootSequence
        errored
        finalMessage={`✗ ${state.message} · request a new link →`}
      />
    );
  }
  if (state.kind === "cli_done") {
    return (
      <div className="space-y-4">
        <BootSequence finalMessage="verified. return to your terminal." />
        <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
          If <code className="text-[color:var(--color-text)]">pull</code> didn&apos;t receive the
          token automatically, copy this and run{" "}
          <code className="text-[color:var(--color-text)]">pull login --token &lt;value&gt;</code>:
        </p>
        <code className="block p-3 bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] rounded text-[var(--text-caption)] break-all">
          {state.token}
        </code>
      </div>
    );
  }
  if (state.kind === "redirecting") {
    return <BootSequence finalMessage={`${state.greeting} redirecting to ~/dashboard…`} />;
  }
  return <BootSequence finalMessage="" />;
}

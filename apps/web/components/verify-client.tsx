"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BootSequence } from "@/components/verify/boot-sequence";
import { PromptLine, TerminalPane } from "@/components/terminal";

interface Props {
  code?: string;
  cliCallback?: string;
  next: string;
}

type State =
  | { kind: "loading" }
  | { kind: "waiting_for_email" }
  | { kind: "error"; message: string }
  | { kind: "cli_done"; token: string }
  | { kind: "redirecting"; greeting: string };

// localStorage key for the CLI callback bridged across tabs.
// The CLI opens `/verify?cli_callback=...` immediately; the user opens the
// email magic link in another tab (`/verify?code=...`). The first visit stows
// the callback here so the second visit can pick it up and POST the token to
// the waiting local server.
const CLI_CALLBACK_KEY = "the-pull:cli_callback";
// Match the auth-code TTL with a small buffer.
const CLI_CALLBACK_TTL_MS = 20 * 60 * 1000;

function readStoredCallback(): string | null {
  try {
    const raw = localStorage.getItem(CLI_CALLBACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { url?: string; ts?: number };
    if (!parsed.url || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CLI_CALLBACK_TTL_MS) {
      localStorage.removeItem(CLI_CALLBACK_KEY);
      return null;
    }
    return parsed.url;
  } catch {
    return null;
  }
}

function storeCallback(url: string) {
  try {
    localStorage.setItem(
      CLI_CALLBACK_KEY,
      JSON.stringify({ url, ts: Date.now() }),
    );
  } catch {
    // ignore quota / private-mode errors
  }
}

function clearStoredCallback() {
  try {
    localStorage.removeItem(CLI_CALLBACK_KEY);
  } catch {
    // ignore
  }
}

export function VerifyClient({ code, cliCallback, next }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    // Case A: CLI just opened us with a cli_callback but no auth code yet.
    // Stash the callback so the email-link visit picks it up later.
    if (cliCallback && !code) {
      storeCallback(cliCallback);
      setState({ kind: "waiting_for_email" });
      return;
    }

    if (!code) {
      setState({ kind: "error", message: "missing code." });
      return;
    }

    // Case B: code present. Prefer cli_callback from query (CLI-opened tab),
    // fall back to stored callback (email link opened in fresh tab).
    const effectiveCallback = cliCallback ?? readStoredCallback() ?? undefined;

    (async () => {
      try {
        const resp = await fetch("/api/v1/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, cli_callback: effectiveCallback }),
        });
        if (!resp.ok) {
          const body = (await resp.json().catch(() => ({}))) as { error?: string };
          setState({ kind: "error", message: body.error ?? `error_${resp.status}` });
          return;
        }
        const data = (await resp.json()) as { token: string; email?: string };
        if (effectiveCallback) {
          try {
            // text/plain (a CORS-safelisted content type) keeps the browser
            // from sending a preflight OPTIONS to the CLI's loopback server,
            // which only handles POST. The CLI's handler json.Unmarshal's the
            // body regardless of Content-Type.
            await fetch(effectiveCallback, {
              method: "POST",
              headers: { "content-type": "text/plain" },
              body: JSON.stringify({ token: data.token }),
            });
          } catch {
            // CLI may have torn down; show token to copy.
          }
          clearStoredCallback();
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

  if (state.kind === "waiting_for_email") {
    return (
      <TerminalPane title="bash — waiting">
        <div className="p-5 leading-relaxed">
          <PromptLine path="~/verify">await magic-link</PromptLine>
          <p className="mt-4 text-[color:var(--color-subtext1)]">
            Open your inbox and click the sign-in link from{" "}
            <span className="text-[color:var(--color-text)]">The Pull</span>.
          </p>
          <p className="mt-2 text-[color:var(--color-overlay1)] text-[var(--text-caption)]">
            Keep this tab open. Once you click the email link, your CLI will
            receive the token automatically.
          </p>
        </div>
      </TerminalPane>
    );
  }
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

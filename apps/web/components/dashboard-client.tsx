"use client";

import { useState, useTransition } from "react";

interface TokenView {
  id: string;
  token: string;
  scope: "api" | "rss" | "cli";
  label?: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface Props {
  userId: string;
  initialPreferences: { emailEnabled: boolean; analyticsOptOut: boolean };
  initialTimezone: string;
  initialTokens: TokenView[];
}

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function DashboardClient(props: Props) {
  const [tokens, setTokens] = useState(props.initialTokens);
  const [emailEnabled, setEmailEnabled] = useState(
    props.initialPreferences.emailEnabled,
  );
  const [analyticsOptOut, setAnalyticsOptOut] = useState(
    props.initialPreferences.analyticsOptOut,
  );
  const [timezone, setTimezone] = useState(props.initialTimezone);
  const [, startTransition] = useTransition();

  async function refresh() {
    const resp = await fetch("/api/v1/auth/tokens");
    if (resp.ok) {
      const data = (await resp.json()) as { tokens: TokenView[] };
      setTokens(data.tokens);
    }
  }

  async function createToken(scope: "api" | "rss" | "cli", label: string) {
    await fetch("/api/v1/auth/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, label }),
    });
    await refresh();
  }

  async function revoke(id: string) {
    await fetch(`/api/v1/auth/tokens?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-sm uppercase tracking-widest text-[color:var(--color-overlay1)] mb-3">
          Tokens
        </h2>
        <CreateTokenForm onCreate={createToken} />
        {(["api", "rss", "cli"] as const).map((scope) => {
          const group = tokens.filter((t) => t.scope === scope);
          if (group.length === 0) return null;
          return (
            <div key={scope} className="mt-4">
              <h3 className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-2">
                {scope}
              </h3>
              <ul className="space-y-2">
                {group.map((t) => (
                  <li
                    key={t.id}
                    className={
                      "border border-[color:var(--color-surface1)] rounded p-3 text-sm " +
                      (t.revoked ? "opacity-50" : "")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        {t.label ? (
                          <span>{t.label}</span>
                        ) : (
                          <span className="text-[color:var(--color-overlay1)]">
                            (no label)
                          </span>
                        )}
                      </div>
                      {!t.revoked && (
                        <button
                          onClick={() =>
                            startTransition(() => void revoke(t.id))
                          }
                          className="text-xs text-[color:var(--color-red)]"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                    <code className="block mt-2 p-2 bg-[color:var(--color-mantle)] rounded text-xs break-all">
                      {t.token}
                    </code>
                    <p className="mt-1 text-xs text-[color:var(--color-overlay1)]">
                      Created {t.created_at} ·{" "}
                      {t.last_used_at
                        ? `last used ${t.last_used_at}`
                        : "never used"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-[color:var(--color-overlay1)] mb-3">
          Preferences
        </h2>
        <ToggleRow
          label="Email delivery"
          value={emailEnabled}
          onChange={async (v) => {
            setEmailEnabled(v);
            await fetch("/api/v1/me/email", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ enabled: v }),
            });
          }}
        />
        <ToggleRow
          label="Analytics opt-out"
          value={analyticsOptOut}
          onChange={async (v) => {
            setAnalyticsOptOut(v);
            await fetch("/api/v1/me/analytics", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ optOut: v }),
            });
          }}
        />
        <label className="flex items-center justify-between py-2">
          <span>Timezone</span>
          <select
            value={timezone}
            onChange={async (e) => {
              const tz = e.target.value;
              setTimezone(tz);
              await fetch("/api/v1/me/timezone", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ timezone: tz }),
              });
            }}
            className="px-2 py-1 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-sm"
          >
            <option value="">— pick one —</option>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz}>{tz}</option>
            ))}
            {timezone && !COMMON_TIMEZONES.includes(timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
          </select>
        </label>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-[color:var(--color-overlay1)] mb-3">
          Danger zone
        </h2>
        <form action="/api/v1/me/unsubscribe" method="POST">
          <button
            type="submit"
            className="text-sm text-[color:var(--color-red)] underline"
          >
            Unsubscribe & revoke all tokens
          </button>
        </form>
      </section>
    </div>
  );
}

function CreateTokenForm({
  onCreate,
}: {
  onCreate: (scope: "api" | "rss" | "cli", label: string) => Promise<void>;
}) {
  const [scope, setScope] = useState<"api" | "rss" | "cli">("api");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onCreate(scope, label);
          setLabel("");
        } finally {
          setBusy(false);
        }
      }}
      className="flex gap-2 items-end"
    >
      <label className="flex flex-col text-xs">
        Scope
        <select
          value={scope}
          onChange={(e) =>
            setScope(e.target.value as "api" | "rss" | "cli")
          }
          className="mt-1 px-2 py-1 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)]"
        >
          <option value="api">api</option>
          <option value="rss">rss</option>
          <option value="cli">cli</option>
        </select>
      </label>
      <label className="flex flex-col text-xs flex-1">
        Label
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 px-2 py-1 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)]"
          placeholder="My laptop"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="px-3 py-1.5 rounded bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] text-sm font-medium disabled:opacity-50"
      >
        {busy ? "…" : "Create"}
      </button>
    </form>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void | Promise<void>;
}) {
  return (
    <label className="flex items-center justify-between py-2">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => void onChange(e.target.checked)}
      />
    </label>
  );
}

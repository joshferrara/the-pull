"use client";

import { useState } from "react";
import { PreferencesPanel } from "@/components/dashboard/preferences-panel";
import { TokensPanel, type TokenView } from "@/components/dashboard/tokens-panel";
import { DangerZone } from "@/components/dashboard/danger-zone";

interface Props {
  userId: string;
  initialPreferences: { emailEnabled: boolean; analyticsOptOut: boolean };
  initialTimezone: string;
  initialTokens: TokenView[];
}

export function DashboardClient(props: Props) {
  const [tokens, setTokens] = useState<TokenView[]>(props.initialTokens);

  async function refresh() {
    const resp = await fetch("/api/v1/auth/tokens");
    if (resp.ok) {
      const data = (await resp.json()) as { tokens: TokenView[] };
      setTokens(data.tokens);
    }
  }

  async function createToken(scope: TokenView["scope"], label: string): Promise<string | null> {
    const resp = await fetch("/api/v1/auth/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, label }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json().catch(() => null)) as { token?: string } | null;
    return data?.token ?? null;
  }

  async function revoke(id: string) {
    await fetch(`/api/v1/auth/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="space-y-10">
      <PreferencesPanel
        initialEmailEnabled={props.initialPreferences.emailEnabled}
        initialAnalyticsOptOut={props.initialPreferences.analyticsOptOut}
        initialTimezone={props.initialTimezone}
      />
      <TokensPanel
        tokens={tokens}
        onCreate={createToken}
        onRevoke={revoke}
        onRefresh={refresh}
      />
      <DangerZone />
    </div>
  );
}

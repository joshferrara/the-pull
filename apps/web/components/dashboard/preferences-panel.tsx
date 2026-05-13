"use client";

import { useState } from "react";
import { BoxFrame } from "@/components/terminal";

const TIMEZONES = [
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

interface Props {
  initialEmailEnabled: boolean;
  initialAnalyticsOptOut: boolean;
  initialTimezone: string;
}

export function PreferencesPanel({
  initialEmailEnabled,
  initialAnalyticsOptOut,
  initialTimezone,
}: Props) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(initialAnalyticsOptOut);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [flash, setFlash] = useState(false);

  function bump() {
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  }

  async function saveBool(path: string, key: string, value: boolean) {
    await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    bump();
  }

  async function saveTz(tz: string) {
    setTimezone(tz);
    await fetch("/api/v1/me/timezone", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timezone: tz }),
    });
    bump();
  }

  return (
    <section>
      <BoxFrame label="preferences">
        <dl className="grid grid-cols-[10rem_1fr] gap-y-3 gap-x-6 items-center font-mono text-[var(--text-caption)]">
          <dt className="text-[color:var(--color-overlay1)]">email delivery</dt>
          <dd>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={async (e) => {
                  setEmailEnabled(e.target.checked);
                  await saveBool("/api/v1/me/email", "enabled", e.target.checked);
                }}
              />
              <span className="text-[color:var(--color-text)]">{emailEnabled ? "on" : "off"}</span>
            </label>
          </dd>
          <dt className="text-[color:var(--color-overlay1)]">analytics</dt>
          <dd>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={analyticsOptOut}
                onChange={async (e) => {
                  setAnalyticsOptOut(e.target.checked);
                  await saveBool("/api/v1/me/analytics", "optOut", e.target.checked);
                }}
              />
              <span className="text-[color:var(--color-text)]">{analyticsOptOut ? "opted out" : "opted in"}</span>
            </label>
          </dd>
          <dt className="text-[color:var(--color-overlay1)]">timezone</dt>
          <dd>
            <select
              value={timezone}
              onChange={(e) => void saveTz(e.target.value)}
              className="px-2 py-1.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[var(--text-caption)] text-[color:var(--color-text)]"
            >
              <option value="">— pick one —</option>
              {TIMEZONES.map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
              {timezone && !TIMEZONES.includes(timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
            </select>
          </dd>
        </dl>
        <div
          className={
            "mt-3 font-mono text-[var(--text-micro)] text-[color:var(--color-prompt)] transition-opacity " +
            (flash ? "opacity-100" : "opacity-0")
          }
          aria-live="polite"
        >
          ✓ saved
        </div>
      </BoxFrame>
    </section>
  );
}

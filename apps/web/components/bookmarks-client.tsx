"use client";

import { useState } from "react";

interface Bookmark {
  id: string;
  url: string;
  sourceUrl?: string;
  sourceType: "twitter" | "manual" | "rss" | "share_sheet";
  sourceAuthor?: string;
  rawContent?: string;
  capturedAt: string;
}

export function BookmarksClient({ pending }: { pending: Bookmark[] }) {
  const [items] = useState(pending);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function syncTwitter() {
    setBusy("sync");
    const resp = await fetch("/api/cms/bookmarks/sync", { method: "POST" });
    setBusy(null);
    const data = (await resp.json().catch(() => ({}))) as {
      added?: number;
      skipped?: number;
      error?: string;
    };
    if (resp.ok) alert(`Added ${data.added}, skipped ${data.skipped}`);
    else alert(`Sync failed: ${data.error ?? resp.status}`);
    location.reload();
  }

  async function processSelected() {
    setBusy("process");
    const ids = selected.size > 0 ? Array.from(selected) : undefined;
    const resp = await fetch("/api/cms/bookmarks/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookmarkIds: ids }),
    });
    setBusy(null);
    if (resp.ok) {
      const data = (await resp.json()) as {
        processed: number;
        candidates: number;
      };
      alert(
        `Processed ${data.processed} bookmarks → ${data.candidates} candidates`,
      );
      location.reload();
    } else alert("Process failed");
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    await fetch("/api/cms/bookmarks/add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, note }),
    });
    setBusy(null);
    setUrl("");
    setNote("");
    location.reload();
  }

  async function ignore(id: string) {
    await fetch("/api/cms/bookmarks/ignore", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookmarkId: id }),
    });
    location.reload();
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => void syncTwitter()}
          disabled={busy === "sync"}
          className="px-3 py-2 rounded bg-[color:var(--color-blue)] text-[color:var(--color-crust)] text-sm font-medium disabled:opacity-50"
        >
          {busy === "sync" ? "Syncing…" : "Sync X bookmarks"}
        </button>
        <button
          onClick={() => void processSelected()}
          disabled={busy === "process" || items.length === 0}
          className="px-3 py-2 rounded bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] text-sm font-medium disabled:opacity-50"
        >
          {busy === "process"
            ? "Processing…"
            : selected.size > 0
              ? `Process ${selected.size}`
              : "Process all pending"}
        </button>
      </div>

      <form
        onSubmit={addManual}
        className="border border-[color:var(--color-surface1)] rounded p-3 space-y-2"
      >
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="w-full px-3 py-2 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-sm"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          className="w-full px-3 py-2 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-sm"
        />
        <button
          type="submit"
          disabled={busy === "add"}
          className="px-3 py-1.5 rounded bg-[color:var(--color-surface0)] text-sm"
        >
          Add bookmark
        </button>
      </form>

      <ul className="space-y-3">
        {items.map((b) => (
          <BookmarkRow
            key={b.id}
            b={b}
            selected={selected.has(b.id)}
            expanded={expanded.has(b.id)}
            onToggle={() => toggle(b.id)}
            onExpand={() => toggleExpand(b.id)}
            onIgnore={() => void ignore(b.id)}
          />
        ))}
        {items.length === 0 && (
          <li className="text-[color:var(--color-overlay1)] text-sm">
            No pending bookmarks. Sync or add one above.
          </li>
        )}
      </ul>
    </div>
  );
}

function BookmarkRow({
  b,
  selected,
  expanded,
  onToggle,
  onExpand,
  onIgnore,
}: {
  b: Bookmark;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onIgnore: () => void;
}) {
  const isTwitter = b.sourceType === "twitter";
  const tweetUrl = isTwitter ? (b.sourceUrl ?? b.url) : null;
  const primaryDestination =
    b.url && b.url !== tweetUrl ? b.url : null; // external link if present
  const captured = new Date(b.capturedAt).toLocaleString();
  const summaryText = trimForSummary(b.rawContent ?? "");
  const urlsInTweet = extractUrls(b.rawContent ?? "").filter(
    (u) => !u.startsWith("https://t.co/") && u !== tweetUrl,
  );

  return (
    <li className="border border-[color:var(--color-surface1)] rounded p-3 text-sm">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1"
          aria-label="Select bookmark"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[color:var(--color-text)] font-medium">
              {b.sourceAuthor ?? (isTwitter ? "(no author)" : "Manual")}
            </span>
            <span className="text-xs text-[color:var(--color-overlay1)] capitalize">
              {b.sourceType}
            </span>
            <span className="text-xs text-[color:var(--color-overlay1)]">
              · {captured}
            </span>
          </div>

          {summaryText && (
            <p
              className={
                "mt-2 text-[color:var(--color-subtext1)] whitespace-pre-wrap " +
                (expanded ? "" : "line-clamp-3")
              }
            >
              {summaryText}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {tweetUrl && (
              <a
                href={tweetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[color:var(--color-blue)] underline"
              >
                Open on X ↗
              </a>
            )}
            {primaryDestination && (
              <a
                href={primaryDestination}
                target="_blank"
                rel="noreferrer"
                className="text-[color:var(--color-blue)] underline break-all"
                title={primaryDestination}
              >
                Primary link → {hostnameOf(primaryDestination)}
              </a>
            )}
            {urlsInTweet.length > 0 && (
              <span className="text-[color:var(--color-overlay1)]">
                {urlsInTweet.length} link
                {urlsInTweet.length === 1 ? "" : "s"} in tweet
              </span>
            )}
            <button
              onClick={onExpand}
              className="text-[color:var(--color-overlay1)] underline"
            >
              {expanded ? "Collapse" : "Show full content"}
            </button>
            <button
              onClick={onIgnore}
              className="ml-auto text-[color:var(--color-red)] underline"
            >
              Ignore
            </button>
          </div>

          {expanded && urlsInTweet.length > 0 && (
            <ul className="mt-3 text-xs text-[color:var(--color-subtext0)] space-y-1">
              <li className="text-[color:var(--color-overlay1)] uppercase tracking-widest">
                URLs in tweet
              </li>
              {urlsInTweet.map((u) => (
                <li key={u}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[color:var(--color-blue)] underline break-all"
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

function trimForSummary(s: string): string {
  // Drop the trailing "URLs in tweet: ..." footer the sync appends — it's noise here.
  return s.replace(/\n*URLs in tweet:[^\n]*$/i, "").trim();
}

function extractUrls(s: string): string[] {
  const re = /https?:\/\/[^\s)\]]+/g;
  const out = new Set<string>();
  for (const m of s.matchAll(re)) {
    out.add(m[0].replace(/[.,;]+$/, ""));
  }
  return [...out];
}

function hostnameOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

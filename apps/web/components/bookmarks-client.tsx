"use client";

import { useState } from "react";

interface Bookmark {
  id: string;
  url: string;
  sourceType: "twitter" | "manual" | "rss" | "share_sheet";
  sourceAuthor?: string;
  capturedAt: string;
}

export function BookmarksClient({ pending }: { pending: Bookmark[] }) {
  const [items] = useState(pending);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

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
      alert(`Processed ${data.processed} bookmarks → ${data.candidates} candidates`);
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

  function toggle(id: string) {
    setSelected((prev) => {
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

      <ul className="space-y-2">
        {items.map((b) => (
          <li
            key={b.id}
            className="border border-[color:var(--color-surface1)] rounded p-3 text-sm"
          >
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(b.id)}
                onChange={() => toggle(b.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all"
                >
                  {b.url}
                </a>
                <p className="text-xs text-[color:var(--color-overlay1)] mt-1">
                  {b.sourceType}
                  {b.sourceAuthor ? ` · ${b.sourceAuthor}` : ""} · {b.capturedAt}
                </p>
              </div>
            </label>
          </li>
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

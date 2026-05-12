"use client";

import { useMemo, useState, useTransition } from "react";

type Importance = "low" | "medium" | "high";
type Decision = "undecided" | "keep" | "kill";
type Category =
  | "model"
  | "tool"
  | "protocol"
  | "research"
  | "business"
  | "meta";

interface Candidate {
  id: string;
  title: string;
  summary: string;
  commentary?: string;
  category: Category;
  tags: string[];
  importance: Importance;
  decision: Decision;
  links: Array<{
    url: string;
    label: string;
    type: "primary" | "reference" | "discussion";
  }>;
  source?: { type: string; url: string; author?: string };
  position?: number;
  readingTimeSeconds?: number;
}

interface Props {
  targetDate: string;
  candidates: Candidate[];
  editorNote: string;
  edition?: number;
  status: "draft" | "scheduled" | "published";
}

export function CmsBriefEditor(props: Props) {
  const [candidates, setCandidates] = useState(props.candidates);
  const [editorNote, setEditorNote] = useState(props.editorNote);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [, startTransition] = useTransition();

  const kept = useMemo(
    () => candidates.filter((c) => c.decision === "keep"),
    [candidates],
  );

  async function setDecision(id: string, decision: Decision) {
    setCandidates((cs) =>
      cs.map((c) => (c.id === id ? { ...c, decision } : c)),
    );
    await fetch("/api/cms/candidates/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
  }

  async function saveEdits(c: Candidate) {
    setCandidates((cs) => cs.map((x) => (x.id === c.id ? c : x)));
    setEditing(null);
    await fetch("/api/cms/candidates/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(c),
    });
  }

  async function saveAndSchedule(opts: { publishNow?: boolean }) {
    const resp = await fetch("/api/cms/brief/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: props.targetDate,
        editorNote,
        itemIds: kept.map((c) => c.id),
        publishNow: opts.publishNow,
      }),
    });
    if (!resp.ok) alert("save failed");
    else if (opts.publishNow) alert("published");
    else alert("scheduled for 6 AM ET");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between sticky top-12 z-10 bg-[color:var(--color-base)] py-3 border-b border-[color:var(--color-surface1)]">
        <div>
          <h1 className="text-xl font-bold">{props.targetDate}</h1>
          <p className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)]">
            {props.edition ? `Edition #${props.edition} · ` : ""}
            {props.status} · {kept.length} kept / {candidates.length} total
          </p>
        </div>
      </div>

      <section>
        <label className="block text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-1">
          Editor&apos;s note
        </label>
        <textarea
          value={editorNote}
          onChange={(e) => setEditorNote(e.target.value)}
          rows={3}
          placeholder="Two or three sentences identifying the day's narrative."
          className="w-full px-3 py-2 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-sm"
        />
      </section>

      <ManualItemAdder
        targetDate={props.targetDate}
        onAdded={(c) => setCandidates((cs) => [...cs, c])}
      />

      <ul className="space-y-3">
        {candidates.map((c) => (
          <li
            key={c.id}
            className={
              "rounded-lg border p-3 " +
              (c.decision === "keep"
                ? "border-[color:var(--color-green)]"
                : c.decision === "kill"
                  ? "border-[color:var(--color-red)] opacity-50"
                  : "border-[color:var(--color-surface1)]")
            }
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{c.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-[color:var(--color-overlay1)]">
                  <span className="px-1.5 py-0.5 rounded bg-[color:var(--color-mantle)]">
                    {c.category}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[color:var(--color-mantle)]">
                    {c.importance}
                  </span>
                  {c.tags.slice(0, 3).map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </div>
                <p className="text-sm text-[color:var(--color-subtext0)] mt-2 line-clamp-2">
                  {c.summary}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => startTransition(() => void setDecision(c.id, "keep"))}
                className="flex-1 py-2 rounded bg-[color:var(--color-green)] text-[color:var(--color-crust)] text-sm font-medium"
              >
                Keep
              </button>
              <button
                onClick={() => startTransition(() => void setDecision(c.id, "kill"))}
                className="flex-1 py-2 rounded bg-[color:var(--color-red)] text-[color:var(--color-crust)] text-sm font-medium"
              >
                Kill
              </button>
              <button
                onClick={() => setEditing(c)}
                className="flex-1 py-2 rounded bg-[color:var(--color-surface0)] text-sm"
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 bg-[color:var(--color-mantle)] border-t border-[color:var(--color-surface1)] p-3 flex gap-2">
        <button
          onClick={() => void saveAndSchedule({ publishNow: false })}
          className="flex-1 py-3 rounded bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-semibold"
        >
          Schedule for 6 AM ET
        </button>
        <button
          onClick={() => {
            if (confirm("Publish immediately?"))
              void saveAndSchedule({ publishNow: true });
          }}
          className="px-3 rounded bg-[color:var(--color-surface0)] text-sm"
        >
          Publish now
        </button>
      </div>

      {editing && (
        <CandidateEditor
          candidate={editing}
          onCancel={() => setEditing(null)}
          onSave={(c) => void saveEdits(c)}
          onSaveAndNext={(c) => {
            void saveEdits(c);
            const idx = candidates.findIndex((x) => x.id === c.id);
            const next =
              candidates.slice(idx + 1).find((x) => x.decision !== "kill") ??
              candidates.find((x) => x.decision !== "kill" && x.id !== c.id);
            setEditing(next ?? null);
          }}
        />
      )}
    </div>
  );
}

type LinkType = "primary" | "reference" | "discussion";

function estimateReadingTimeSecs(args: { summary?: string; commentary?: string }): number {
  const words =
    (args.summary?.trim().split(/\s+/).length ?? 0) +
    (args.commentary?.trim().split(/\s+/).length ?? 0);
  if (words === 0) return 0;
  return Math.max(15, Math.round((words / 200) * 60));
}

function CandidateEditor({
  candidate,
  onCancel,
  onSave,
  onSaveAndNext,
}: {
  candidate: Candidate;
  onCancel: () => void;
  onSave: (c: Candidate) => void;
  onSaveAndNext: (c: Candidate) => void;
}) {
  const [draft, setDraft] = useState(candidate);
  const [readingOverride, setReadingOverride] = useState<number | null>(
    null,
  );
  // Re-seed when the parent rotates to the next candidate.
  if (draft.id !== candidate.id) {
    setDraft(candidate);
    setReadingOverride(null);
  }
  const autoReading = estimateReadingTimeSecs({
    summary: draft.summary,
    commentary: draft.commentary,
  });
  const reading = readingOverride ?? autoReading;
  const draftWithReading: Candidate = { ...draft, readingTimeSeconds: reading };
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[color:var(--color-mantle)] rounded-t-2xl sm:rounded-2xl p-4 border border-[color:var(--color-surface1)]">
        <h2 className="text-lg font-semibold mb-3">Edit item</h2>
        <Field label="Title">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)]"
          />
        </Field>
        <Field label="Summary">
          <textarea
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)]"
          />
        </Field>
        <Field label="Commentary">
          <textarea
            value={draft.commentary ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, commentary: e.target.value })
            }
            rows={5}
            className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)]"
          />
        </Field>
        <Field label="Category">
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value as Category })
            }
            className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)]"
          >
            {["model", "tool", "protocol", "research", "business", "meta"].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </Field>
        <Field label="Importance">
          <select
            value={draft.importance}
            onChange={(e) =>
              setDraft({ ...draft, importance: e.target.value as Importance })
            }
            className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)]"
          >
            {["low", "medium", "high"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Tags (comma separated)">
          <input
            value={draft.tags.join(", ")}
            onChange={(e) =>
              setDraft({
                ...draft,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)]"
          />
        </Field>
        <Field label="Links">
          <LinksEditor
            value={draft.links}
            onChange={(links) => setDraft({ ...draft, links })}
          />
        </Field>
        <Field label="Reading time (seconds)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={reading}
              onChange={(e) =>
                setReadingOverride(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="w-32 px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)]"
            />
            <span className="text-xs text-[color:var(--color-overlay1)]">
              auto: {autoReading}s · override applies on save
            </span>
            {readingOverride !== null && (
              <button
                onClick={() => setReadingOverride(null)}
                className="text-xs underline text-[color:var(--color-blue)]"
              >
                reset
              </button>
            )}
          </div>
        </Field>
        {draft.source && (
          <Field label="Source (read-only)">
            <div className="px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)] text-sm text-[color:var(--color-subtext0)]">
              <div>
                <span className="text-[color:var(--color-overlay1)]">type:</span>{" "}
                {draft.source.type}
                {draft.source.author && (
                  <>
                    {" · "}
                    <span className="text-[color:var(--color-overlay1)]">author:</span>{" "}
                    {draft.source.author}
                  </>
                )}
              </div>
              <a
                href={draft.source.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-xs text-[color:var(--color-blue)]"
              >
                {draft.source.url}
              </a>
            </div>
          </Field>
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onSaveAndNext(draftWithReading)}
            className="flex-1 py-2 rounded bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium"
          >
            Save &amp; Next
          </button>
          <button
            onClick={() => onSave(draftWithReading)}
            className="py-2 px-3 rounded bg-[color:var(--color-surface0)] text-sm"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-[color:var(--color-surface0)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function ManualItemAdder({
  targetDate,
  onAdded,
}: {
  targetDate: string;
  onAdded: (c: Candidate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<Category>("meta");
  const [importance, setImportance] = useState<Importance>("medium");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const resp = await fetch("/api/cms/candidates/manual-add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetDate,
        title,
        summary,
        category,
        importance,
        links: url ? [{ url, label: "Primary", type: "primary" }] : [],
      }),
    });
    setBusy(false);
    if (!resp.ok) {
      alert("add failed");
      return;
    }
    const data = (await resp.json()) as { id: string };
    onAdded({
      id: data.id,
      title,
      summary,
      category,
      tags: [],
      importance,
      decision: "undecided",
      links: url ? [{ url, label: "Primary", type: "primary" }] : [],
    });
    setTitle("");
    setSummary("");
    setUrl("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-3 py-2 rounded border border-dashed border-[color:var(--color-surface1)] text-sm text-[color:var(--color-overlay1)] hover:text-[color:var(--color-text)]"
      >
        + Add manual item
      </button>
    );
  }
  return (
    <form
      onSubmit={add}
      className="border border-[color:var(--color-surface1)] rounded p-3 space-y-2"
    >
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)] text-sm"
      />
      <textarea
        required
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Summary"
        rows={3}
        className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)] text-sm"
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Primary link URL (optional)"
        className="w-full px-3 py-2 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)] text-sm"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="flex-1 px-2 py-1 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)] text-sm"
        >
          {["model", "tool", "protocol", "research", "business", "meta"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={importance}
          onChange={(e) => setImportance(e.target.value as Importance)}
          className="flex-1 px-2 py-1 rounded bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)] text-sm"
        >
          {["low", "medium", "high"].map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 py-2 rounded bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium disabled:opacity-50"
        >
          {busy ? "…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2 rounded bg-[color:var(--color-surface0)] text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const LINK_TYPES: LinkType[] = ["primary", "reference", "discussion"];

function LinksEditor({
  value,
  onChange,
}: {
  value: Candidate["links"];
  onChange: (links: Candidate["links"]) => void;
}) {
  const update = (i: number, patch: Partial<Candidate["links"][number]>) => {
    onChange(value.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  return (
    <div className="space-y-2">
      {value.map((link, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-1 sm:gap-2 bg-[color:var(--color-crust)] border border-[color:var(--color-surface1)] rounded p-2 text-sm"
        >
          <input
            value={link.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Label"
            className="flex-1 px-2 py-1 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-sm"
          />
          <input
            value={link.url}
            onChange={(e) => update(i, { url: e.target.value })}
            placeholder="https://…"
            className="flex-[2] px-2 py-1 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-sm"
          />
          <select
            value={link.type}
            onChange={(e) =>
              update(i, { type: e.target.value as LinkType })
            }
            className="px-2 py-1 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-sm"
          >
            {LINK_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="text-xs text-[color:var(--color-red)] px-2"
            aria-label="Remove link"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...value, { label: "", url: "", type: "reference" }])
        }
        className="text-xs px-2 py-1 rounded bg-[color:var(--color-surface0)]"
      >
        + Add link
      </button>
    </div>
  );
}

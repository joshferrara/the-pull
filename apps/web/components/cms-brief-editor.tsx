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
        />
      )}
    </div>
  );
}

function CandidateEditor({
  candidate,
  onCancel,
  onSave,
}: {
  candidate: Candidate;
  onCancel: () => void;
  onSave: (c: Candidate) => void;
}) {
  const [draft, setDraft] = useState(candidate);
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
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onSave(draft)}
            className="flex-1 py-2 rounded bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium"
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

import type { Brief } from "@the-pull/schema";

interface Props { brief: Brief | null }

export function LivePreviewPane({ brief }: Props) {
  return (
    <div className="rounded-lg border border-[color:var(--color-rule)] p-6 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
      [live preview placeholder · {brief ? `ed.#${brief.edition}` : "no brief"}]
    </div>
  );
}

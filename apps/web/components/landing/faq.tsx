import { AsciiRule, MetaChip } from "@/components/terminal";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "What if I already follow AI news?",
    a: "If you can confidently say you saw every important release, paper, and tool in the last week — you don't need this. If you can't, that's exactly what The Pull is for. 7ish items, curated, no scroll required.",
  },
  {
    q: "What's in it?",
    a: (
      <>
        Items are tagged by category — a typical week covers{" "}
        <MetaChip label="models" />{" "}
        <MetaChip label="tooling" />{" "}
        <MetaChip label="research" />{" "}
        <MetaChip label="products" />{" "}
        — plus the odd thing that doesn&apos;t fit a box.
      </>
    ),
  },
  {
    q: "Pricing?",
    a: "Free while I figure out what's worth charging for. A paid tier may show up later for richer formats, but the daily brief itself stays free.",
  },
];

export function Faq() {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-20">
      <AsciiRule label="faq" number="03" />
      <div className="mt-6 divide-y divide-[color:var(--color-rule)] max-w-[var(--w-wide)]">
        {FAQ.map((f) => (
          <details
            key={f.q}
            className="group py-4"
          >
            <summary className="cursor-pointer list-none flex items-baseline gap-3 font-mono text-[var(--text-body-sm)] text-[color:var(--color-text)]">
              <span className="text-[color:var(--color-mauve)]">Q.</span>
              <span className="flex-1">{f.q}</span>
              <span className="text-[color:var(--color-overlay1)] transition-transform group-open:rotate-90">▸</span>
            </summary>
            <div className="mt-3 ml-8 text-[var(--text-body-sm)] text-[color:var(--color-subtext1)] leading-relaxed">
              {f.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

import { AsciiRule } from "@/components/terminal";

const DEAL = [
  {
    head: "I read the web so you don't have to",
    body: "Every weekday I scour Twitter, GitHub, Hacker News, papers, and dev blogs for the AI news that actually matters to people who ship code.",
  },
  {
    head: "7ish items. Yesterday's signal.",
    body: "Not a feed. Not a daily roundup of everything. The handful of things that moved the needle for AI-adjacent builders in the last 24 hours.",
  },
  {
    head: "Read it where you already are",
    body: "Terminal, agent, inbox, or feed reader. One brief, four channels, six AM ET.",
  },
];

export function TheDeal() {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-20">
      <AsciiRule label="the deal" number="02" />
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {DEAL.map((d) => (
          <div key={d.head}>
            <h3 className="font-mono text-[var(--text-body-sm)] text-[color:var(--color-text)]">
              <span className="text-[color:var(--color-overlay1)]">[ </span>
              {d.head}
              <span className="text-[color:var(--color-overlay1)]"> ]</span>
            </h3>
            <p className="mt-3 text-[var(--text-body-sm)] text-[color:var(--color-subtext1)] leading-relaxed">
              {d.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

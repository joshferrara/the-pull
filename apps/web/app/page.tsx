import Link from "next/link";
import { TabSwitcher } from "@/components/tab-switcher";
import { EmailSignup } from "@/components/email-signup";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { getBriefJson } from "@/lib/r2";


async function getLatestPreview() {
  const latest = await convexClient().query(api.briefs.getLatestPublished);
  if (!latest) return null;
  const brief = await getBriefJson(latest.date);
  if (!brief) return null;
  return brief;
}

export default async function LandingPage() {
  const brief = await getLatestPreview();

  return (
    <main className="min-h-screen">
      <header className="px-6 pt-10 pb-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-[color:var(--color-mauve)] font-mono text-sm">
          <span>~/the-pull</span>
          <span className="text-[color:var(--color-overlay0)]">$</span>
          <span className="animate-pulse">▮</span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[color:var(--color-text)] leading-tight">
          The daily AI brief,
          <br />
          <span className="text-[color:var(--color-mauve)]">delivered where you actually work.</span>
        </h1>
        <p className="mt-6 text-lg text-[color:var(--color-subtext1)] max-w-xl">
          For developers who can&apos;t keep up with AI but need to. Weekday
          mornings, in your terminal, agent, inbox, or feed reader.
        </p>

        <div className="mt-10">
          <TabSwitcher />
        </div>

        <div className="mt-6 text-sm text-[color:var(--color-subtext0)]">
          Or get it{" "}
          <button
            data-tab-trigger="email"
            className="underline underline-offset-2 text-[color:var(--color-blue)]"
          >
            in your inbox
          </button>
          .
        </div>

        <div id="email" className="mt-12 max-w-md">
          <EmailSignup />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-10 border-t border-[color:var(--color-surface1)]">
        <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-4">
          Today&apos;s preview
        </h2>
        {brief ? (
          <div>
            <p className="text-sm text-[color:var(--color-subtext0)] mb-3">
              Edition #{brief.edition} · {brief.date} ·{" "}
              {brief.items.length} items
            </p>
            <ul className="space-y-2">
              {brief.items.map((item, i) => (
                <li key={item.id} className="flex gap-3 text-[color:var(--color-text)]">
                  <span className="text-[color:var(--color-overlay0)] font-mono text-sm pt-1 w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="ml-2 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[color:var(--color-surface0)] text-[color:var(--color-subtext0)]">
                      {item.category}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm">
              <Link
                href="#email"
                className="text-[color:var(--color-mauve)]"
              >
                Unlock full content with signup →
              </Link>
            </p>
          </div>
        ) : (
          <p className="text-[color:var(--color-overlay1)] text-sm">
            First edition lands soon. Sign up above to get it in your inbox.
          </p>
        )}
      </section>

      <section className="max-w-3xl mx-auto px-6 py-10 border-t border-[color:var(--color-surface1)]">
        <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-6">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-[color:var(--color-subtext1)]">
          <div>
            <div className="text-[color:var(--color-peach)] font-mono mb-2">01 · Curate</div>
            <p>
              Throughout the day I bookmark links. An agent drafts summaries
              from each, then I cut to the 7 that actually matter.
            </p>
          </div>
          <div>
            <div className="text-[color:var(--color-yellow)] font-mono mb-2">02 · Render</div>
            <p>
              One markdown source compiles into JSON, RSS, HTML, and email.
              Every channel gets the same content, formatted for its medium.
            </p>
          </div>
          <div>
            <div className="text-[color:var(--color-green)] font-mono mb-2">03 · Deliver</div>
            <p>
              At 6 AM ET, your terminal, agent, inbox, and feed reader all
              get today&apos;s brief. Read on whichever you reach for first.
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-3xl mx-auto px-6 py-12 border-t border-[color:var(--color-surface1)] text-sm text-[color:var(--color-overlay1)] flex flex-wrap gap-x-6 gap-y-3">
        <Link href="/archive">Archive</Link>
        <Link href="/brief/latest">Today&apos;s brief</Link>
        <a href="https://github.com/josh-ferrara/the-pull">GitHub</a>
        <span className="ml-auto">by Josh Ferrara</span>
      </footer>
    </main>
  );
}

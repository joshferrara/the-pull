import { notFound } from "next/navigation";
import Link from "next/link";
import { getBriefJson } from "@/lib/r2";
import { verifyWebToken } from "@/lib/auth";
import { isPreview, toPreview } from "@the-pull/schema";
import type { Metadata } from "next";


interface PageProps {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { date } = await params;
  const brief = await getBriefJson(date);
  if (!brief) return { title: "The Pull" };
  return {
    title: `The Pull — Edition #${brief.edition} (${brief.date})`,
    description: brief.editor_note,
    openGraph: {
      title: `The Pull — Edition #${brief.edition}`,
      description: brief.editor_note,
      url: `https://thepull.dev/brief/${brief.date}`,
    },
  };
}

export default async function BriefPage({ params, searchParams }: PageProps) {
  const { date } = await params;
  const { t: signedToken } = await searchParams;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const brief = await getBriefJson(date);
  if (!brief) notFound();

  let unlocked = false;
  if (signedToken) {
    const verified = await verifyWebToken(signedToken);
    if (verified && verified.briefDate === date) unlocked = true;
  }

  const display = unlocked ? brief : toPreview(brief);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)]">
          The Pull · Edition #{display.edition}
        </p>
        <h1 className="text-3xl font-bold mt-2 text-[color:var(--color-text)]">
          {formatDate(display.date)}
        </h1>
        {!isPreview(display) && display.editor_note && (
          <p className="mt-4 text-[color:var(--color-subtext1)] italic border-l-2 border-[color:var(--color-mauve)] pl-3">
            {display.editor_note}
          </p>
        )}
      </header>

      <ol className="space-y-10">
        {display.items.map((item, i) => (
          <li key={item.id} className="brief-prose">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
              <span className="text-[color:var(--color-overlay0)] font-mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[color:var(--color-subtext0)]">
                {item.category}
              </span>
              <span className="text-[color:var(--color-overlay1)]">
                {item.importance}
              </span>
            </div>
            <h2>{item.title}</h2>
            {!isPreview(display) && "summary" in item && item.summary && (
              <p>{item.summary}</p>
            )}
            {!isPreview(display) && "commentary" in item && item.commentary && (
              <blockquote>{item.commentary}</blockquote>
            )}
            {!isPreview(display) && "links" in item && item.links && (
              <ol>
                {item.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url}>{link.label}</a>{" "}
                    <em className="text-xs text-[color:var(--color-overlay0)]">
                      ({link.type})
                    </em>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>

      {isPreview(display) && (
        <div className="mt-12 p-4 rounded-lg bg-[color:var(--color-mantle)] border border-[color:var(--color-surface1)] text-center text-sm">
          <p className="text-[color:var(--color-subtext1)]">
            Sign up to unlock full summaries, commentary, and links.
          </p>
          <Link
            href="/#email"
            className="inline-block mt-3 px-4 py-2 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium"
          >
            Get the brief in your inbox
          </Link>
        </div>
      )}

      <footer className="mt-16 text-sm text-[color:var(--color-overlay1)] border-t border-[color:var(--color-surface1)] pt-6">
        Get this in your terminal:{" "}
        <code className="text-[color:var(--color-text)]">
          curl -fsSL https://thepull.dev/install | sh
        </code>
      </footer>
    </main>
  );
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

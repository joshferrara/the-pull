import { notFound } from "next/navigation";
import { getBriefJson } from "@/lib/r2";
import { verifyWebToken } from "@/lib/auth";
import { isPreview, toPreview } from "@the-pull/schema";
import type { Metadata } from "next";
import { StatusBar } from "@/components/terminal";
import { BriefHeader } from "@/components/brief/brief-header";
import { BriefItem } from "@/components/brief/brief-item";
import { PreviewGate } from "@/components/brief/preview-gate";
import { ProgressBar } from "@/components/brief/progress-bar";
import { AnchorRail } from "@/components/brief/anchor-rail";
import { KeyboardShortcuts } from "@/components/brief/keyboard-shortcuts";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const brief = await getBriefJson(date);
  if (!brief) return { title: "The Pull" };
  const site = process.env.SITE_URL ?? "https://thepull.dev";
  const ogImage = `${site}/brief/${brief.date}/og.svg`;
  return {
    title: `The Pull — Edition #${brief.edition} (${brief.date})`,
    description: brief.editor_note,
    openGraph: {
      title: `The Pull — Edition #${brief.edition}`,
      description: brief.editor_note,
      url: `${site}/brief/${brief.date}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `The Pull — Edition #${brief.edition}`,
      description: brief.editor_note,
      images: [ogImage],
    },
  };
}

const FREE_ITEMS = 3;

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
  const preview = isPreview(display);
  const editorNote = !preview && "editor_note" in display ? display.editor_note : undefined;

  return (
    <article className="max-w-[var(--w-prose)] mx-auto px-6 py-12">
      <ProgressBar />
      <AnchorRail count={display.items.length} />
      <KeyboardShortcuts count={display.items.length} />
      <BriefHeader
        edition={display.edition}
        date={display.date}
        itemCount={display.items.length}
        editorNote={editorNote}
      />

      <ol className="space-y-12 list-none p-0">
        {display.items.map((item, i) => {
          const gated = preview && i >= FREE_ITEMS;
          return (
            <BriefItem
              key={item.id}
              item={item}
              index={i}
              isLast={i === display.items.length - 1}
              isPreview={gated}
            />
          );
        })}
      </ol>

      {preview && <PreviewGate remaining={Math.max(0, display.items.length - FREE_ITEMS)} />}

      <footer className="mt-20 pt-6 border-t border-[color:var(--color-rule)] font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
        Get this in your terminal:{" "}
        <code className="text-[color:var(--color-text)]">
          curl -fsSL https://thepull.dev/install | sh
        </code>
      </footer>

      <StatusBar edition={display.edition} date={display.date} path={`~/brief/${display.date}`} />
    </article>
  );
}

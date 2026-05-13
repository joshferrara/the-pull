import { notFound } from "next/navigation";
import { getBriefJson } from "@/lib/r2";
import { verifyWebToken } from "@/lib/auth";
import type { BriefItem, BriefPreview } from "@the-pull/schema";
import type { Metadata } from "next";
import { StatusBar } from "@/components/terminal";
import { BriefHeader } from "@/components/brief/brief-header";
import { BriefItem as BriefItemView } from "@/components/brief/brief-item";
import { PreviewGate } from "@/components/brief/preview-gate";
import { ProgressBar } from "@/components/brief/progress-bar";
import { AnchorRail } from "@/components/brief/anchor-rail";
import { KeyboardShortcuts } from "@/components/brief/keyboard-shortcuts";
import { EditionNav } from "@/components/brief/edition-nav";

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

type PreviewItem = BriefPreview["items"][number];

function previewItem(item: BriefItem): PreviewItem {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    importance: item.importance,
    tags: item.tags,
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

  // When locked, render full content for the first FREE_ITEMS, preview shape for the rest.
  const displayItems: Array<{ item: BriefItem | PreviewItem; isPreview: boolean }> = unlocked
    ? brief.items.map((item) => ({ item, isPreview: false }))
    : brief.items.map((item, i) => ({
        item: i < FREE_ITEMS ? item : previewItem(item),
        isPreview: i >= FREE_ITEMS,
      }));

  const editorNote = unlocked ? brief.editor_note : undefined;
  const lockedCount = unlocked ? 0 : Math.max(0, brief.items.length - FREE_ITEMS);

  return (
    <article className="max-w-[var(--w-prose)] mx-auto px-6 py-12">
      <ProgressBar />
      <AnchorRail count={brief.items.length} />
      <KeyboardShortcuts count={brief.items.length} />
      <BriefHeader
        edition={brief.edition}
        date={brief.date}
        itemCount={brief.items.length}
        editorNote={editorNote}
      />

      <ol className="space-y-12 list-none p-0">
        {displayItems.map((row, i) => (
          <BriefItemView
            key={row.item.id}
            item={row.item}
            index={i}
            isLast={i === displayItems.length - 1}
            isPreview={row.isPreview}
          />
        ))}
      </ol>

      {!unlocked && lockedCount > 0 && <PreviewGate remaining={lockedCount} />}

      <EditionNav date={brief.date} />

      <StatusBar edition={brief.edition} date={brief.date} path={`~/brief/${brief.date}`} />
    </article>
  );
}

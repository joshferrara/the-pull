import { NextRequest, NextResponse } from "next/server";
import { requireCmsSession } from "@/lib/cms-guard";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export async function POST(req: NextRequest) {
  try {
    await requireCmsSession();
  } catch (resp) {
    return resp as Response;
  }
  const body = (await req.json()) as {
    id?: string;
    title?: string;
    summary?: string;
    commentary?: string;
    category?: "model" | "tool" | "protocol" | "research" | "business" | "meta";
    tags?: string[];
    importance?: "low" | "medium" | "high";
    links?: Array<{
      url: string;
      label: string;
      type: "primary" | "reference" | "discussion";
    }>;
    readingTimeSeconds?: number;
    position?: number;
  };
  if (!body.id)
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  await convexClient().mutation(api.candidates.updateFields, {
    candidateId: body.id as never,
    title: body.title,
    summary: body.summary,
    commentary: body.commentary,
    category: body.category,
    tags: body.tags,
    importance: body.importance,
    links: body.links,
    readingTimeSeconds: body.readingTimeSeconds,
    position: body.position,
  });
  return NextResponse.json({ ok: true });
}

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
    targetDate?: string;
    title?: string;
    summary?: string;
    category?: "model" | "tool" | "protocol" | "research" | "business" | "meta";
    importance?: "low" | "medium" | "high";
    links?: Array<{ url: string; label: string; type: "primary" | "reference" | "discussion" }>;
  };
  if (!body.targetDate || !body.title || !body.summary || !body.category || !body.importance) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const id = await convexClient().mutation(api.candidates.manualAdd, {
    targetDate: body.targetDate,
    title: body.title,
    summary: body.summary,
    category: body.category,
    importance: body.importance,
    links: body.links ?? [],
  });
  return NextResponse.json({ id });
}

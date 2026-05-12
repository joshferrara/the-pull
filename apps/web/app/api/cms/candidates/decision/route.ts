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
    decision?: "undecided" | "keep" | "kill";
  };
  if (!body.id || !body.decision)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await convexClient().mutation(api.candidates.setDecision, {
    candidateId: body.id as never,
    decision: body.decision,
  });
  return NextResponse.json({ ok: true });
}

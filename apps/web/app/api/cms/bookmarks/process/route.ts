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
  const body = (await req.json().catch(() => ({}))) as {
    bookmarkIds?: string[];
    targetDate?: string;
  };
  const result = await convexClient().action(api.agent.processPending, {
    bookmarkIds: body.bookmarkIds as never,
    targetDate: body.targetDate,
  });
  return NextResponse.json(result);
}

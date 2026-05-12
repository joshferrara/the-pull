import { NextResponse } from "next/server";
import { requireCmsSession } from "@/lib/cms-guard";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export async function POST() {
  try {
    await requireCmsSession();
  } catch (resp) {
    return resp as Response;
  }
  const result = await convexClient().action(api.agent.syncTwitterBookmarks, {});
  return NextResponse.json(result);
}

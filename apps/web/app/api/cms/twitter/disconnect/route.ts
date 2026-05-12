import { NextResponse } from "next/server";
import { requireCmsSession } from "@/lib/cms-guard";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { siteUrl } from "@/lib/env";

export async function GET() {
  let session;
  try {
    session = await requireCmsSession();
  } catch (resp) {
    return resp as Response;
  }
  await convexClient().mutation(api.twitter_auth.clear, {
    curatorEmail: session.email,
  });
  return NextResponse.redirect(`${siteUrl()}/cms/settings?twitter=disconnected`);
}

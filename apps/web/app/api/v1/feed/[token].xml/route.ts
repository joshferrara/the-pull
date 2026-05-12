import { NextRequest } from "next/server";
import { authenticateToken } from "@/lib/tokens";
import { getBriefArtifact } from "@/lib/r2";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const auth = await authenticateToken(token);
  if (!auth || auth.token.scope === "cli") {
    return new Response("Unauthorized", { status: 401 });
  }
  const latest = await convexClient().query(api.briefs.getLatestPublished);
  if (!latest) return new Response("Not found", { status: 404 });
  const rss = await getBriefArtifact(latest.date, "xml");
  if (!rss) return new Response("Feed missing", { status: 500 });
  return new Response(rss.body, {
    headers: {
      "content-type": rss.contentType,
      "cache-control": "public, max-age=900, s-maxage=900",
    },
  });
}

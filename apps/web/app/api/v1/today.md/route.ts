import { NextRequest } from "next/server";
import { authenticateBearer, checkRateLimit } from "@/lib/tokens";
import { getBriefArtifact } from "@/lib/r2";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export async function GET(req: NextRequest) {
  const auth = await authenticateBearer(req);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }
  const rl = await checkRateLimit(auth.token.token, auth.token.scope);
  if (!rl.allowed) {
    return new Response("Rate limit exceeded", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }
  const latest = await convexClient().query(api.briefs.getLatestPublished);
  if (!latest) return new Response("Not found", { status: 404 });
  const md = await getBriefArtifact(latest.date, "md");
  if (!md) return new Response("Artifact missing", { status: 500 });
  return new Response(md.body, {
    headers: {
      "content-type": md.contentType,
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}

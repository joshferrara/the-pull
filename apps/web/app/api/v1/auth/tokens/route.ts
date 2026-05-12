import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/tokens";
import { readSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


/** GET: list tokens for the authenticated user (via session OR bearer). */
export async function GET(req: NextRequest) {
  const bearer = await authenticateBearer(req);
  const session = await readSession();
  const userId = bearer?.user._id ?? session?.userId;
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tokens = await convexClient().query(api.tokens.listForUser, {
    userId,
  });
  return NextResponse.json({
    tokens: tokens.map((t) => ({
      id: t._id,
      token: t.token,
      scope: t.scope,
      label: t.label,
      created_at: new Date(t.createdAt).toISOString(),
      last_used_at: t.lastUsedAt
        ? new Date(t.lastUsedAt).toISOString()
        : null,
      revoked: !!t.revokedAt,
    })),
  });
}

/** POST: create a new token for the authenticated user. */
export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { scope?: "api" | "rss" | "cli"; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const scope = body.scope ?? "api";
  const { id, token } = await convexClient().mutation(api.tokens.create, {
    userId: session.userId,
    scope,
    label: body.label,
  });
  return NextResponse.json({ id, token, scope, label: body.label });
}

/** DELETE: revoke a token (id in query string). */
export async function DELETE(req: NextRequest) {
  const session = await readSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  await convexClient().mutation(api.tokens.revoke, {
    tokenId: id as never,
  });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { requireCmsSession } from "@/lib/cms-guard";
import { bindings, siteUrl } from "@/lib/env";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  scope: string;
}

interface MeResponse {
  data?: { id: string; username: string; name: string };
}

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireCmsSession();
  } catch (resp) {
    return resp as Response;
  }
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }
  if (!code || !state) {
    return NextResponse.json({ error: "missing_code_or_state" }, { status: 400 });
  }
  const env = bindings();
  const stash = await env.TOKENS_KV.get<{ verifier: string }>(
    `twitter_oauth:${state}`,
    "json",
  );
  if (!stash) {
    return NextResponse.json({ error: "state_expired_or_invalid" }, { status: 400 });
  }
  await env.TOKENS_KV.delete(`twitter_oauth:${state}`);

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "client_creds_missing" }, { status: 500 });
  }

  const redirectUri = `${siteUrl()}/api/cms/twitter/callback`;
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier: stash.verifier,
    client_id: clientId,
  });
  const basic = btoa(`${clientId}:${clientSecret}`);
  const resp = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!resp.ok) {
    const detail = await resp.text();
    return NextResponse.json(
      { error: "token_exchange_failed", status: resp.status, detail: detail.slice(0, 500) },
      { status: 500 },
    );
  }
  const tokens = (await resp.json()) as TokenResponse;

  // Resolve the X user id once so syncTwitterBookmarks doesn't have to.
  const me = await fetch("https://api.x.com/2/users/me", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  const meData = me.ok ? ((await me.json()) as MeResponse) : null;
  const userId = meData?.data?.id ?? "";

  await convexClient().mutation(api.twitter_auth.set, {
    curatorEmail: session.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope,
    userId,
  });
  return NextResponse.redirect(`${siteUrl()}/cms/settings?twitter=connected`);
}

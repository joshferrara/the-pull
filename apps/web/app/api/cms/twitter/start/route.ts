import { NextResponse } from "next/server";
import { requireCmsSession } from "@/lib/cms-guard";
import { generateCodeVerifier, codeChallenge, randomState } from "@/lib/pkce";
import { bindings, siteUrl } from "@/lib/env";

/**
 * Kicks off X (Twitter) OAuth 2.0 PKCE. We need the user-context auth flow
 * because /2/users/:id/bookmarks rejects app-only bearer tokens.
 */
export async function GET() {
  try {
    await requireCmsSession();
  } catch (resp) {
    return resp as Response;
  }
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error: "TWITTER_CLIENT_ID not set",
        hint: "Set the OAuth 2.0 Client ID (from developer.x.com → your app → OAuth 2.0 settings) as a worker secret.",
      },
      { status: 400 },
    );
  }
  const verifier = generateCodeVerifier();
  const challenge = await codeChallenge(verifier);
  const state = randomState();

  // Stash verifier + state in KV so the callback can verify them.
  const env = bindings();
  await env.TOKENS_KV.put(
    `twitter_oauth:${state}`,
    JSON.stringify({ verifier, createdAt: Date.now() }),
    { expirationTtl: 600 },
  );

  const redirectUri = `${siteUrl()}/api/cms/twitter/callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "tweet.read users.read bookmark.read offline.access",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(`https://x.com/i/oauth2/authorize?${params}`);
}

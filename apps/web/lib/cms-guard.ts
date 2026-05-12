import { readSession, isCmsEmail } from "./auth";

/** Throws Response 403 if the request isn't from the CMS curator. */
export async function requireCmsSession() {
  const session = await readSession();
  if (!session || !isCmsEmail(session.email)) {
    throw new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return session;
}

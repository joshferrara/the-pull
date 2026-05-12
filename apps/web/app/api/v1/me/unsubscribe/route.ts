import { NextResponse } from "next/server";
import { readSession, destroySession } from "@/lib/auth";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export async function POST() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await convexClient().mutation(api.users.unsubscribe, {
    userId: session.userId,
  });
  await destroySession();
  return NextResponse.redirect(new URL("/", process.env.SITE_URL ?? "https://thepull.dev"));
}

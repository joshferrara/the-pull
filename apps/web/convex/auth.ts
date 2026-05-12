import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

const CODE_TTL_MS = 15 * 60 * 1000;

function randomCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  // 8-digit numeric code (more email-friendly than tokens for the magic link path).
  return Array.from(bytes)
    .map((b) => (b % 10).toString())
    .join("")
    .padStart(8, "0");
}

export const createAuthCode = mutation({
  args: {
    email: v.string(),
    purpose: v.union(
      v.literal("signup"),
      v.literal("login"),
      v.literal("dashboard_reauth"),
    ),
  },
  handler: async (ctx, { email, purpose }) => {
    const normalized = email.trim().toLowerCase();
    const code = randomCode();
    const id = await ctx.db.insert("authCodes", {
      email: normalized,
      code,
      expiresAt: Date.now() + CODE_TTL_MS,
      purpose,
    });
    return { codeId: id, code, email: normalized };
  },
});

export const consumeAuthCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const row = await ctx.db
      .query("authCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!row) return { ok: false as const, reason: "not_found" as const };
    if (row.consumedAt) return { ok: false as const, reason: "consumed" as const };
    if (row.expiresAt < Date.now())
      return { ok: false as const, reason: "expired" as const };
    await ctx.db.patch(row._id, { consumedAt: Date.now() });
    return {
      ok: true as const,
      email: row.email,
      purpose: row.purpose,
    };
  },
});

export const cleanupExpiredCodes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const stale = await ctx.db.query("authCodes").collect();
    let deleted = 0;
    for (const row of stale) {
      if ((row.consumedAt ?? row.expiresAt) < cutoff) {
        await ctx.db.delete(row._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) =>
        q.eq("email", email.trim().toLowerCase()),
      )
      .first();
  },
});

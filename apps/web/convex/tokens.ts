import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TOKEN_PREFIX = "tp_";

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    TOKEN_PREFIX +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export const create = mutation({
  args: {
    userId: v.id("users"),
    scope: v.union(v.literal("api"), v.literal("rss"), v.literal("cli")),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = randomToken();
    const id = await ctx.db.insert("tokens", {
      userId: args.userId,
      token,
      scope: args.scope,
      label: args.label,
      createdAt: Date.now(),
    });
    return { id, token };
  },
});

export const revoke = mutation({
  args: { tokenId: v.id("tokens") },
  handler: async (ctx, { tokenId }) => {
    await ctx.db.patch(tokenId, { revokedAt: Date.now() });
  },
});

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("tokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const lookup = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const t = await ctx.db
      .query("tokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!t || t.revokedAt) return null;
    const user = await ctx.db.get(t.userId);
    if (!user || user.status !== "active") return null;
    return { token: t, user };
  },
});

export const touch = mutation({
  args: { tokenId: v.id("tokens") },
  handler: async (ctx, { tokenId }) => {
    await ctx.db.patch(tokenId, { lastUsedAt: Date.now() });
  },
});

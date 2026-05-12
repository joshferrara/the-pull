/**
 * Admin one-offs. These should not be exposed publicly. Convex run access
 * is gated on the deploy key, so they are practically curator-only.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** Permanently delete all bookmarks of a given source type (e.g., "twitter"). */
export const wipeBookmarksBySource = mutation({
  args: { sourceType: v.string() },
  handler: async (ctx, { sourceType }) => {
    const all = await ctx.db.query("bookmarks").collect();
    let deleted = 0;
    for (const b of all) {
      if (b.sourceType === sourceType) {
        await ctx.db.delete(b._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

/** Reset a bookmark to pending so it can be re-processed. */
export const reactivateBookmark = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, { bookmarkId }) => {
    await ctx.db.patch(bookmarkId, {
      status: "pending",
      candidateId: undefined,
    });
  },
});

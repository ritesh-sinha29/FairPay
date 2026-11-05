import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { requireUser } from "./lib/access";
import { ConvexError } from "convex/values";

export const me = query({
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) return null;
    const user = await ctx.db.get(id);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
      headline: user.headline ?? "",
    };
  },
});

export const freelancers = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.role !== "client")
      throw new ConvexError("Client accounts can choose freelancers.");
    const users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "freelancer"))
      .take(100);
    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      walletAddress: user.walletAddress,
      headline: user.headline ?? "",
    }));
  },
});

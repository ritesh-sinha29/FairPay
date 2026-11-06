import { internalMutation, internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { role } from "./schema";

export const issue = internalMutation({
  args: {
    address: v.string(),
    message: v.string(),
    expiresAt: v.number(),
    flow: v.union(v.literal("signUp"), v.literal("signIn")),
    role: v.optional(role),
    name: v.optional(v.string()),
    headline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const previous = await ctx.db
      .query("walletChallenges")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .collect();
    if (
      previous.some((challenge) => challenge._creationTime > Date.now() - 2000)
    )
      throw new ConvexError(
        "Please wait a moment before requesting another signature.",
      );
    const active = previous.filter((challenge) => challenge.expiresAt > Date.now());
    if (active.length >= 5)
      throw new ConvexError(
        "Too many pending signature requests. Please complete or wait for them to expire.",
      );
    for (const challenge of previous) {
      if (challenge.expiresAt <= Date.now()) {
        await ctx.db.delete(challenge._id);
      }
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.address))
      .unique();
    if (args.flow === "signUp" && existing)
      throw new ConvexError(
        "This wallet already has an account. Sign in instead.",
      );
    if (args.flow === "signIn" && !existing)
      throw new ConvexError(
        "Create a client or freelancer account for this wallet first.",
      );
    return ctx.db.insert("walletChallenges", args);
  },
});

export const get = internalQuery({
  args: { id: v.id("walletChallenges") },
  handler: (ctx, args) => ctx.db.get(args.id),
});

export const consume = internalMutation({
  args: { id: v.id("walletChallenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    if (!challenge || challenge.expiresAt <= Date.now())
      throw new ConvexError(
        "Your signature request expired or was already used. Please try again.",
      );
    await ctx.db.delete(args.id);
    const remaining = await ctx.db
      .query("walletChallenges")
      .withIndex("by_address", (q) => q.eq("address", challenge.address))
      .collect();
    for (const c of remaining) {
      await ctx.db.delete(c._id);
    }
    return challenge;
  },
});

export const removeExpired = internalMutation({
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("walletChallenges")
      .withIndex("by_expiry", (q) => q.lte("expiresAt", Date.now()))
      .take(1000);
    for (const challenge of expired) await ctx.db.delete(challenge._id);
  },
});

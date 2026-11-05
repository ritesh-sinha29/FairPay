"use node";

import { randomBytes } from "node:crypto";
import { getAddress, isAddress, verifyMessage } from "ethers";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { role } from "./schema";
import type { Doc } from "./_generated/dataModel";

export const begin = action({
  args: {
    address: v.string(),
    flow: v.union(v.literal("signUp"), v.literal("signIn")),
    role: v.optional(role),
    name: v.optional(v.string()),
    headline: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ challengeId: string; message: string }> => {
    if (!isAddress(args.address))
      throw new ConvexError("Connect a valid Ethereum wallet.");
    const address = getAddress(args.address).toLowerCase();
    const name = args.name?.trim();
    if (
      args.flow === "signUp" &&
      (!args.role ||
        !name ||
        name.length < 2 ||
        name.length > 80 ||
        /[\r\n]/.test(name))
    )
      throw new ConvexError(
        "Choose your role and enter a name between 2 and 80 characters.",
      );
    if (args.headline && args.headline.length > 160)
      throw new ConvexError("Keep your headline under 160 characters.");
    const site = new URL(process.env.SITE_URL!);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const purpose =
      args.flow === "signUp"
        ? `Create a FairPay ${args.role} account for ${name}.`
        : "Sign in to your FairPay account.";
    const message = `${site.host} wants you to sign in with your Ethereum account:\n${getAddress(address)}\n\n${purpose}\n\nURI: ${site.origin}\nVersion: 1\nChain ID: 11155111\nNonce: ${randomBytes(16).toString("hex")}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(expiresAt).toISOString()}`;
    const challengeId = await ctx.runMutation(internal.wallets.issue, {
      ...args,
      address,
      message,
      expiresAt,
      ...(name ? { name } : {}),
    });
    return { challengeId, message };
  },
});

export const verify = internalAction({
  args: { challengeId: v.id("walletChallenges"), signature: v.string() },
  handler: async (ctx, args): Promise<Doc<"walletChallenges">> => {
    const challenge = await ctx.runQuery(internal.wallets.get, {
      id: args.challengeId,
    });
    if (!challenge || challenge.expiresAt <= Date.now())
      throw new ConvexError(
        "Your signature request expired. Please try again.",
      );
    let signer: string;
    try {
      signer = verifyMessage(challenge.message, args.signature).toLowerCase();
    } catch {
      throw new ConvexError("The wallet signature could not be verified.");
    }
    if (signer !== challenge.address)
      throw new ConvexError(
        "The signature does not match the selected wallet.",
      );
    return ctx.runMutation(internal.wallets.consume, { id: args.challengeId });
  },
});

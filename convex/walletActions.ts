"use node";

import { randomBytes } from "node:crypto";
import {
  getAddress,
  isAddress,
  verifyMessage,
  hashMessage,
  Contract,
  JsonRpcProvider,
} from "ethers";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { role } from "./schema";
import type { Doc } from "./_generated/dataModel";
import { ARC_TESTNET, SEPOLIA, paymentNetwork } from "../src/lib/payments";

export const begin = action({
  args: {
    address: v.string(),
    chainId: v.optional(v.number()),
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
    const chainId = args.chainId ?? SEPOLIA.chainId;
    if (chainId !== ARC_TESTNET.chainId && chainId !== SEPOLIA.chainId)
      throw new ConvexError("Switch your wallet to Arc Testnet or Sepolia to sign in.");
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
    const message = `${site.host} wants you to sign in with your Ethereum account:\n${getAddress(address)}\n\n${purpose}\n\nURI: ${site.origin}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${randomBytes(16).toString("hex")}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(expiresAt).toISOString()}`;
    const challengeId = await ctx.runMutation(internal.wallets.issue, {
      ...args,
      address,
      chainId,
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
    let isValid = false;
    try {
      const signer = verifyMessage(challenge.message, args.signature).toLowerCase();
      if (signer === challenge.address) {
        isValid = true;
      }
    } catch {
      // ECDSA verification failed, might be a smart contract wallet (EIP-1271)
    }

    if (!isValid) {
      try {
        const hash = hashMessage(challenge.message);
        const chainId = challenge.chainId ?? SEPOLIA.chainId;
        const network = paymentNetwork(chainId);
        const rpcUrl =
          (chainId === ARC_TESTNET.chainId ? process.env.ARC_RPC_URL : process.env.SEPOLIA_RPC_URL) || network.rpcUrl;
        const provider = new JsonRpcProvider(rpcUrl, chainId, {
          staticNetwork: true,
          batchMaxCount: 1,
        });
        try {
          if (Number(await provider.send("eth_chainId", [])) !== chainId)
            throw new Error("Signature RPC returned the wrong chain.");
          const code = await provider.getCode(challenge.address);
          if (code && code !== "0x") {
            const contract = new Contract(
              challenge.address,
              ["function isValidSignature(bytes32,bytes) view returns (bytes4)"],
              provider,
            );
            const magicValue = await contract.isValidSignature(
              hash,
              args.signature,
            );
            if (magicValue === "0x1626ba7e") {
              isValid = true;
            }
          }
        } finally {
          provider.destroy();
        }
      } catch {
        // Not a valid EIP-1271 contract signature
      }
    }

    if (!isValid)
      throw new ConvexError(
        "The signature does not match the selected wallet.",
      );
    return ctx.runMutation(internal.wallets.consume, { id: args.challengeId });
  },
});

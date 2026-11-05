"use node";

import { JsonRpcProvider } from "ethers";
import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ARC_TESTNET, paymentNetwork } from "../src/lib/payments";
import { verifyEscrowState } from "../src/lib/verify-escrow";

function providerFor(chainId: number) {
  const network = paymentNetwork(chainId);
  return new JsonRpcProvider(
    (chainId === ARC_TESTNET.chainId
      ? process.env.ARC_RPC_URL
      : process.env.SEPOLIA_RPC_URL) || network.rpcUrl,
    chainId,
    { staticNetwork: true },
  );
}

export const sync = action({
  args: { jobId: v.id("jobs"), fundingHash: v.optional(v.string()) },
  handler: async (ctx, args): Promise<void> => {
    const job = await ctx.runQuery(internal.jobs.forAction, {
      jobId: args.jobId,
    });
    const provider = providerFor(job.chainId);
    try {
      const fundingHash = job.contractAddress
        ? job.fundingHash
        : args.fundingHash || job.fundingHash;
      if (!fundingHash)
        throw new ConvexError(
          "Enter the escrow deployment transaction hash to recover this job.",
        );
      const verified = await verifyEscrowState(provider, job, fundingHash);
      await ctx.runMutation(internal.jobs.saveVerified, {
        jobId: job._id,
        ...verified,
      });
    } finally {
      provider.destroy();
    }
  },
});

export const resetFailedFunding = action({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args): Promise<void> => {
    const job = await ctx.runQuery(internal.jobs.forAction, args);
    if (
      job.clientId !== (await getAuthUserId(ctx)) ||
      job.status !== "Draft" ||
      !job.fundingHash ||
      job.contractAddress
    )
      throw new ConvexError(
        "Only the client can reset a failed escrow deployment.",
      );
    const provider = providerFor(job.chainId);
    try {
      if (Number(await provider.send("eth_chainId", [])) !== job.chainId)
        throw new ConvexError("The RPC returned the wrong network.");
      const [transaction, receipt] = await Promise.all([
        provider.getTransaction(job.fundingHash),
        provider.getTransactionReceipt(job.fundingHash),
      ]);
      if (!receipt || !transaction)
        throw new ConvexError(
          "This attempt is pending or unavailable. Wait or recover its replacement transaction hash.",
        );
      if (transaction.from.toLowerCase() !== job.clientAddress)
        throw new ConvexError(
          "This transaction was not sent by the assigned client.",
        );
      if (receipt.status === 1 && receipt.contractAddress)
        throw new ConvexError(
          "This transaction deployed a contract. Verify it before sending another deposit.",
        );
      await ctx.runMutation(internal.jobs.clearFailedFunding, {
        jobId: job._id,
        expectedHash: job.fundingHash,
      });
    } finally {
      provider.destroy();
    }
  },
});

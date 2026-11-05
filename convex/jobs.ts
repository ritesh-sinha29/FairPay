import { v, ConvexError } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { requireJob, requireUser } from "./lib/access";
import { status } from "./schema";
import { ARC_TESTNET } from "../src/lib/payments";

async function withNames(
  ctx: Parameters<typeof requireUser>[0],
  job: Awaited<ReturnType<typeof requireJob>>["job"],
) {
  const [client, freelancer] = await Promise.all([
    ctx.db.get(job.clientId),
    ctx.db.get(job.freelancerId),
  ]);
  return {
    ...job,
    clientName: client?.name ?? "Client",
    freelancerName: freelancer?.name ?? "Freelancer",
  };
}

export const list = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const jobs =
      user.role === "client"
        ? await ctx.db
            .query("jobs")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .order("desc")
            .collect()
        : await ctx.db
            .query("jobs")
            .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
            .order("desc")
            .collect();
    return Promise.all(jobs.map((job) => withNames(ctx, job)));
  },
});

export const get = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || (job.clientId !== user._id && job.freelancerId !== user._id))
      return null;
    return withNames(ctx, job);
  },
});

export const create = mutation({
  args: {
    freelancerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    amountWei: v.string(),
    paymentAsset: v.optional(v.string()),
    paymentTokenAddress: v.optional(v.string()),
    tokenDecimals: v.optional(v.number()),
    chainId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const client = await requireUser(ctx);
    if (client.role !== "client")
      throw new ConvexError("Only client accounts can create jobs.");
    const freelancer = await ctx.db.get(args.freelancerId);
    if (
      !freelancer ||
      freelancer.role !== "freelancer" ||
      freelancer._id === client._id
    )
      throw new ConvexError("Choose a registered freelancer.");
    const title = args.title.trim();
    const description = args.description.trim();
    if (!title || new TextEncoder().encode(title).length > 160)
      throw new ConvexError("Enter a title of up to 160 UTF-8 bytes.");
    if (description.length < 20 || description.length > 6000)
      throw new ConvexError("Describe the job in 20 to 6,000 characters.");
    if (!/^\d{1,60}$/.test(args.amountWei) || BigInt(args.amountWei) <= 0n)
      throw new ConvexError("Enter a positive payment amount.");
    return ctx.db.insert("jobs", {
      clientId: client._id,
      freelancerId: freelancer._id,
      clientAddress: client.walletAddress,
      freelancerAddress: freelancer.walletAddress,
      title,
      description,
      amountWei: BigInt(args.amountWei).toString(),
      chainId: args.chainId ?? ARC_TESTNET.chainId,
      paymentAsset: args.paymentAsset ?? "USDC",
      paymentTokenAddress: args.paymentTokenAddress,
      tokenDecimals: args.tokenDecimals,
      status: "Draft",
      updatedAt: Date.now(),
    });
  },
});

export const accept = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const { user, job } = await requireJob(ctx, args.jobId);
    if (job.freelancerId !== user._id || job.status !== "Draft")
      throw new ConvexError(
        "Only the assigned freelancer can agree to this proposed job.",
      );
    if (job.acceptedAt) return;
    await ctx.db.patch(job._id, {
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reserveFunding = mutation({
  args: { jobId: v.id("jobs"), token: v.string() },
  handler: async (ctx, args) => {
    const { user, job } = await requireJob(ctx, args.jobId);
    if (job.clientId !== user._id || job.status !== "Draft")
      throw new ConvexError("Only the client can fund a draft job.");
    if (!job.acceptedAt)
      throw new ConvexError(
        "The freelancer must agree to the job before you lock the payment.",
      );
    if (args.token.length < 20 || args.token.length > 80)
      throw new ConvexError("Invalid funding request.");
    if (job.fundingHash)
      throw new ConvexError(
        "A funding transaction is already recorded. Check its confirmation first.",
      );
    if (
      job.fundingReservation &&
      job.reservationExpiresAt! > Date.now() &&
      job.fundingReservation !== args.token
    )
      throw new ConvexError(
        "A funding request is already open. Finish it in the original tab or wait for it to expire.",
      );
    await ctx.db.patch(job._id, {
      fundingReservation: args.token,
      reservationExpiresAt: Date.now() + 10 * 60 * 1000,
    });
  },
});

export const recordFunding = mutation({
  args: { jobId: v.id("jobs"), token: v.string(), hash: v.string() },
  handler: async (ctx, args) => {
    const { user, job } = await requireJob(ctx, args.jobId);
    if (
      job.clientId !== user._id ||
      job.status !== "Draft" ||
      !job.acceptedAt ||
      job.fundingReservation !== args.token
    )
      throw new ConvexError("This funding request is no longer active.");
    if (!/^0x[a-fA-F0-9]{64}$/.test(args.hash))
      throw new ConvexError("Invalid transaction hash.");
    await ctx.db.patch(job._id, { fundingHash: args.hash });
  },
});

export const releaseReservation = mutation({
  args: { jobId: v.id("jobs"), token: v.string() },
  handler: async (ctx, args) => {
    const { user, job } = await requireJob(ctx, args.jobId);
    if (
      job.clientId === user._id &&
      job.status === "Draft" &&
      !job.fundingHash &&
      job.fundingReservation === args.token
    ) {
      await ctx.db.patch(job._id, {
        fundingReservation: undefined,
        reservationExpiresAt: undefined,
      });
    }
  },
});

export const submitDelivery = mutation({
  args: { jobId: v.id("jobs"), note: v.string(), url: v.string() },
  handler: async (ctx, args) => {
    const { user, job } = await requireJob(ctx, args.jobId);
    if (
      job.freelancerId !== user._id ||
      !["Funded", "Submitted"].includes(job.status)
    )
      throw new ConvexError(
        "Only the assigned freelancer can submit delivery for a funded job.",
      );
    const note = args.note.trim();
    if (note.length < 10 || note.length > 4000)
      throw new ConvexError("Add a delivery note of 10 to 4,000 characters.");
    let url: URL;
    try {
      url = new URL(args.url);
    } catch {
      throw new ConvexError("Enter a valid HTTPS deliverable link.");
    }
    if (url.protocol !== "https:" || args.url.length > 2048)
      throw new ConvexError("Use an HTTPS deliverable link.");
    await ctx.db.patch(job._id, {
      submissionNote: note,
      deliverableUrl: url.href,
      updatedAt: Date.now(),
    });
  },
});

export const forAction = internalQuery({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => (await requireJob(ctx, args.jobId)).job,
});

export const saveVerified = internalMutation({
  args: {
    jobId: v.id("jobs"),
    contractAddress: v.string(),
    status,
    block: v.number(),
    fundingHash: v.string(),
  },
  handler: async (ctx, args) => {
    const { job } = await requireJob(ctx, args.jobId);
    if (job.status === "Draft" && !job.acceptedAt && !job.fundingHash)
      throw new ConvexError(
        "The freelancer must agree to this job before funding can be recorded.",
      );
    const other = await ctx.db
      .query("jobs")
      .withIndex("by_contract", (q) =>
        q
          .eq("chainId", job.chainId)
          .eq("contractAddress", args.contractAddress),
      )
      .unique();
    if (other && other._id !== job._id)
      throw new ConvexError(
        "This contract is already attached to another job.",
      );
    if (job.contractAddress && job.contractAddress !== args.contractAddress)
      throw new ConvexError(
        "A different escrow is already attached to this job.",
      );
    if (job.verifiedBlock !== undefined && job.verifiedBlock > args.block)
      return;
    await ctx.db.patch(job._id, {
      contractAddress: args.contractAddress,
      fundingHash: args.fundingHash,
      status: args.status,
      verifiedAt: Date.now(),
      verifiedBlock: args.block,
      updatedAt: job.status === args.status ? job.updatedAt : Date.now(),
      fundingReservation: undefined,
      reservationExpiresAt: undefined,
    });
  },
});

export const clearFailedFunding = internalMutation({
  args: { jobId: v.id("jobs"), expectedHash: v.string() },
  handler: async (ctx, args) => {
    const { user, job } = await requireJob(ctx, args.jobId);
    if (
      job.clientId !== user._id ||
      job.status !== "Draft" ||
      job.fundingHash !== args.expectedHash
    )
      throw new ConvexError("This funding attempt can no longer be reset.");
    await ctx.db.patch(job._id, {
      fundingHash: undefined,
      fundingReservation: undefined,
      reservationExpiresAt: undefined,
    });
  },
});

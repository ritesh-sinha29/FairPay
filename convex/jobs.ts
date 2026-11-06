import { v, ConvexError } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
  action,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireJob, requireUser } from "./lib/access";
import { status } from "./schema";
import { ARC_TESTNET } from "../src/lib/payments";
import { isArkivKey, verifiedAwardTerms } from "./lib/arkivAward";

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
    const targetChainId = args.chainId ?? ARC_TESTNET.chainId;
    if (![ARC_TESTNET.chainId, 11155111].includes(targetChainId))
      throw new ConvexError("Unsupported blockchain payment network.");
    return ctx.db.insert("jobs", {
      clientId: client._id,
      freelancerId: freelancer._id,
      clientAddress: client.walletAddress,
      freelancerAddress: freelancer.walletAddress,
      title,
      description,
      amountWei: BigInt(args.amountWei).toString(),
      chainId: targetChainId,
      paymentAsset: args.paymentAsset ?? "USDC",
      paymentTokenAddress: args.paymentTokenAddress,
      tokenDecimals: args.tokenDecimals,
      status: "Draft",
      updatedAt: Date.now(),
    });
  },
});

export const arkivAwardStates = query({
  args: { entityKeys: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.entityKeys.length > 100) throw new ConvexError("Too many listings.");
    if (args.entityKeys.some(key => !isArkivKey(key))) throw new ConvexError("Invalid listing key.");
    const keys = [...new Set(args.entityKeys.map((key) => key.toLowerCase()))];
    const states = await Promise.all(keys.map(async (entityKey) => {
      const deal = await ctx.db.query("jobs").withIndex("by_arkiv_entity", q => q.eq("arkivEntityKey", entityKey)).unique();
      return deal ? { entityKey, awarded: true } : null;
    }));
    return states.filter((state): state is { entityKey: string; awarded: boolean } => state !== null);
  },
});

export const forArkiv = query({
  args: { entityKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const job = await ctx.db.query("jobs").withIndex("by_arkiv_entity", q => q.eq("arkivEntityKey", args.entityKey.toLowerCase())).unique();
    if (!job || (job.clientId !== userId && job.freelancerId !== userId)) return null;
    return { jobId: job._id, proposalKey: job.arkivProposalKey, status: job.status, acceptedAt: job.acceptedAt };
  },
});

export const arkivAwardContext = internalQuery({
  args: { entityKey: v.string(), proposalKey: v.string() },
  handler: async (ctx, args) => {
    const client = await requireUser(ctx);
    if (client.role !== "client") throw new ConvexError("Only clients can accept proposals.");
    const existing = await ctx.db.query("jobs").withIndex("by_arkiv_entity", q => q.eq("arkivEntityKey", args.entityKey.toLowerCase())).unique();
    if (existing && (existing.clientId !== client._id || existing.arkivProposalKey !== args.proposalKey.toLowerCase())) {
      throw new ConvexError("A different proposal has already been accepted for this listing.");
    }
    return { walletAddress: client.walletAddress, existingJobId: existing?._id };
  },
});

export const createFromArkiv = internalMutation({
  args: {
    entityKey: v.string(), proposalKey: v.string(), freelancerAddress: v.string(),
    title: v.string(), description: v.string(), amountWei: v.string(),
    chainId: v.number(), paymentAsset: v.string(), tokenDecimals: v.number(),
    paymentTokenAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await requireUser(ctx);
    if (client.role !== "client") throw new ConvexError("Only clients can accept proposals.");
    const entityKey = args.entityKey.toLowerCase();
    const proposalKey = args.proposalKey.toLowerCase();
    const existing = await ctx.db.query("jobs").withIndex("by_arkiv_entity", q => q.eq("arkivEntityKey", entityKey)).unique();
    if (existing) {
      if (existing.clientId === client._id && existing.arkivProposalKey === proposalKey) return existing._id;
      throw new ConvexError("A different proposal has already been accepted for this listing.");
    }
    const freelancer = await ctx.db.query("users").withIndex("by_wallet", q => q.eq("walletAddress", args.freelancerAddress.toLowerCase())).unique();
    if (!freelancer || freelancer.role !== "freelancer" || freelancer._id === client._id) {
      throw new ConvexError("The applicant must have a registered freelancer account for this wallet.");
    }
    return ctx.db.insert("jobs", {
      clientId: client._id, freelancerId: freelancer._id,
      clientAddress: client.walletAddress, freelancerAddress: freelancer.walletAddress,
      title: args.title, description: args.description, amountWei: args.amountWei,
      chainId: args.chainId, paymentAsset: args.paymentAsset, tokenDecimals: args.tokenDecimals,
      paymentTokenAddress: args.paymentTokenAddress,
      arkivEntityKey: entityKey, arkivProposalKey: proposalKey,
      status: "Draft", updatedAt: Date.now(),
    });
  },
});

export const awardArkivProposal = action({
  args: {
    entityKey: v.string(), proposalKey: v.string(), scope: v.string(),
    currency: v.union(v.literal("arc-usdc"), v.literal("sepolia-eth")),
  },
  handler: async (ctx, args): Promise<Id<"jobs">> => {
    if (!isArkivKey(args.entityKey) || !isArkivKey(args.proposalKey)) throw new ConvexError("Invalid Arkiv listing or proposal key.");
    const context = await ctx.runQuery(internal.jobs.arkivAwardContext, { entityKey: args.entityKey, proposalKey: args.proposalKey });
    if (context.existingJobId) return context.existingJobId;
    const site = process.env.SITE_URL;
    if (!site) throw new ConvexError("The application origin is not configured.");
    async function read(path: string) {
      const response = await fetch(new URL(path, site), { signal: AbortSignal.timeout(10000), redirect: "error" });
      if (!response.ok) throw new ConvexError("Could not verify the live listing and proposal. Refresh and try again.");
      return response.json();
    }
    const [listing, application] = await Promise.all([
      read(`/api/arkiv/entities?key=${encodeURIComponent(args.entityKey)}`),
      read(`/api/arkiv/proposals?key=${encodeURIComponent(args.proposalKey)}`),
    ]);
    let terms;
    try {
      terms = verifiedAwardTerms({ ...args, clientAddress: context.walletAddress, job: listing.entity, proposal: application.proposal });
    } catch (error) {
      throw new ConvexError(error instanceof Error ? error.message : "Invalid proposal terms.");
    }
    return ctx.runMutation(internal.jobs.createFromArkiv, { entityKey: args.entityKey, proposalKey: args.proposalKey, ...terms });
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

import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface RecoveryArgs {
  walletAddress: string;
  previousUserId: Id<"users">;
  authAccountId: Id<"authAccounts">;
  jobIds: Id<"jobs">[];
  name: string;
  apply?: boolean;
}

// Called only by an internal mutation with deployment-admin credentials.
export async function recoverDeletedFreelancer(ctx: MutationCtx, args: RecoveryArgs) {
  const walletAddress = args.walletAddress.toLowerCase();
  const name = args.name.trim();
  if (!/^0x[0-9a-f]{40}$/.test(walletAddress) || name.length < 2 || name.length > 80 || /[\r\n]/.test(name))
    throw new ConvexError("Invalid recovery profile.");
  if (await ctx.db.get(args.previousUserId))
    throw new ConvexError("The original user still exists. Recovery stopped.");
  if (await ctx.db.query("users").withIndex("by_wallet", q => q.eq("walletAddress", walletAddress)).unique())
    throw new ConvexError("This wallet already has a profile. Recovery stopped.");
  const account = await ctx.db.get(args.authAccountId);
  if (!account || account.provider !== "wallet" || account.providerAccountId.toLowerCase() !== walletAddress || account.userId !== args.previousUserId)
    throw new ConvexError("The audited wallet login no longer matches.");
  const accounts = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", q => q.eq("userId", args.previousUserId)).collect();
  if (accounts.length !== 1 || accounts[0]._id !== account._id)
    throw new ConvexError("Unexpected additional login links. Recovery stopped.");
  const clientJobs = await ctx.db.query("jobs").withIndex("by_client", q => q.eq("clientId", args.previousUserId)).collect();
  const jobs = await ctx.db.query("jobs").withIndex("by_freelancer", q => q.eq("freelancerId", args.previousUserId)).collect();
  const expected = new Set(args.jobIds);
  if (clientJobs.length || !jobs.length || expected.size !== args.jobIds.length || jobs.length !== expected.size || jobs.some(job => !expected.has(job._id) || job.freelancerAddress.toLowerCase() !== walletAddress))
    throw new ConvexError("The audited freelancer job links no longer match.");
  const plan = { walletAddress, previousUserId: args.previousUserId, authAccountId: account._id, jobIds: jobs.map(job => job._id), name, role: "freelancer" as const };
  if (args.apply !== true) return { applied: false, ...plan };

  // All changes commit atomically. Existing sessions are not moved; the user
  // must sign in again with the same wallet after recovery.
  const userId = await ctx.db.insert("users", { walletAddress, name, role: "freelancer", headline: "" });
  await ctx.db.patch(account._id, { userId });
  for (const job of jobs) await ctx.db.patch(job._id, { freelancerId: userId });
  return { applied: true, userId, ...plan };
}

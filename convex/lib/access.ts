import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const id = await getAuthUserId(ctx);
  const user = id ? await ctx.db.get(id) : null;
  if (!user) throw new ConvexError("Sign in to continue.");
  return user;
}

export async function requireJob(
  ctx: QueryCtx | MutationCtx,
  jobId: Id<"jobs">,
) {
  const user = await requireUser(ctx);
  const job = await ctx.db.get(jobId);
  if (!job || (job.clientId !== user._id && job.freelancerId !== user._id)) {
    throw new ConvexError("This job is unavailable for your account.");
  }
  return { user, job };
}

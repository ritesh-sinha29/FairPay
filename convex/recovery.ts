import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { recoverDeletedFreelancer } from "./lib/userRecovery";

// Internal/admin-only: never exposed as a public recovery or sign-in endpoint.
export const restoreDeletedFreelancer = internalMutation({
  args: {
    walletAddress: v.string(),
    previousUserId: v.id("users"),
    authAccountId: v.id("authAccounts"),
    jobIds: v.array(v.id("jobs")),
    name: v.string(),
    apply: v.optional(v.boolean()),
  },
  handler: recoverDeletedFreelancer,
});

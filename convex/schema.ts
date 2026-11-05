import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const role = v.union(v.literal("client"), v.literal("freelancer"));
export const status = v.union(
  v.literal("Draft"),
  v.literal("Funded"),
  v.literal("Submitted"),
  v.literal("Paid"),
);

export default defineSchema({
  ...authTables,
  users: defineTable({
    ...authTables.users.validator.fields,
    name: v.string(),
    role,
    walletAddress: v.string(),
    headline: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_wallet", ["walletAddress"])
    .index("by_role", ["role"]),
  walletChallenges: defineTable({
    address: v.string(),
    message: v.string(),
    expiresAt: v.number(),
    flow: v.union(v.literal("signUp"), v.literal("signIn")),
    role: v.optional(role),
    name: v.optional(v.string()),
    headline: v.optional(v.string()),
  })
    .index("by_address", ["address"])
    .index("by_expiry", ["expiresAt"]),
  jobs: defineTable({
    clientId: v.id("users"),
    freelancerId: v.id("users"),
    clientAddress: v.string(),
    freelancerAddress: v.string(),
    title: v.string(),
    description: v.string(),
    amountWei: v.string(),
    paymentAsset: v.optional(v.literal("USDC")),
    chainId: v.number(),
    status,
    acceptedAt: v.optional(v.number()),
    contractAddress: v.optional(v.string()),
    fundingHash: v.optional(v.string()),
    fundingReservation: v.optional(v.string()),
    reservationExpiresAt: v.optional(v.number()),
    submissionNote: v.optional(v.string()),
    deliverableUrl: v.optional(v.string()),
    updatedAt: v.number(),
    verifiedAt: v.optional(v.number()),
    verifiedBlock: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_freelancer", ["freelancerId"])
    .index("by_contract", ["chainId", "contractAddress"]),
});

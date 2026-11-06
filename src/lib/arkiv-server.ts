import "server-only";
import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import type { FullEntity } from "@arkiv-network/sdk/query";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import {
  arkivBlockTimestamp,
  buildArkivQuery,
  type ArkivJobEntity,
  type ArkivProposalEntity,
} from "./arkiv";

export const isEntityKey = (key: string) => /^0x[0-9a-fA-F]{64}$/.test(key);
export const ARKIV_CATEGORIES = new Set(["smart-contracts", "frontend", "fullstack", "security-audit", "design"]);
const statuses = new Set(["open", "awarded", "in-review", "completed", "expired"]);

function chain() {
  return rabdi({ accessKey: process.env.ARKIV_ACCESS_KEY || process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY || "" });
}

export function arkivReader() {
  return createPublicClient({ chain: chain(), transport: http(undefined, { timeout: 6000, retryCount: 0 }) });
}

export function arkivWriter() {
  const key = process.env.ARKIV_PRIVATE_KEY;
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("Arkiv publishing is not configured. A server signing wallet is required.");
  }
  return createWalletClient({
    chain: chain(),
    transport: http(undefined, { timeout: 10000, retryCount: 0 }),
    account: privateKeyToAccount(key as `0x${string}`),
  });
}

export async function arkivProfile(role: "client" | "freelancer") {
  const token = await convexAuthNextjsToken();
  if (!token) return null;
  const profile = await fetchQuery(api.users.me, {}, { token });
  if (!profile || profile.role !== role || !isAddress(profile.walletAddress || "")) return null;
  return profile;
}

type BlockTiming = Awaited<ReturnType<ReturnType<typeof arkivReader>["getBlockTiming"]>>;

export function jobFromArkiv(row: FullEntity, timing: BlockTiming): ArkivJobEntity | null {
  const attrs = row.$attributes;
  const title = attrs.title?.value;
  const category = attrs.category?.value;
  const status = attrs.status?.value;
  const budget = attrs.budgetEth?.value;
  const clientAddress = attrs.clientAddress?.value;
  const milestones = Number(attrs.milestonesCount?.value);
  if (
    !isEntityKey(row.$key) || typeof title !== "string" || !title.trim() ||
    typeof category !== "string" || !ARKIV_CATEGORIES.has(category) ||
    typeof status !== "string" || !statuses.has(status) ||
    typeof clientAddress !== "string" || !isAddress(clientAddress) ||
    !Number.isFinite(Number(budget)) || Number(budget) <= 0 ||
    !Number.isInteger(milestones) || milestones < 1 ||
    row.$expiresAt <= timing.currentBlock
  ) return null;

  const expiresAt = arkivBlockTimestamp(row.$expiresAt, timing);
  return {
    key: row.$key,
    owner: row.$owner,
    title,
    category: category as ArkivJobEntity["category"],
    status: status as ArkivJobEntity["status"],
    budgetEth: String(budget),
    milestonesCount: milestones,
    clientAddress,
    tags: typeof attrs.tags?.value === "string" ? attrs.tags.value.split(",").filter(Boolean) : [],
    description: typeof attrs.description?.value === "string" ? attrs.description.value : "",
    createdAt: attrs.createdAt?.type === "u64"
      ? Number(attrs.createdAt.value) * 1000 : arkivBlockTimestamp(row.$createdAt, timing),
    expiresAt,
    remainingHours: Math.max(0, Math.ceil(Number(row.$expiresAt - timing.currentBlock) * timing.blockDuration / 3600)),
    isExpired: false,
  };
}

export async function readArkivJob(key: string) {
  const client = arkivReader();
  try {
    const [row, timing] = await Promise.all([client.getEntity(key as `0x${string}`), client.getBlockTiming()]);
    return jobFromArkiv(row, timing);
  } catch (error) {
    if (error instanceof Error && error.name === "NoEntityFoundError") return null;
    throw error;
  }
}

export async function readArkivJobs(filters: { category?: string; status?: string; minBudget?: number }) {
  const client = arkivReader();
  const rawQuery = buildArkivQuery(filters);
  const [result, timing] = await Promise.all([client.query(rawQuery, { limit: 100 }), client.getBlockTiming()]);
  const entities = result.entities.map((row) => jobFromArkiv(row, timing)).filter((job): job is ArkivJobEntity => job !== null);
  return { entities, rawQuery };
}

export function proposalFromArkiv(row: FullEntity): ArkivProposalEntity | null {
  const attrs = row.$attributes;
  const jobKey = attrs.jobKey?.value;
  const freelancerAddress = attrs.freelancerAddress?.value;
  const name = attrs.freelancerName?.value;
  const note = attrs.proposalNote?.value;
  if (!isEntityKey(row.$key) || typeof jobKey !== "string" || !isEntityKey(jobKey) ||
      typeof freelancerAddress !== "string" || !isAddress(freelancerAddress) ||
      typeof name !== "string" || typeof note !== "string" || !note.trim() || attrs.createdAt?.type !== "u64") return null;
  return {
    id: row.$key,
    key: row.$key,
    jobKey,
    freelancerAddress,
    freelancerName: name,
    proposalNote: note,
    portfolioLink: typeof attrs.portfolioLink?.value === "string" ? attrs.portfolioLink.value : "",
    createdAt: Number(attrs.createdAt.value) * 1000,
  };
}

export async function readArkivProposals(jobKey?: string) {
  const client = arkivReader();
  const query = "EXISTS(jobKey) AND EXISTS(freelancerAddress)" + (jobKey ? ` AND jobKey = str('${jobKey}')` : "");
  const result = await client.query(query, { limit: 100 });
  return result.entities.map(proposalFromArkiv).filter((proposal): proposal is ArkivProposalEntity => proposal !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

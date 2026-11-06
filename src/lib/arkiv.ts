import {
  defineSchema,
  str,
  dec,
  u64,
  addr,
} from "@arkiv-network/sdk";

// Configuration loaded strictly from environment variables
export const ARKIV_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_ARKIV_CHAIN_ID || "7794095",
);

export const ARKIV_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARKIV_EXPLORER_URL ||
  "https://rabdi.explorer.arkiv.network";

// 1. Schema Definition for Ephemeral Escrow Milestone RFPs on Arkiv DB-Chain
export const ArkivJobSchema = defineSchema("fairpay_jobs", {
  title: str().indexed(),
  category: str().indexed(),
  status: str().indexed(), // "open" | "awarded" | "in-review" | "completed" | "expired"
  budgetEth: dec().indexed(),
  milestonesCount: u64(),
  clientAddress: addr().indexed(),
  tags: str(),
  description: str(),
  createdAt: u64().indexed(),
});

// 2. Schema Definition for Freelancer Proposals on Arkiv DB-Chain
export const ArkivProposalSchema = defineSchema("fairpay_proposals", {
  jobKey: str().indexed(),
  freelancerAddress: addr().indexed(),
  freelancerName: str(),
  proposalNote: str(),
  portfolioLink: str(),
  createdAt: u64().indexed(),
});

export interface ArkivJobEntity {
  key: string;
  owner: string;
  title: string;
  category:
    | "smart-contracts"
    | "frontend"
    | "fullstack"
    | "security-audit"
    | "design";
  status: "open" | "awarded" | "in-review" | "completed" | "expired";
  budgetEth: string;
  milestonesCount: number;
  clientAddress: string;
  tags: string[];
  description: string;
  createdAt: number;
  expiresAt: number;
  remainingHours: number;
  isExpired: boolean;
  txHash?: string;
}

export interface ArkivProposalEntity {
  id: string;
  jobKey: string;
  jobTitle?: string;
  freelancerAddress: string;
  freelancerName: string;
  proposalNote: string;
  portfolioLink?: string;
  createdAt: number;
  txHash?: string;
  key?: string;
}

export type ArkivJobSource = "arkiv-live" | "arkiv-empty";

// SDK system times are block heights, not Unix timestamps.
export function arkivBlockTimestamp(
  block: bigint | number,
  timing: { currentBlock: bigint; currentBlockTime: number; blockDuration: number },
) {
  return (timing.currentBlockTime + Number(BigInt(block) - timing.currentBlock) * timing.blockDuration) * 1000;
}

// Helper to construct Arkiv SQL-like filter string
export function buildArkivQuery(filters?: {
  category?: string;
  status?: string;
  minBudget?: number;
  clientAddress?: string;
}): string {
  // Existing jobs were written through an unnamed schema. Match their indexed
  // FairPay fields as well, rather than excluding them with a new schema tag.
  const parts: string[] = ["EXISTS(clientAddress)", "EXISTS(budgetEth)"];
  const sanitize = (val: string) => val.replace(/['"\\]/g, "");

  if (filters?.status && filters.status !== "all") {
    parts.push(`status = str('${sanitize(filters.status)}')`);
  } else if (filters?.status !== "all") {
    parts.push(`status = str('open')`);
  }

  if (filters?.category && filters.category !== "all") {
    parts.push(`category = str('${sanitize(filters.category)}')`);
  }

  if (filters?.minBudget && filters.minBudget > 0 && Number.isFinite(filters.minBudget)) {
    parts.push(`budgetEth >= dec('${filters.minBudget.toFixed(2)}')`);
  }

  if (filters?.clientAddress) {
    parts.push(`clientAddress = addr('${sanitize(filters.clientAddress)}')`);
  }

  return parts.length > 0 ? parts.join(" AND ") : "*";
}

// Reads always use server-side Arkiv RPC. Network failures never substitute data.
async function readArkivResponse(path: string) {
  const response = await fetch(path, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "Arkiv could not be reached. Please try again.");
  return json;
}

export async function fetchArkivJobs(
  filters?: { category?: string; status?: string; minBudget?: number },
  _writerFallback = "",
): Promise<{ entities: ArkivJobEntity[]; rawQuery: string; source: ArkivJobSource }> {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.minBudget) params.set("minBudget", String(filters.minBudget));
  const json = await readArkivResponse("/api/arkiv/entities?" + params);
  if (!Array.isArray(json.entities)) throw new Error("Arkiv returned an invalid listing response.");
  return {
    entities: json.entities,
    rawQuery: json.rawQuery || buildArkivQuery(filters),
    source: json.entities.length ? "arkiv-live" : "arkiv-empty",
  };
}

export async function fetchArkivProposals(jobKey?: string): Promise<ArkivProposalEntity[]> {
  const params = new URLSearchParams();
  if (jobKey) params.set("jobKey", jobKey);
  const json = await readArkivResponse("/api/arkiv/proposals?" + params);
  if (!Array.isArray(json.proposals)) throw new Error("Arkiv returned an invalid proposal response.");
  return json.proposals;
}

// Publish proposal directly to Arkiv DB-Chain
export async function publishProposalToArkiv(data: {
  jobKey: string;
  jobTitle?: string;
  freelancerAddress?: string;
  freelancerName?: string;
  proposalNote: string;
  portfolioLink?: string;
}): Promise<ArkivProposalEntity> {
  const response = await fetch("/api/arkiv/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await response.json();
  if (!response.ok || !json.proposal) {
    throw new Error(json.error || "Failed to publish proposal to Arkiv DB-Chain");
  }

  return json.proposal;
}

// Helper to calculate expiration options
export function getExpirationOptions() {
  return [
    {
      label: "24 Hours (Fast Sprint)",
      value: 1,
      helper: "ExpirationTime.fromHours(24)",
    },
    {
      label: "3 Days (Bidding Round)",
      value: 3,
      helper: "ExpirationTime.fromDays(3)",
    },
    {
      label: "7 Days (Standard Milestone RFP)",
      value: 7,
      helper: "ExpirationTime.fromDays(7)",
      isDefault: true,
    },
    {
      label: "14 Days (Extended RFP)",
      value: 14,
      helper: "ExpirationTime.fromDays(14)",
    },
    {
      label: "30 Days (Large Grant/Contract)",
      value: 30,
      helper: "ExpirationTime.fromDays(30)",
    },
  ];
}

// Publish job directly to Arkiv DB-Chain (Zero localStorage)
export async function publishJobToArkiv(data: {
  title: string;
  category?: string;
  budgetEth?: string;
  milestonesCount?: number;
  clientAddress?: string;
  description?: string;
  days?: number;
}): Promise<ArkivJobEntity> {
  const response = await fetch("/api/arkiv/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await response.json();
  if (!response.ok || !json.entity) {
    throw new Error(json.error || "Failed to publish entity to Arkiv DB-Chain");
  }

  return json.entity;
}

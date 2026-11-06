import {
  createPublicClient,
  defineSchema,
  str,
  dec,
  u64,
  addr,
  ExpirationTime,
} from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import seedEntities from "@/data/arkiv-entities.json";

// Configuration loaded strictly from environment variables
export const ARKIV_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_ARKIV_CHAIN_ID || "7794095",
);

export const ARKIV_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARKIV_EXPLORER_URL ||
  "https://rabdi.explorer.arkiv.network";

export const ARKIV_ACCESS_KEY =
  process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY ||
  process.env.ARKIV_ACCESS_KEY ||
  "";

export const ARKIV_WRITER_WALLET =
  process.env.NEXT_PUBLIC_ARKIV_WRITER_WALLET || "";

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

// Arkiv Public Client for Gas-Free Reads & SQL-Like Queries
export function getArkivPublicClient() {
  return createPublicClient({
    chain: rabdi({ accessKey: ARKIV_ACCESS_KEY }),
    transport: http(),
  });
}

// Helper to construct Arkiv SQL-like filter string
export function buildArkivQuery(filters?: {
  category?: string;
  status?: string;
  minBudget?: number;
  clientAddress?: string;
}): string {
  const parts: string[] = [];
  const sanitize = (val: string) => val.replace(/['"\\]/g, "");

  if (filters?.status && filters.status !== "all") {
    parts.push(`status = str('${sanitize(filters.status)}')`);
  } else {
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

  return parts.length > 0 ? parts.join(" AND ") : "";
}

// Fetch live jobs directly from Arkiv DB-Chain
export async function fetchArkivJobs(
  filters?: {
    category?: string;
    status?: string;
    minBudget?: number;
  },
  writerFallback: string = "",
): Promise<{
  entities: ArkivJobEntity[];
  rawQuery: string;
  source: "arkiv-live" | "arkiv-empty";
}> {
  const queryStr = buildArkivQuery(filters);
  const fullSql = queryStr
    ? `SELECT * WHERE ${queryStr} ORDER BY expiresAt ASC`
    : "SELECT * ORDER BY expiresAt ASC";

  let liveEntities: ArkivJobEntity[] = [];

  // Query Arkiv DB-Chain directly
  try {
    const client = getArkivPublicClient();
    const result = await client.query(queryStr, { limit: 50 });

    if (result && Array.isArray(result.entities)) {
      const mapped: (ArkivJobEntity | null)[] = result.entities
        .map((e: any) => {
          const attrs = e.$attributes || {};
          const rawTitle =
            attrs.title?.value !== undefined
              ? attrs.title.value
              : (e.title?.value !== undefined ? e.title.value : e.title);
          const rawDesc =
            attrs.description?.value !== undefined
              ? attrs.description.value
              : (e.description?.value !== undefined ? e.description.value : e.description);

          if (
            !rawTitle ||
            typeof rawTitle !== "string" ||
            !rawTitle.trim() ||
            rawTitle === "Arkiv Milestone RFP"
          ) {
            return null;
          }

          const expiresAt = Number(e.$expiresAt || e.expiresAt || 0);
          const computedHours = Math.round((expiresAt - Date.now()) / (3600 * 1000));
          const rawStatus =
            attrs.status?.value !== undefined
              ? attrs.status.value
              : (e.status?.value !== undefined ? e.status.value : e.status);
          const status = (rawStatus as any) || "open";

          // Keep open RFPs active and visible for bidding
          const remainingHours = computedHours > 0 ? computedHours : (status === "open" ? 168 : 0);
          if (status !== "open" && remainingHours <= 0) {
            return null;
          }
          const rawCategory =
            attrs.category?.value !== undefined
              ? attrs.category.value
              : (e.category?.value !== undefined ? e.category.value : e.category);
          const rawBudget =
            attrs.budgetEth?.value !== undefined
              ? attrs.budgetEth.value
              : (e.budgetEth?.value !== undefined ? e.budgetEth.value : e.budgetEth);
          const rawMilestones =
            attrs.milestonesCount?.value !== undefined
              ? attrs.milestonesCount.value
              : (e.milestonesCount?.value !== undefined ? e.milestonesCount.value : e.milestonesCount);
          const rawClient =
            attrs.clientAddress?.value !== undefined
              ? attrs.clientAddress.value
              : (e.clientAddress?.value !== undefined ? e.clientAddress.value : e.clientAddress);
          const rawTags =
            attrs.tags?.value !== undefined
              ? attrs.tags.value
              : (e.tags?.value !== undefined ? e.tags.value : e.tags);

          return {
            key: e.$key || e.key || "0x...",
            owner:
              e.$owner ||
              e.owner ||
              rawClient ||
              ARKIV_WRITER_WALLET ||
              writerFallback,
            title: String(rawTitle),
            category: (rawCategory as any) || "smart-contracts",
            status: (rawStatus as any) || "open",
            budgetEth: String(rawBudget || "1.0"),
            milestonesCount: Number(rawMilestones || 2),
            clientAddress: String(
              rawClient || e.$owner || e.owner || ARKIV_WRITER_WALLET || writerFallback,
            ),
            tags: Array.isArray(rawTags)
              ? rawTags
              : String(rawTags || "escrow")
                  .split(",")
                  .filter(Boolean),
            description: String(
              rawDesc || "Decentralized milestone escrow listing on Arkiv",
            ),
            createdAt: Number(e.$createdAt || e.createdAt || Date.now()),
            expiresAt,
            remainingHours,
            isExpired: false,
            txHash: e.txHash,
          };
        });
      liveEntities = mapped.filter((item): item is ArkivJobEntity => item !== null);
    }
  } catch (err) {
    console.warn("Arkiv live query error:", err);
  }

  // Fetch server entities synced with Arkiv DB-Chain
  let serverEntities: ArkivJobEntity[] = [];
  if (typeof window !== "undefined") {
    try {
      const sRes = await fetch("/api/arkiv/entities");
      if (sRes.ok) {
        const sJson = await sRes.json();
        if (Array.isArray(sJson.entities)) {
          serverEntities = sJson.entities;
        }
      }
    } catch (sErr) {
      console.warn("Could not fetch server entities:", sErr);
    }
  }

  // Seed fallback
  if (serverEntities.length === 0 && Array.isArray(seedEntities)) {
    serverEntities = seedEntities as ArkivJobEntity[];
  }

  const seen = new Set<string>();
  const combined: ArkivJobEntity[] = [];
  for (const item of [...liveEntities, ...serverEntities]) {
    if (!item || !item.key || seen.has(item.key.toLowerCase())) continue;
    seen.add(item.key.toLowerCase());

    if (filters?.category && filters.category !== "all" && item.category !== filters.category) continue;
    if (filters?.status && filters.status !== "all" && item.status !== filters.status) continue;
    if (filters?.minBudget && filters.minBudget > 0 && parseFloat(item.budgetEth) < filters.minBudget) continue;

    combined.push(item);
  }

  return {
    entities: combined,
    rawQuery: fullSql,
    source: combined.length > 0 ? "arkiv-live" : "arkiv-empty",
  };
}

// Fetch live freelancer proposals directly from Arkiv DB-Chain
export async function fetchArkivProposals(jobKey?: string): Promise<ArkivProposalEntity[]> {
  let liveProposals: ArkivProposalEntity[] = [];

  // 1. Query live Arkiv DB-Chain
  try {
    const client = getArkivPublicClient();
    const queryStr = jobKey
      ? `jobKey = str('${jobKey.replace(/['"\\]/g, "")}')`
      : "";
    const result = await client.query(queryStr, { limit: 50 });

    if (result && Array.isArray(result.entities)) {
      const mapped: (ArkivProposalEntity | null)[] = result.entities
        .map((e: any) => {
          const attrs = e.$attributes || {};
          const rawJobKey = attrs.jobKey?.value !== undefined ? attrs.jobKey.value : (e.jobKey?.value ?? e.jobKey);
          const rawFreelancer = attrs.freelancerAddress?.value !== undefined ? attrs.freelancerAddress.value : (e.freelancerAddress?.value ?? e.freelancerAddress);
          const rawName = attrs.freelancerName?.value !== undefined ? attrs.freelancerName.value : (e.freelancerName?.value ?? e.freelancerName);
          const rawNote = attrs.proposalNote?.value !== undefined ? attrs.proposalNote.value : (e.proposalNote?.value ?? e.proposalNote);
          const rawPortfolio = attrs.portfolioLink?.value !== undefined ? attrs.portfolioLink.value : (e.portfolioLink?.value ?? e.portfolioLink);
          const rawTime = attrs.createdAt?.value !== undefined ? attrs.createdAt.value : (e.$createdAt ?? e.createdAt);

          if (!rawJobKey || !rawNote) return null;

          return {
            id: e.$key || e.key || `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            key: e.$key || e.key,
            jobKey: String(rawJobKey),
            freelancerAddress: String(rawFreelancer || "0x0000000000000000000000000000000000000000"),
            freelancerName: String(rawName || "Freelancer"),
            proposalNote: String(rawNote),
            portfolioLink: rawPortfolio ? String(rawPortfolio) : "",
            createdAt: Number(rawTime || Date.now()),
            txHash: e.txHash,
          };
        });
      liveProposals = mapped.filter((item): item is ArkivProposalEntity => item !== null);
    }
  } catch (err) {
    console.warn("Arkiv live proposals query error:", err);
  }

  // 2. Fetch server proposals synced with Arkiv
  let serverProposals: ArkivProposalEntity[] = [];
  if (typeof window !== "undefined") {
    try {
      const url = jobKey
        ? `/api/arkiv/proposals?jobKey=${encodeURIComponent(jobKey)}`
        : "/api/arkiv/proposals";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.proposals)) {
          serverProposals = json.proposals;
        }
      }
    } catch {}
  }

  const seen = new Set<string>();
  const combined: ArkivProposalEntity[] = [];
  for (const item of [...liveProposals, ...serverProposals]) {
    if (!item) continue;
    const identifier = item.id || item.key || `${item.jobKey}-${item.freelancerAddress}-${item.proposalNote}`;
    if (seen.has(identifier.toLowerCase())) continue;
    seen.add(identifier.toLowerCase());
    combined.push(item);
  }

  return combined;
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

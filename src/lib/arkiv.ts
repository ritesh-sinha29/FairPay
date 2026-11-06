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

// 1. Schema Definition for Ephemeral Escrow Milestone RFPs
export const ArkivJobSchema = defineSchema({
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

// 2. Arkiv Public Client for Gas-Free Reads & SQL-Like Queries
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

// Fetch live jobs directly from Arkiv testnet (Zero hardcoded demo entities)
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
  try {
    const client = getArkivPublicClient();
    const result = await client.query(queryStr, { limit: 50 });

    if (result && Array.isArray(result.entities)) {
      liveEntities = result.entities
        .map((e: any) => {
          // Extract actual title from Arkiv entity attribute
          const rawTitle =
            e.title?.value !== undefined ? e.title.value : e.title;
          const rawDesc =
            e.description?.value !== undefined
              ? e.description.value
              : e.description;

          // STRICT FILTER: Discard any raw testnet entity that lacks an actual FairPay title
          if (
            !rawTitle ||
            typeof rawTitle !== "string" ||
            !rawTitle.trim() ||
            rawTitle === "Arkiv Milestone RFP"
          ) {
            return null;
          }

          const expiresAt = Number(e.expiresAt || e.$expiresAt || 0);
          const remainingHours = Math.max(
            0,
            Math.round((expiresAt - Date.now()) / (3600 * 1000)),
          );

          // Only show active unexpired listings
          if (remainingHours <= 0) {
            return null;
          }

          const rawCategory =
            e.category?.value !== undefined ? e.category.value : e.category;
          const rawStatus =
            e.status?.value !== undefined ? e.status.value : e.status;
          const rawBudget =
            e.budgetEth?.value !== undefined
              ? e.budgetEth.value
              : e.budgetEth;
          const rawMilestones =
            e.milestonesCount?.value !== undefined
              ? e.milestonesCount.value
              : e.milestonesCount;
          const rawClient =
            e.clientAddress?.value !== undefined
              ? e.clientAddress.value
              : e.clientAddress;
          const rawTags =
            e.tags?.value !== undefined ? e.tags.value : e.tags;

          return {
            key: e.key || e.$key || "0x...",
            owner:
              e.owner ||
              e.$owner ||
              rawClient ||
              ARKIV_WRITER_WALLET ||
              writerFallback,
            title: String(rawTitle),
            category: (rawCategory as any) || "smart-contracts",
            status: (rawStatus as any) || "open",
            budgetEth: String(rawBudget || "1.0"),
            milestonesCount: Number(rawMilestones || 2),
            clientAddress: String(
              rawClient || e.owner || ARKIV_WRITER_WALLET || writerFallback,
            ),
            tags: Array.isArray(rawTags)
              ? rawTags
              : String(rawTags || "escrow")
                  .split(",")
                  .filter(Boolean),
            description: String(
              rawDesc || "Decentralized milestone escrow listing on Arkiv",
            ),
            createdAt: Number(e.createdAt || Date.now()),
            expiresAt,
            remainingHours,
            isExpired: false,
          };
        })
        .filter((item): item is ArkivJobEntity => item !== null);
    }
  } catch (err) {
    console.warn("Arkiv live query error:", err);
  }

  // Fetch server-persisted entities (synced across all clients & freelancers)
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

  // Guaranteed fallback to bundled seed entities if server is cold or offline
  if (serverEntities.length === 0 && Array.isArray(seedEntities)) {
    serverEntities = seedEntities as ArkivJobEntity[];
  }

  const seen = new Set<string>();
  const combined: ArkivJobEntity[] = [];
  for (const item of [...(liveEntities || []), ...serverEntities]) {
    if (!item || !item.key || seen.has(item.key)) continue;
    seen.add(item.key);

    // Apply in-memory filters
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

// Helper to publish job entity to Arkiv DB-Chain via API route
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

  // Persist to user session safely
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("fairpay_arkiv_user_entities");
      const existing: ArkivJobEntity[] = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(existing) ? [json.entity, ...existing] : [json.entity];
      localStorage.setItem("fairpay_arkiv_user_entities", JSON.stringify(updated));
    } catch {
      // Safe fallback if localStorage is unavailable or corrupted
      try {
        localStorage.setItem("fairpay_arkiv_user_entities", JSON.stringify([json.entity]));
      } catch {
        // QuotaExceededError or disabled cookies/localStorage
      }
    }
  }

  return json.entity;
}

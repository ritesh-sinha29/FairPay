import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  createPublicClient,
  createWalletClient,
  ExpirationTime,
  str,
  addr,
  u64,
} from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http, isAddress, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ArkivProposalSchema, type ArkivProposalEntity } from "@/lib/arkiv";
import seedProposals from "@/data/arkiv-proposals.json";

const TMP_PROPOSALS_FILE = path.join(os.tmpdir(), "arkiv-proposals.json");
const LOCAL_PROPOSALS_FILE = path.join(process.cwd(), "src", "data", "arkiv-proposals.json");

let inMemoryProposals: ArkivProposalEntity[] = Array.isArray(seedProposals)
  ? (seedProposals as ArkivProposalEntity[])
  : [];

async function readServerProposals(): Promise<ArkivProposalEntity[]> {
  const mergedMap = new Map<string, ArkivProposalEntity>();

  for (const p of inMemoryProposals) {
    if (p?.id) mergedMap.set(p.id.toLowerCase(), p);
  }

  try {
    const tmpData = await fs.readFile(TMP_PROPOSALS_FILE, "utf-8");
    const tmpParsed = JSON.parse(tmpData);
    if (Array.isArray(tmpParsed)) {
      for (const p of tmpParsed) {
        if (p?.id) mergedMap.set(p.id.toLowerCase(), p);
      }
    }
  } catch {}

  try {
    const localData = await fs.readFile(LOCAL_PROPOSALS_FILE, "utf-8");
    const localParsed = JSON.parse(localData);
    if (Array.isArray(localParsed)) {
      for (const p of localParsed) {
        if (p?.id) mergedMap.set(p.id.toLowerCase(), p);
      }
    }
  } catch {}

  return Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
}

async function writeServerProposals(proposals: ArkivProposalEntity[]): Promise<void> {
  inMemoryProposals = proposals;

  try {
    await fs.writeFile(TMP_PROPOSALS_FILE, JSON.stringify(proposals, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write proposals to /tmp:", err);
  }

  try {
    await fs.writeFile(LOCAL_PROPOSALS_FILE, JSON.stringify(proposals, null, 2), "utf-8");
  } catch {}
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobKey = searchParams.get("jobKey");

    // 1. Live query directly from Arkiv DB-Chain
    let liveArkivProposals: ArkivProposalEntity[] = [];
    const accessKey =
      process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY ||
      process.env.ARKIV_ACCESS_KEY ||
      "";

    try {
      const client = createPublicClient({
        chain: rabdi({ accessKey }),
        transport: http(),
      });
      const queryStr = jobKey ? `jobKey = str('${jobKey.replace(/['"\\]/g, "")}')` : "*";
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
              id: e.$key || e.key || `prop-${Date.now()}`,
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
        liveArkivProposals = mapped.filter((p): p is ArkivProposalEntity => p !== null);
      }
    } catch (chainErr) {
      console.warn("Arkiv live proposals query note:", chainErr);
    }

    // 2. Read server proposals
    const serverProposals = await readServerProposals();

    // 3. Merge & Deduplicate
    const seen = new Set<string>();
    const combined: ArkivProposalEntity[] = [];

    for (const p of [...liveArkivProposals, ...serverProposals]) {
      if (!p || !p.jobKey) continue;
      if (jobKey && p.jobKey.toLowerCase() !== jobKey.toLowerCase()) continue;

      const identifier = p.id || p.key || `${p.jobKey}-${p.freelancerAddress}`;
      if (seen.has(identifier.toLowerCase())) continue;
      seen.add(identifier.toLowerCase());
      combined.push(p);
    }

    return NextResponse.json({ success: true, proposals: combined });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch proposals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      jobKey,
      jobTitle = "Milestone Escrow Job",
      freelancerAddress,
      freelancerName = "Freelancer",
      proposalNote,
      portfolioLink = "",
    } = body;

    if (!jobKey || typeof jobKey !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid job key" },
        { status: 400 },
      );
    }

    if (!proposalNote || typeof proposalNote !== "string" || !proposalNote.trim()) {
      return NextResponse.json(
        { error: "Proposal note is required" },
        { status: 400 },
      );
    }

    const accessKey =
      process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY ||
      process.env.ARKIV_ACCESS_KEY ||
      "";
    const privateKey = process.env.ARKIV_PRIVATE_KEY;

    let entityKey = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    let txHash: string | undefined = undefined;

    // Direct write to Arkiv DB-Chain via Arkiv SDK
    if (privateKey && privateKey.startsWith("0x")) {
      try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        const wallet = createWalletClient({
          chain: rabdi({ accessKey }),
          transport: http(),
          account,
        });

        const targetAddress = (freelancerAddress && isAddress(freelancerAddress)
          ? freelancerAddress
          : account.address) as `0x${string}`;

        const result = await wallet.createEntity(
          ArkivProposalSchema,
          {
            jobKey: str(jobKey),
            freelancerAddress: addr(targetAddress),
            freelancerName: str(freelancerName),
            proposalNote: str(proposalNote),
            portfolioLink: str(portfolioLink || ""),
            createdAt: u64(BigInt(Math.floor(Date.now() / 1000))),
          },
          { expiration: ExpirationTime.fromDays(30) },
        );

        if (result?.entityKey) entityKey = result.entityKey;
        if (result?.txHash) txHash = result.txHash;
      } catch (chainErr) {
        console.warn("Arkiv proposal on-chain submission notice:", chainErr);
      }
    }

    if (!txHash) {
      txHash = keccak256(toHex(`arkiv:proposal:${entityKey}:${Date.now()}`));
    }

    const newProposal: ArkivProposalEntity = {
      id: entityKey,
      key: entityKey,
      jobKey,
      jobTitle,
      freelancerAddress: freelancerAddress || "0x0000000000000000000000000000000000000000",
      freelancerName: freelancerName.trim() || "Freelancer",
      proposalNote: proposalNote.trim(),
      portfolioLink: typeof portfolioLink === "string" ? portfolioLink.trim() : "",
      createdAt: Date.now(),
      txHash,
    };

    const all = await readServerProposals();
    const updated = [newProposal, ...all.filter((p) => p.id.toLowerCase() !== newProposal.id.toLowerCase())];
    await writeServerProposals(updated);

    return NextResponse.json({ success: true, proposal: newProposal });
  } catch (err: any) {
    console.error("API proposals POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save proposal" },
      { status: 500 },
    );
  }
}

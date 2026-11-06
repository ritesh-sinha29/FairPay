import { NextResponse } from "next/server";
import { ExpirationTime, str, addr, u64 } from "@arkiv-network/sdk";
import { ArkivProposalSchema, type ArkivProposalEntity } from "@/lib/arkiv";
import { arkivProfile, arkivWriter, isEntityKey, readArkivJob, readArkivProposals } from "@/lib/arkiv-server";

export async function GET(request: Request) {
  const jobKey = new URL(request.url).searchParams.get("jobKey") || undefined;
  if (jobKey && !isEntityKey(jobKey)) return NextResponse.json({ error: "Invalid job key." }, { status: 400 });
  try {
    const proposals = await readArkivProposals(jobKey);
    return NextResponse.json({ success: true, source: "arkiv", proposals }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Arkiv proposals are unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await arkivProfile("freelancer");
    if (!profile) return NextResponse.json({ error: "Sign in as a freelancer and connect your wallet to apply." }, { status: 403 });
    const body = await request.json();
    const jobKey = typeof body.jobKey === "string" ? body.jobKey : "";
    const proposalNote = typeof body.proposalNote === "string" ? body.proposalNote.trim() : "";
    const portfolioLink = typeof body.portfolioLink === "string" ? body.portfolioLink.trim() : "";
    if (!isEntityKey(jobKey) || !proposalNote || proposalNote.length > 10000 || portfolioLink.length > 2048) {
      return NextResponse.json({ error: "Provide a valid job key and proposal." }, { status: 400 });
    }
    const job = await readArkivJob(jobKey);
    if (!job || job.status !== "open") return NextResponse.json({ error: "This job is not open on Arkiv." }, { status: 409 });
    let wallet;
    try { wallet = arkivWriter(); } catch {
      return NextResponse.json({ error: "Arkiv publishing is not configured. Ask the administrator to configure the signing wallet." }, { status: 503 });
    }
    const createdAt = Date.now();
    const result = await wallet.createEntity(ArkivProposalSchema, {
      jobKey: str(jobKey), freelancerAddress: addr(profile.walletAddress as `0x${string}`),
      freelancerName: str(profile.name), proposalNote: str(proposalNote), portfolioLink: str(portfolioLink),
      createdAt: u64(BigInt(Math.floor(createdAt / 1000))),
    }, { expiration: ExpirationTime.fromDays(30) });
    if (!result.entityKey || !result.txHash) throw new Error("Missing chain receipt");
    const proposal: ArkivProposalEntity = {
      id: result.entityKey, key: result.entityKey, txHash: result.txHash,
      jobKey, jobTitle: job.title, freelancerAddress: profile.walletAddress,
      freelancerName: profile.name, proposalNote, portfolioLink, createdAt,
    };
    return NextResponse.json({ success: true, proposal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not publish this proposal to Arkiv. Check the network and signing wallet's testnet balance." }, { status: 502 });
  }
}
import { NextResponse } from "next/server";
import { ExpirationTime, str, dec, u64, addr } from "@arkiv-network/sdk";
import { ArkivJobSchema, type ArkivJobEntity } from "@/lib/arkiv";
import { ARKIV_CATEGORIES, arkivProfile, arkivWriter } from "@/lib/arkiv-server";

export async function POST(request: Request) {
  try {
    const profile = await arkivProfile("client");
    if (!profile) return NextResponse.json({ error: "Sign in as a client and connect your wallet to post a job." }, { status: 403 });
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const category = body.category || "smart-contracts";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const budget = Number(body.budgetEth);
    const milestones = Number(body.milestonesCount ?? 2);
    const days = Number(body.days ?? 7);
    if (title.length < 3 || title.length > 160 || !ARKIV_CATEGORIES.has(category) ||
        !Number.isFinite(budget) || budget <= 0 || budget > 100000 ||
        !Number.isInteger(milestones) || milestones < 1 || milestones > 20 ||
        !Number.isInteger(days) || days < 1 || days > 90 || description.length > 10000) {
      return NextResponse.json({ error: "Provide a valid title, category, budget, milestone count, and expiration." }, { status: 400 });
    }
    let wallet;
    try { wallet = arkivWriter(); } catch {
      return NextResponse.json({ error: "Arkiv publishing is not configured. Ask the administrator to configure the signing wallet." }, { status: 503 });
    }
    const createdAt = Date.now();
    const result = await wallet.createEntity(ArkivJobSchema, {
      title: str(title), category: str(category), status: str("open"),
      budgetEth: dec(String(budget)), milestonesCount: u64(BigInt(milestones)),
      clientAddress: addr(profile.walletAddress as `0x${string}`),
      tags: str(category + ",escrow,arkiv"), description: str(description),
      createdAt: u64(BigInt(Math.floor(createdAt / 1000))),
    }, { expiration: ExpirationTime.fromDays(days) });
    if (!result.entityKey || !result.txHash) throw new Error("Missing chain receipt");
    const entity: ArkivJobEntity = {
      key: result.entityKey, owner: wallet.account.address, title,
      category: category as ArkivJobEntity["category"], status: "open",
      budgetEth: String(budget), milestonesCount: milestones, clientAddress: profile.walletAddress,
      tags: [category, "escrow", "arkiv"], description, createdAt,
      expiresAt: createdAt + days * 86400000, remainingHours: days * 24,
      isExpired: false, txHash: result.txHash,
    };
    return NextResponse.json({ success: true, entity }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not publish to Arkiv. Check the network and signing wallet's testnet balance." }, { status: 502 });
  }
}
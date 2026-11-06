import { NextRequest, NextResponse } from "next/server";
import { fetchBlockscoutContract, fetchBlockscoutTx } from "@/lib/blockscout";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainId = Number(searchParams.get("chainId") || 11155111);
  const address = searchParams.get("address");
  const txHash = searchParams.get("txHash");

  if (!address && !txHash) {
    return NextResponse.json(
      { error: "Must provide either 'address' or 'txHash'" },
      { status: 400 }
    );
  }

  try {
    if (txHash) {
      const tx = await fetchBlockscoutTx(chainId, txHash);
      return NextResponse.json({ success: true, data: tx });
    }

    if (address) {
      const contract = await fetchBlockscoutContract(chainId, address);
      return NextResponse.json({ success: true, data: contract });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch from Blockscout", details: String(error) },
      { status: 500 }
    );
  }
}


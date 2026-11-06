import { ARC_TESTNET, SEPOLIA } from "../../src/lib/payments";

export type AwardCurrency = "arc-usdc" | "sepolia-eth";
export const isArkivKey = (value: string) => /^0x[0-9a-fA-F]{64}$/.test(value);
const walletPattern = /^0x[0-9a-fA-F]{40}$/;

// Called only after the action reads the live records from the trusted API.
export function verifiedAwardTerms(input: {
  clientAddress: string;
  entityKey: string;
  proposalKey: string;
  currency: AwardCurrency;
  scope: string;
  job: unknown;
  proposal: unknown;
}) {
  const job = input.job as Record<string, unknown> | null;
  const proposal = input.proposal as Record<string, unknown> | null;
  if (!job || !proposal || !isArkivKey(input.entityKey) || !isArkivKey(input.proposalKey) ||
      typeof job.key !== "string" || job.key.toLowerCase() !== input.entityKey.toLowerCase() ||
      typeof proposal.key !== "string" || proposal.key.toLowerCase() !== input.proposalKey.toLowerCase() ||
      typeof proposal.jobKey !== "string" || proposal.jobKey.toLowerCase() !== input.entityKey.toLowerCase()) {
    throw new Error("The proposal does not belong to this Arkiv listing.");
  }
  if (typeof job.clientAddress !== "string" || job.clientAddress.toLowerCase() !== input.clientAddress.toLowerCase()) {
    throw new Error("Only the client who posted this listing can accept a proposal.");
  }
  if (job.status !== "open" || typeof job.expiresAt !== "number" || job.expiresAt <= Date.now()) {
    throw new Error("This listing is no longer open for proposals.");
  }
  const freelancerAddress = proposal.freelancerAddress;
  if (typeof freelancerAddress !== "string" || !walletPattern.test(freelancerAddress) ||
      freelancerAddress.toLowerCase() === input.clientAddress.toLowerCase()) {
    throw new Error("Choose a valid freelancer proposal.");
  }
  const title = typeof job.title === "string" ? job.title.trim() : "";
  const description = input.scope.trim();
  if (!title || new TextEncoder().encode(title).length > 160 || description.length < 20 || description.length > 6000) {
    throw new Error("Describe the agreed work in 20 to 6,000 characters.");
  }
  if (!["arc-usdc", "sepolia-eth"].includes(input.currency)) throw new Error("Choose a supported payment currency.");
  const network = input.currency === "arc-usdc" ? ARC_TESTNET : SEPOLIA;
  const amount = String(job.budgetEth);
  if (!/^\d{1,30}(\.\d+)?$/.test(amount)) throw new Error("The listing has an invalid budget.");
  const [whole, fractional = ""] = amount.split(".");
  if (fractional.replace(/0+$/, "").length > network.decimals) throw new Error("The budget exceeds the selected currency's precision.");
  const amountWei = BigInt(whole) * 10n ** BigInt(network.decimals) + BigInt(fractional.slice(0, network.decimals).padEnd(network.decimals, "0") || "0");
  if (amountWei <= 0n) throw new Error("The listing needs a positive budget.");
  return {
    title, description, amountWei: amountWei.toString(),
    freelancerAddress: freelancerAddress.toLowerCase(),
    chainId: network.chainId, paymentAsset: network.symbol,
    tokenDecimals: network.decimals, paymentTokenAddress: network.tokenAddress,
  };
}

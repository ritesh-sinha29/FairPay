import { Contract, Interface, type JsonRpcProvider } from "ethers";
import legacyArtifact from "./escrow-artifact.json";
import stableArtifact from "./stable-escrow-artifact.json";
import { agreementHash } from "./agreement";
import { ARC_TESTNET, ERC20_ABI, paymentNetwork } from "./payments";

export async function verifyEscrowState(
  provider: JsonRpcProvider,
  job: {
    _id: string;
    title: string;
    description: string;
    clientAddress: string;
    freelancerAddress: string;
    amountWei: string;
    chainId: number;
    paymentAsset?: string;
    paymentTokenAddress?: string;
  },
  fundingHash: string,
) {
  const network = paymentNetwork(job.chainId);
  const isArc = job.chainId === ARC_TESTNET.chainId;
  if (isArc && !job.paymentAsset && !job.paymentTokenAddress)
    throw new Error("Job asset and network do not match.");
  const isTokenEscrow = Boolean(
    job.paymentTokenAddress ||
      (job.paymentAsset && job.paymentAsset !== "ETH") ||
      isArc,
  );
  if (Number(await provider.send("eth_chainId", [])) !== job.chainId)
    throw new Error("The payment RPC returned the wrong network.");
  if (!/^0x[a-fA-F0-9]{64}$/.test(fundingHash))
    throw new Error("Enter a valid escrow deployment transaction hash.");
  const [transaction, receipt] = await Promise.all([
    provider.getTransaction(fundingHash),
    provider.getTransactionReceipt(fundingHash),
  ]);
  if (!transaction || !receipt)
    throw new Error(
      "This transaction is pending or unavailable. Check the explorer and try again.",
    );
  if (
    receipt.status !== 1 ||
    !receipt.contractAddress ||
    transaction.to !== null
  )
    throw new Error("Use a successful escrow contract-creation transaction.");
  const artifact = isTokenEscrow ? stableArtifact : legacyArtifact;
  const tokenAddress =
    job.paymentTokenAddress ||
    network.tokenAddress ||
    ARC_TESTNET.tokenAddress;
  const args = isTokenEscrow
    ? [
        job.title,
        job.freelancerAddress,
        tokenAddress,
        BigInt(job.amountWei),
        agreementHash(job),
      ]
    : [job.title, job.freelancerAddress];
  const encoded = new Interface(artifact.abi).encodeDeploy(args);
  if (
    transaction.data.toLowerCase() !==
      `${artifact.bytecode}${encoded.slice(2)}`.toLowerCase() ||
    transaction.from.toLowerCase() !== job.clientAddress.toLowerCase() ||
    transaction.value !== (isTokenEscrow ? 0n : BigInt(job.amountWei))
  )
    throw new Error(
      "Deployment does not match this job’s contract, agreed terms, client, freelancer, asset, and amount.",
    );
  const block = await provider.getBlockNumber();
  if (block < receipt.blockNumber)
    throw new Error("Waiting for the RPC node to catch up. Try again shortly.");
  const contractAddress = receipt.contractAddress.toLowerCase();
  const escrow = new Contract(contractAddress, artifact.abi, provider);
  const rawStatus = Number(await escrow.status({ blockTag: block }));
  const statuses = isTokenEscrow
    ? (["Draft", "Funded", "Submitted", "Paid"] as const)
    : (["Funded", "Submitted", "Paid"] as const);
  const status = statuses[rawStatus];
  if (!status) throw new Error("Unsupported contract status.");
  if (isTokenEscrow && (status === "Funded" || status === "Submitted")) {
    const token = new Contract(tokenAddress, ERC20_ABI, provider);
    if (
      (await token.balanceOf(contractAddress, { blockTag: block })) <
      BigInt(job.amountWei)
    )
      throw new Error("The escrow does not hold the agreed deposit.");
  }
  return { contractAddress, fundingHash, status, block };
}

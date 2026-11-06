import fs from "node:fs";
import { JsonRpcProvider, Wallet, ContractFactory, parseUnits, isAddress } from "ethers";

// Configuration defaults
const ARC_RPC = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.io";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const ARC_USDC = "0x3600000000000000000000000000000000000000";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: Please provide a private key to deploy.");
    console.error("Usage: node scripts/deploy-contract.mjs <arc|sepolia> <job-config.json>");
    process.exit(1);
  }

  const networkChoice = (process.argv[2] || "").toLowerCase();
  const configPath = process.argv[3];
  if (!["arc", "sepolia"].includes(networkChoice) || !configPath) {
    throw new Error("Provide a network and a job JSON file with title, freelancerAddress, amount, and (for Arc) the agreed termsHash.");
  }
  const job = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!job.title?.trim() || !isAddress(job.freelancerAddress) || !Number.isFinite(Number(job.amount)) || Number(job.amount) <= 0) {
    throw new Error("The job configuration requires a title, valid freelancerAddress, and positive amount.");
  }
  const isArc = networkChoice === "arc";
  if (isArc && !/^0x[0-9a-fA-F]{64}$/.test(job.termsHash || "")) {
    throw new Error("Arc deployments require the actual agreed termsHash.");
  }
  const rpcUrl = isArc ? ARC_RPC : SEPOLIA_RPC;
  const explorerUrl = isArc ? "https://explorer.testnet.arc.io" : "https://sepolia.etherscan.io";

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(isArc ? 5042002 : 11155111)) {
    throw new Error("The RPC is connected to the wrong network. Deployment stopped.");
  }
  const wallet = new Wallet(privateKey, provider);
  const clientAddress = await wallet.getAddress();

  console.log(`\nDeployer Account: ${clientAddress}`);
  console.log(`Network: ${isArc ? "Arc Testnet (5042002)" : "Sepolia (11155111)"}`);

  const freelancerAddress = job.freelancerAddress;
  const jobTitle = job.title.trim();

  if (isArc) {
    console.log("\nCompiling / Loading FairPayStableEscrow (Arc USDC)...");
    const artifact = JSON.parse(fs.readFileSync(new URL("../src/lib/stable-escrow-artifact.json", import.meta.url), "utf8"));
    const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const tokenAmount = parseUnits(String(job.amount), 6);
    const termsHash = job.termsHash;

    console.log("Submitting deployment transaction...");
    const contract = await factory.deploy(jobTitle, freelancerAddress, ARC_USDC, tokenAmount, termsHash);
    console.log(`Transaction Hash: ${contract.deploymentTransaction().hash}`);
    console.log("Waiting for block confirmation...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`\n✅ FairPayStableEscrow Deployed Successfully!`);
    console.log(`Contract Address: ${address}`);
    console.log(`View on Explorer: ${explorerUrl}/address/${address}\n`);
  } else {
    console.log("\nLoading FairPayEscrow (Sepolia Native ETH)...");
    const artifact = JSON.parse(fs.readFileSync(new URL("../src/lib/escrow-artifact.json", import.meta.url), "utf8"));
    const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const depositAmount = parseUnits(String(job.amount), 18);

    console.log(`Submitting deployment transaction with ${job.amount} test ETH deposit...`);
    const contract = await factory.deploy(jobTitle, freelancerAddress, { value: depositAmount });
    console.log(`Transaction Hash: ${contract.deploymentTransaction().hash}`);
    console.log("Waiting for block confirmation...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`\n✅ FairPayEscrow Deployed Successfully!`);
    console.log(`Contract Address: ${address}`);
    console.log(`View on Explorer: ${explorerUrl}/address/${address}\n`);
  }
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});

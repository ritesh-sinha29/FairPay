import fs from "node:fs";
import { JsonRpcProvider, Wallet, ContractFactory, parseUnits, keccak256, toUtf8Bytes } from "ethers";

// Configuration defaults
const ARC_RPC = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.io";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const ARC_USDC = "0x3600000000000000000000000000000000000000";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: Please provide a private key to deploy.");
    console.error("Usage: PRIVATE_KEY=0x... node scripts/deploy-contract.mjs [arc|sepolia] [freelancerAddress]");
    process.exit(1);
  }

  const networkChoice = (process.argv[2] || "arc").toLowerCase();
  const isArc = networkChoice !== "sepolia";
  const rpcUrl = isArc ? ARC_RPC : SEPOLIA_RPC;
  const explorerUrl = isArc ? "https://explorer.testnet.arc.io" : "https://sepolia.etherscan.io";

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const clientAddress = await wallet.getAddress();

  console.log(`\nDeployer Account: ${clientAddress}`);
  console.log(`Network: ${isArc ? "Arc Testnet (5042002)" : "Sepolia (11155111)"}`);

  const freelancerAddress = process.argv[3] || "0x0000000000000000000000000000000000000001";
  const jobTitle = "Demo Freelance Escrow Job";

  if (isArc) {
    console.log("\nCompiling / Loading FairPayStableEscrow (Arc USDC)...");
    const artifact = JSON.parse(fs.readFileSync(new URL("../src/lib/stable-escrow-artifact.json", import.meta.url), "utf8"));
    const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const tokenAmount = parseUnits("10", 6); // 10 USDC
    const termsHash = keccak256(toUtf8Bytes("demo-terms-hash"));

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

    const depositAmount = parseUnits("0.01", 18); // 0.01 ETH

    console.log("Submitting deployment transaction with 0.01 ETH deposit...");
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

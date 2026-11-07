import {
  BrowserProvider,
  Contract,
  ContractFactory,
  isError,
  type Eip1193Provider,
  type ContractTransactionResponse,
  type JsonRpcSigner,
} from "ethers";
import legacyArtifact from "./escrow-artifact.json";
import stableArtifact from "./stable-escrow-artifact.json";
import type { Job } from "./jobs";
import { ARC_TESTNET, USDC_ABI, paymentNetwork } from "./payments";
import { agreementHash } from "./agreement";
import { isRpcRateLimit, isWalletAuthorizationError, walletErrorMessage, type WalletErrorContext } from "./wallet-errors";

interface WalletProvider extends Eip1193Provider {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
}

declare global {
  interface Window {
    ethereum?: WalletProvider;
  }
}

function injectedWallet() {
  if (!window.ethereum)
    throw new Error(
      "Install MetaMask or another Ethereum browser wallet, then reload this page.",
    );
  return window.ethereum;
}

export function browserWallet() {
  return new BrowserProvider(injectedWallet());
}

export async function connectWallet() {
  return connectInjectedWallet(injectedWallet(), true);
}

async function connectInjectedWallet(wallet: WalletProvider, recoverPermissions: boolean): Promise<JsonRpcSigner> {
  // Ask the extension directly, before ethers starts network discovery.
  try {
    await wallet.request({ method: "eth_requestAccounts" });
  } catch (cause) {
    if (recoverPermissions && isWalletAuthorizationError(cause)) {
      await requestAccountPermissions(wallet);
      return connectInjectedWallet(wallet, false);
    }
    throw Object.assign(new Error("MetaMask account access failed.", { cause }), { method: "eth_requestAccounts" });
  }
  const provider = new BrowserProvider(wallet);
  try {
    const signer = await provider.getSigner();
    // MetaMask permissions cover networks as well as accounts. Include this
    // read in the bounded permission-recovery flow before returning a signer.
    await provider.getNetwork();
    return signer;
  } catch (error) {
    provider.destroy();
    if (recoverPermissions && isWalletAuthorizationError(error)) {
      await requestAccountPermissions(wallet);
      return connectInjectedWallet(wallet, false);
    }
    throw error;
  }
}

async function requestAccountPermissions(wallet: WalletProvider) {
  // Explicit recovery action only. Reopens the permission picker even if
  // eth_requestAccounts considers this origin already connected.
  try {
    await wallet.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch (cause) {
    throw Object.assign(new Error("MetaMask permission request failed.", { cause }), { method: "wallet_requestPermissions" });
  }
}

export async function reconnectWallet() {
  const wallet = injectedWallet();
  await requestAccountPermissions(wallet);
  return connectInjectedWallet(wallet, false);
}

async function requireSigner(expectedAddress: string, chainId: number) {
  // Job actions are user initiated. Renew account access before reading the
  // signer: MetaMask may revoke permissions while the workspace stays open.
  const signer = await connectWallet();
  try {
    if (Number((await signer.provider.getNetwork()).chainId) !== chainId)
      throw new Error(
        `Switch your wallet to ${paymentNetwork(chainId).name} to continue.`,
      );
    if ((await signer.getAddress()).toLowerCase() !== expectedAddress.toLowerCase())
      throw new Error("Switch to the wallet linked to your FairPay account.");
    return signer;
  } catch (error) {
    signer.provider.destroy();
    throw error;
  }
}

export async function switchToPaymentNetwork(chainId: number) {
  const network = paymentNetwork(chainId);
  injectedWallet();
  const hexChainId = `0x${chainId.toString(16)}`;
  try {
    await window.ethereum!.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await window.ethereum!.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexChainId,
          chainName: network.name,
          nativeCurrency: {
            name: network.symbol,
            symbol: network.symbol,
            decimals: network.nativeDecimals,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.explorerUrl],
        },
      ],
    });
  }
}

async function confirmed(
  transaction: ContractTransactionResponse,
  onReplacement?: (hash: string) => Promise<void>,
) {
  try {
    await transaction.wait();
    return transaction.hash;
  } catch (error) {
    const replaced = error as {
      code?: string;
      cancelled?: boolean;
      replacement?: { hash: string };
      receipt?: { status: number };
    };
    if (replaced.code === "TRANSACTION_REPLACED" && replaced.replacement) {
      await onReplacement?.(replaced.replacement.hash);
      if (!replaced.cancelled && replaced.receipt?.status === 1)
        return replaced.replacement.hash;
    }
    throw error;
  }
}

export async function fundJob(
  job: Job,
  onDeployment: (hash: string) => Promise<void>,
  progress: (stage: string, hash?: string) => void = () => {},
) {
  const signer = await requireSigner(job.client, job.chainId);
  try {
    return await fundWithSigner(job, signer, onDeployment, progress);
  } finally {
    signer.provider.destroy();
  }
}

// Optional token extensions may be absent. Transport/rate-limit failures must
// stop preflight rather than being treated as a successful safety check.
async function optionalTokenFlag(read: () => Promise<boolean>) {
  try {
    return await read();
  } catch (error) {
    // ethers can classify an eth_call RPC error as CALL_EXCEPTION too.
    if (isRpcRateLimit(error)) throw error;
    if (isError(error, "CALL_EXCEPTION") && error.data !== null) return false;
    if (isError(error, "BAD_DATA") && error.value === "0x") return false;
    throw error;
  }
}

async function fundWithSigner(
  job: Job,
  signer: JsonRpcSigner,
  onDeployment: (hash: string) => Promise<void>,
  progress: (stage: string, hash?: string) => void,
) {
  const isNativeEth =
    job.paymentAsset === "ETH" && !job.paymentTokenAddress;

  if (isNativeEth) {
    const escrow = await new ContractFactory(
      legacyArtifact.abi,
      legacyArtifact.bytecode,
      signer,
    ).deploy(job.title, job.freelancer, { value: BigInt(job.amountWei) });
    const transaction = escrow.deploymentTransaction()!;
    await onDeployment(transaction.hash);
    return confirmed(transaction, onDeployment);
  }

  const tokenAddress =
    job.paymentTokenAddress || ARC_TESTNET.tokenAddress;
  const token = new Contract(tokenAddress, USDC_ABI, signer);
  const assetSymbol = job.paymentAsset || "token";

  // Avoid bursting all preflight reads against the wallet's public RPC.
  const paused = await optionalTokenFlag(() => token.paused());
  if (paused)
    throw new Error(`${assetSymbol} transfers are paused. Try funding again when transfers resume.`);
  const clientBlocked = await optionalTokenFlag(() => token.isBlacklisted(job.client));
  const freelancerBlocked = clientBlocked ? false : await optionalTokenFlag(() => token.isBlacklisted(job.freelancer));
  if (clientBlocked || freelancerBlocked)
    throw new Error(`${assetSymbol} transfers are blocked for an assigned wallet. Do not fund this agreement.`);

  let address = job.contractAddress;
  let deploymentHash = job.fundingHash;
  if (!address) {
    if (job.fundingHash)
      throw new Error(
        "Verify the recorded escrow deployment before trying to fund it.",
      );
    progress("Create the job escrow in your wallet…");
    const escrow = await new ContractFactory(
      stableArtifact.abi,
      stableArtifact.bytecode,
      signer,
    ).deploy(
      job.title,
      job.freelancer,
      tokenAddress,
      BigInt(job.amountWei),
      agreementHash(job),
    );
    const transaction = escrow.deploymentTransaction()!;
    await onDeployment(transaction.hash);
    progress("Waiting for escrow creation…", transaction.hash);
    deploymentHash = await confirmed(transaction, onDeployment);
    address = await escrow.getAddress();
  }
  if (!deploymentHash)
    throw new Error(
      "The escrow deployment record is missing. Refresh this job.",
    );

  const isEscrowBlocked = await optionalTokenFlag(() => token.isBlacklisted(address));
  if (isEscrowBlocked)
    throw new Error(`${assetSymbol} transfers are blocked for this escrow. Funding stopped.`);

  const escrow = new Contract(address, stableArtifact.abi, signer);
  if (Number(await escrow.status()) !== 0) return deploymentHash;

  const amount = BigInt(job.amountWei);
  const clientBalance = BigInt(await token.balanceOf(job.client));
  if (clientBalance < amount)
    throw new Error(
      `Insufficient ${assetSymbol} balance. You need ${job.amount} ${assetSymbol} to fund this escrow.`,
    );

  const allowance = BigInt(await token.allowance(job.client, address));
  if (allowance < amount) {
    progress(
      `Allow this job escrow to use ${job.amount} ${assetSymbol} in your wallet…`,
    );
    const approval = await token.approve(address, amount);
    progress(`Waiting for ${assetSymbol} permission…`, approval.hash);
    await confirmed(approval);
  }

  progress(`Lock the agreed ${assetSymbol} payment in your wallet…`);
  const funding = await escrow.fund();
  progress(`Waiting for the ${assetSymbol} deposit…`, funding.hash);
  await confirmed(funding);
  return deploymentHash;
}

export async function advanceJob(job: Job, onSent: (hash: string) => void) {
  if (!job.contractAddress || !["Funded", "Submitted"].includes(job.status))
    throw new Error("This job has no pending contract action.");
  const signer = await requireSigner(
    job.status === "Funded" ? job.freelancer : job.client,
    job.chainId,
  );
  try {
    const isTokenEscrow = Boolean(
      job.paymentTokenAddress ||
        (job.paymentAsset && job.paymentAsset !== "ETH") ||
        job.chainId === ARC_TESTNET.chainId,
    );
    const contract = new Contract(
      job.contractAddress,
      (isTokenEscrow ? stableArtifact : legacyArtifact).abi,
      signer,
    );
    const transaction =
      job.status === "Funded"
        ? await contract.markComplete()
        : isTokenEscrow
          ? await contract.verifyAndRelease()
          : await contract.releasePayment();
    onSent(transaction.hash);
    await confirmed(transaction);
  } finally {
    signer.provider.destroy();
  }
}

export function readableError(error: unknown, context?: WalletErrorContext): string {
  return walletErrorMessage(error, context);
}

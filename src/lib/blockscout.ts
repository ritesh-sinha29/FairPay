/**
 * Blockscout API Integration for FairPay
 * Provides real-time contract verification, transaction inspection, and explorer deep-linking.
 */

export const BLOCKSCOUT_NETWORKS: Record<number, { name: string; baseUrl: string; apiUrl: string }> = {
  // Ethereum Sepolia Testnet
  11155111: {
    name: "Ethereum Sepolia",
    baseUrl: "https://eth-sepolia.blockscout.com",
    apiUrl: "https://eth-sepolia.blockscout.com/api/v2",
  },
  // Arc Testnet
  5042002: {
    name: "Arc Testnet",
    baseUrl: "https://explorer.testnet.arc.network",
    apiUrl: "https://explorer.testnet.arc.network/api/v2",
  },
};

const DEFAULT_API_KEY =
  process.env.NEXT_PUBLIC_BLOCKSCOUT_API_KEY ||
  process.env.BLOCKSCOUT_API_KEY ||
  "proapi_eGLUIW2IxlQlmhUUJdz1KZz92CmeGCJWgXnlB2BNsEJWVkJDEYZxPJQ0hg3OC3dm_eLiBzF";

export function getBlockscoutBaseUrl(chainId: number): string {
  return BLOCKSCOUT_NETWORKS[chainId]?.baseUrl || "https://eth-sepolia.blockscout.com";
}

export function getBlockscoutTxUrl(chainId: number, txHash: string): string {
  const base = getBlockscoutBaseUrl(chainId);
  return `${base}/tx/${txHash}`;
}

export function getBlockscoutAddressUrl(chainId: number, address: string): string {
  const base = getBlockscoutBaseUrl(chainId);
  return `${base}/address/${address}`;
}

export interface BlockscoutContractInfo {
  address: string;
  isVerified: boolean;
  name?: string;
  compilerVersion?: string;
  txCount?: number;
  coinBalance?: string;
}

export interface BlockscoutTxInfo {
  hash: string;
  status: "ok" | "error" | "pending";
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  fee: string;
  method?: string;
}

/**
 * Fetch contract details from Blockscout API v2
 */
export async function fetchBlockscoutContract(
  chainId: number,
  address: string
): Promise<BlockscoutContractInfo | null> {
  try {
    const config = BLOCKSCOUT_NETWORKS[chainId];
    if (!config) return null;

    const url = `${config.apiUrl}/smart-contracts/${address}?apikey=${DEFAULT_API_KEY}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 30 } });
    
    if (!res.ok) {
      // Return unverified fallback with address link
      return {
        address,
        isVerified: false,
      };
    }

    const data = await res.json();
    return {
      address,
      isVerified: Boolean(data.is_verified),
      name: data.name,
      compilerVersion: data.compiler_version,
      txCount: data.tx_count,
      coinBalance: data.coin_balance,
    };
  } catch (err) {
    console.warn("Failed to fetch Blockscout contract info:", err);
    return null;
  }
}

/**
 * Fetch transaction status and execution details from Blockscout API v2
 */
export async function fetchBlockscoutTx(
  chainId: number,
  txHash: string
): Promise<BlockscoutTxInfo | null> {
  try {
    const config = BLOCKSCOUT_NETWORKS[chainId];
    if (!config) return null;

    const url = `${config.apiUrl}/transactions/${txHash}?apikey=${DEFAULT_API_KEY}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 15 } });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      hash: txHash,
      status: data.status === "ok" ? "ok" : data.status === "error" ? "error" : "pending",
      blockNumber: data.block || data.block_number,
      timestamp: data.timestamp,
      from: data.from?.hash || data.from,
      to: data.to?.hash || data.to,
      value: data.value,
      fee: data.fee?.value || "0",
      method: data.method,
    };
  } catch (err) {
    console.warn("Failed to fetch Blockscout tx info:", err);
    return null;
  }
}


// Network and token settings shared by the UI and the verification backend.
// https://docs.arc.io/arc/references/connect-to-arc
// https://docs.arc.io/arc/references/contract-addresses
export const ARC_TESTNET = {
  chainId: 5042002,
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.io",
  explorerUrl: "https://explorer.testnet.arc.io",
  symbol: "USDC",
  decimals: 6,
  nativeDecimals: 18,
  tokenAddress: "0x3600000000000000000000000000000000000000",
} as const;

export const SEPOLIA = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorerUrl: "https://sepolia.etherscan.io",
  symbol: "ETH",
  decimals: 18,
  nativeDecimals: 18,
  tokenAddress: undefined,
} as const;

export interface TokenPreset {
  id: string;
  name: string;
  symbol: string;
  chainId: number;
  decimals: number;
  isNative: boolean;
  tokenAddress?: string;
  networkName: string;
}

export const SUPPORTED_PAYMENT_TOKENS: TokenPreset[] = [
  {
    id: "arc-usdc",
    name: "USDC (Arc Testnet)",
    symbol: "USDC",
    chainId: ARC_TESTNET.chainId,
    decimals: 6,
    isNative: false,
    tokenAddress: ARC_TESTNET.tokenAddress,
    networkName: "Arc Testnet",
  },
  {
    id: "sepolia-eth",
    name: "ETH (Sepolia Native)",
    symbol: "ETH",
    chainId: SEPOLIA.chainId,
    decimals: 18,
    isNative: true,
    tokenAddress: undefined,
    networkName: "Sepolia",
  },
  {
    id: "arc-sharp",
    name: "SHARP Token (Arc)",
    symbol: "SHARP",
    chainId: ARC_TESTNET.chainId,
    decimals: 18,
    isNative: false,
    tokenAddress: "0x8900000000000000000000000000000000000001",
    networkName: "Arc Testnet",
  },
  {
    id: "custom-erc20",
    name: "Custom ERC-20 Token (Any Token)",
    symbol: "CUSTOM",
    chainId: ARC_TESTNET.chainId,
    decimals: 18,
    isNative: false,
    tokenAddress: "",
    networkName: "Arc Testnet / Sepolia",
  },
];

export function paymentNetwork(chainId: number) {
  if (chainId === ARC_TESTNET.chainId) return ARC_TESTNET;
  if (chainId === SEPOLIA.chainId) return SEPOLIA;
  throw new Error("This job uses an unsupported payment network.");
}

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

export const USDC_ABI = [
  ...ERC20_ABI,
  "function paused() view returns (bool)",
  "function isBlacklisted(address) view returns (bool)",
];

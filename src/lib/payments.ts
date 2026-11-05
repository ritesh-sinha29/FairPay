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

const SEPOLIA = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorerUrl: "https://sepolia.etherscan.io",
  symbol: "ETH",
  decimals: 18,
  nativeDecimals: 18,
  tokenAddress: undefined,
} as const;

export function paymentNetwork(chainId: number) {
  if (chainId === ARC_TESTNET.chainId) return ARC_TESTNET;
  if (chainId === SEPOLIA.chainId) return SEPOLIA;
  throw new Error("This job uses an unsupported payment network.");
}

export const ERC20_ABI = [
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

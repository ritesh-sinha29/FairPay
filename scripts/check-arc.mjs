import { JsonRpcProvider, Contract } from "ethers";
const endpoint = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.io";
const provider = new JsonRpcProvider(endpoint, undefined, { cacheTimeout: -1 });
try {
  const chainId = Number(await provider.send("eth_chainId", []));
  if (chainId !== 5042002) throw new Error(`Wrong chain ID: ${chainId}`);
  const token = new Contract(
    "0x3600000000000000000000000000000000000000",
    [
      "function decimals() view returns(uint8)",
      "function paused() view returns(bool)",
      "function isBlacklisted(address) view returns(bool)",
    ],
    provider,
  );
  const decimals = Number(await token.decimals());
  if (decimals !== 6) throw new Error(`Wrong token precision: ${decimals}`);
  const paused = await token.paused();
  await token.isBlacklisted("0x0000000000000000000000000000000000000001");
  console.log(
    `Arc Testnet RPC verified. Chain ${chainId}; USDC ERC20 decimals ${decimals}; transfers ${paused ? "paused" : "active"}; block ${await provider.getBlockNumber()}.`,
  );
} finally {
  provider.destroy();
}

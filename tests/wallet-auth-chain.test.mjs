import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as ethers from "ethers";
import { build } from "esbuild";
import * as convexAuth from "@convex-dev/auth/server";

const result = await build({ entryPoints: ["convex/walletActions.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external" });
function actions({ wrongRpcChain = false } = {}) {
  const providers = [];
  class Provider {
    constructor(url, chainId) { this.url = url; this.chainId = chainId; providers.push(this); }
    async send() { return `0x${(wrongRpcChain ? 11155111 : this.chainId).toString(16)}`; }
    async getCode() { return "0x6000"; }
    destroy() { this.destroyed = true; }
  }
  class Contract { async isValidSignature() { return "0x1626ba7e"; } }
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: name => name === "ethers" ? { ...ethers, JsonRpcProvider: Provider, Contract } : name === "@convex-dev/auth/server" ? convexAuth : require(name), URL, process: { env: { SITE_URL: "https://fairpay29.vercel.app", ARC_RPC_URL: "https://arc-rpc.example" } } });
  return { begin: module.exports.begin._handler, verify: module.exports.verify._handler, providers };
}
const address = "0x" + "1".repeat(40);
test("Arc and Sepolia sign-in messages and stored challenges use the selected chain", async () => {
  for (const chainId of [5042002, 11155111]) {
    let saved;
    const { begin } = actions();
    const result = await begin({ runMutation: async (_ref, args) => { saved = args; return "challenge"; } }, { address, chainId, flow: "signIn" });
    assert.match(result.message, new RegExp(`Chain ID: ${chainId}\\n`));
    assert.equal(saved.chainId, chainId);
    assert.equal(saved.message, result.message);
    assert.match(result.message, /URI: https:\/\/fairpay29.vercel.app/);
  }
});
test("Old clients retain Sepolia compatibility and unsupported chains cannot issue challenges", async () => {
  const { begin } = actions();
  let calls = 0;
  const ctx = { runMutation: async () => { calls++; return "challenge"; } };
  assert.match((await begin(ctx, { address, flow: "signIn" })).message, /Chain ID: 11155111/);
  await assert.rejects(() => begin(ctx, { address, flow: "signIn", chainId: 999 }), /Arc Testnet or Sepolia/);
  assert.equal(calls, 1);
});
test("A real EOA signature verifies the issued Arc message without an RPC lookup", async () => {
  const wallet = ethers.Wallet.createRandom();
  const { begin, verify, providers } = actions();
  let challenge;
  const issued = await begin({ runMutation: async (_ref, args) => { challenge = args; return "challenge"; } }, { address: wallet.address, chainId: 5042002, flow: "signIn" });
  let consumed = false;
  await verify({ runQuery: async () => challenge, runMutation: async () => { consumed = true; return challenge; } }, { challengeId: "challenge", signature: await wallet.signMessage(issued.message) });
  assert.equal(consumed, true);
  assert.equal(providers.length, 0);
});
test("Contract-wallet verification uses the challenge chain and rejects a wrong-chain RPC", async () => {
  for (const wrongRpcChain of [false, true]) {
    const { verify, providers } = actions({ wrongRpcChain });
    const challenge = { address, message: "test", chainId: 5042002, expiresAt: Date.now() + 60000 };
    let consumed = false;
    const operation = () => verify({ runQuery: async () => challenge, runMutation: async () => { consumed = true; return challenge; } }, { challengeId: "challenge", signature: "0x" });
    if (wrongRpcChain) await assert.rejects(operation, /signature does not match/); else await operation();
    assert.equal(consumed, !wrongRpcChain);
    assert.equal(providers[0].chainId, 5042002);
    assert.equal(providers[0].url, "https://arc-rpc.example");
    assert.equal(providers[0].destroyed, true);
  }
});

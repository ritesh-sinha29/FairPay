import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { build } from "esbuild";
import { BrowserProvider } from "ethers";

const result = await build({ entryPoints: ["src/lib/wallet-errors.ts"], bundle: true, write: false, platform: "node", format: "cjs" });
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, URL });
const { walletErrorMessage } = module.exports;
const context = { chainId: 5042002, operation: "submit" };
const wrapped = originalError => ({
  code: "UNKNOWN_ERROR", shortMessage: "could not coalesce error",
  error: { code: -32603, message: "Internal JSON-RPC error.", data: { originalError } },
});

test("MetaMask's underlying RPC reason replaces the ethers wrapper", () => {
  assert.equal(walletErrorMessage(wrapped({ code: -32000, message: "Transaction type 4 is not supported by this RPC." }), context), "Transaction type 4 is not supported by this RPC.");
  assert.match(walletErrorMessage(wrapped({ code: -32005, message: "rate limit exceeded" }), context), /rate-limiting/);
  const nestedJson = { code: "UNKNOWN_ERROR", info: { error: { data: JSON.stringify({ originalError: { code: -32000, message: "The RPC rejected this transaction." } }) } } };
  assert.equal(walletErrorMessage(nestedJson), "The RPC rejected this transaction.");
});

test("Actual ethers BrowserProvider wrapping retains the underlying wallet rejection", async () => {
  const provider = new BrowserProvider({ request: async ({ method }) => {
    if (method === "eth_chainId") return "0x4cef52";
    throw { code: -32603, message: "Internal JSON-RPC error.", data: { originalError: { code: -32000, message: "The selected RPC rejected this transaction." } } };
  } });
  try {
    await assert.rejects(
      () => provider.send("eth_sendTransaction", [{ from: "0x" + "1".repeat(40), to: "0x" + "2".repeat(40), value: "0x0" }]),
      error => {
        assert.equal(error.shortMessage, "could not coalesce error");
        assert.equal(walletErrorMessage(error, context), "The selected RPC rejected this transaction.");
        return true;
      },
    );
  } finally { provider.destroy(); }
});

test("Submission gas errors name Arc Testnet USDC rather than the agreed escrow deposit", () => {
  const text = walletErrorMessage(wrapped({ code: -32000, message: "insufficient funds for gas * price + value" }), context);
  assert.match(text, /Arc Testnet USDC for transaction gas/);
  assert.doesNotMatch(text, /payment asset/);
});

test("Cancellation, pending requests, and nonces have distinct recovery messages", () => {
  assert.match(walletErrorMessage(wrapped({ code: 4001, message: "User rejected request" })), /cancelled/);
  assert.match(walletErrorMessage(wrapped({ code: -32002, message: "Request already pending" })), /request is already open/);
  assert.match(walletErrorMessage({ code: "NONCE_EXPIRED" }), /outdated transaction nonce/);
  assert.match(walletErrorMessage({ code: "REPLACEMENT_UNDERPRICED" }), /already pending/);
});

test("Opaque wallet errors offer the correct RPC settings without claiming a confirmed cause", () => {
  const text = walletErrorMessage({ code: "UNKNOWN_ERROR", shortMessage: "could not coalesce error" }, context);
  assert.match(text, /MetaMask could not broadcast/);
  assert.match(text, /https:\/\/rpc.testnet.arc.io/);
  assert.doesNotMatch(text, /coalesce/);
});

test("Readable business errors survive, while credentials and transaction payloads stay hidden", () => {
  assert.equal(walletErrorMessage({ data: "Only the assigned freelancer can submit work.", message: "[CONVEX A(jobs:submit)] Server Error" }), "Only the assigned freelancer can submit work.");
  assert.equal(walletErrorMessage(new Error("[CONVEX A(jobs:accept)] [Request ID: abc] Server Error Uncaught ConvexError: Sign in to continue.\n at backend.ts:1")), "Sign in to continue.");
  const text = walletErrorMessage(wrapped({ message: "RPC denied https://rpc.example/private-token?key=secret proapi_exampleKey" }));
  assert.doesNotMatch(text, /private-token|key=secret|proapi_exampleKey/);
  const error = { code: "UNKNOWN_ERROR", shortMessage: "could not coalesce error", data: "0xdeadbeef", info: { payload: { privateKey: "do-not-display" } } };
  error.cause = error;
  assert.doesNotMatch(walletErrorMessage(error), /0xdeadbeef|do-not-display/);
});

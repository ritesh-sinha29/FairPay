import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { build } from "esbuild";

const result = await build({ entryPoints: ["src/lib/ethereum.ts"], bundle: true, write: false, platform: "node", format: "cjs", external: ["ethers"] });
const freelancer = "0x" + "1".repeat(40);
const contractAddress = "0x" + "2".repeat(40);
const job = { status: "Funded", freelancer, contractAddress, chainId: 5042002 };

function wallet({ account = freelancer, chainId = job.chainId, cancelAccess = false } = {}) {
  let authorized = false;
  const calls = [];
  const ethereum = { request: async ({ method, params }) => {
    calls.push({ method, params });
    if (method === "eth_chainId") return `0x${chainId.toString(16)}`;
    if (method === "eth_blockNumber") return "0x1";
    if (method === "eth_requestAccounts") {
      if (cancelAccess) throw { code: 4001, message: "User rejected account access" };
      authorized = true;
      return [account];
    }
    if (method === "eth_accounts") {
      if (!authorized) throw { code: 4100, message: "Account access has been revoked" };
      return [account];
    }
    if (method === "eth_estimateGas") return "0x7530";
    // Stop at the transaction confirmation boundary; never return a fake hash.
    if (method === "eth_sendTransaction") throw { code: 4001, message: "User rejected transaction" };
    throw new Error(`Unexpected RPC method: ${method}`);
  } };
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: createRequire(import.meta.url), window: { ethereum } });
  return { advanceJob: module.exports.advanceJob, calls };
}

test("Submission restores revoked account access before asking to sign", async () => {
  const { advanceJob, calls } = wallet();
  await assert.rejects(() => advanceJob(job, () => assert.fail("No transaction was broadcast")), error => error.code === "ACTION_REJECTED");
  const methods = calls.map(call => call.method);
  assert.ok(methods.indexOf("eth_requestAccounts") < methods.indexOf("eth_accounts"));
  assert.equal(methods.filter(method => method === "eth_sendTransaction").length, 1);
  const transaction = calls.find(call => call.method === "eth_sendTransaction").params[0];
  assert.equal(transaction.from, freelancer);
  assert.equal(transaction.to, contractAddress);
});

test("Declining account access never opens a transaction request", async () => {
  const { advanceJob, calls } = wallet({ cancelAccess: true });
  await assert.rejects(() => advanceJob(job, () => {}), error => error.code === "ACTION_REJECTED");
  assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
});

test("Reauthorizing the wrong account or chain cannot submit work", async () => {
  for (const [options, expected] of [
    [{ account: "0x" + "3".repeat(40) }, /wallet linked to your FairPay account/],
    [{ chainId: 11155111 }, /Switch your wallet to Arc Testnet/],
  ]) {
    const { advanceJob, calls } = wallet(options);
    await assert.rejects(() => advanceJob(job, () => {}), expected);
    assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
  }
});

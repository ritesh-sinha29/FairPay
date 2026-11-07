import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { build } from "esbuild";
import * as ethers from "ethers";

const result = await build({ entryPoints: ["src/lib/ethereum.ts"], bundle: true, write: false, platform: "node", format: "cjs", external: ["ethers"] });
const signingWallet = ethers.Wallet.createRandom();
const freelancer = signingWallet.address.toLowerCase();
const contractAddress = "0x" + "2".repeat(40);
const job = { status: "Funded", freelancer, contractAddress, chainId: 5042002 };

function wallet({ account = freelancer, chainId = job.chainId, cancelAccess = false, requiresPermissionPicker = false, requiresChainPermission = false, cancelPermissions = false, rateLimited = false, ratePreflight = false, requiresSigningPermission = false, denyEverySignature = false, cancelSignature = false, accountAfterPermission, chainAfterPermission } = {}) {
  let authorized = false;
  let permissionsRenewed = false;
  const calls = [];
  const providers = [];
  const activeAccount = () => permissionsRenewed && accountAfterPermission ? accountAfterPermission : account;
  const ethereum = { request: async ({ method, params }) => {
    calls.push({ method, params });
    if (method === "eth_chainId") {
      if (requiresChainPermission && !permissionsRenewed) throw { code: 4100, message: "The requested account and/or method has not been authorized by the user." };
      if (rateLimited) throw { code: -32005, message: "Request is being rate limited." };
      return `0x${(permissionsRenewed && chainAfterPermission ? chainAfterPermission : chainId).toString(16)}`;
    }
    if (method === "eth_blockNumber") return "0x1";
    if (method === "eth_requestAccounts") {
      if (cancelAccess) throw { code: 4001, message: "User rejected account access" };
      if (requiresPermissionPicker && !permissionsRenewed) throw { code: 4100, message: "Account has not been authorized" };
      authorized = true;
      return [activeAccount()];
    }
    if (method === "wallet_requestPermissions") {
      if (cancelPermissions) throw { code: 4001, message: "User rejected permissions" };
      permissionsRenewed = true;
      return [{ parentCapability: "eth_accounts", caveats: [] }];
    }
    if (method === "eth_accounts") {
      if (rateLimited) throw { code: -32005, message: "Request is being rate limited." };
      if (!authorized) throw { code: 4100, message: "Account access has been revoked" };
      return [activeAccount()];
    }
    if (method === "personal_sign") {
      if (cancelSignature) throw { code: 4001, message: "User rejected signature" };
      if (denyEverySignature || (requiresSigningPermission && !permissionsRenewed)) throw { code: 4100, message: "The requested account and/or method has not been authorized by the user." };
      assert.equal(params[1].toLowerCase(), activeAccount().toLowerCase());
      return signingWallet.signMessage(ethers.getBytes(params[0]));
    }
    if (method === "eth_estimateGas") return "0x7530";
    if (method === "eth_call" && ratePreflight) throw { code: -32005, message: "Request is being rate limited." };
    // Stop at the transaction confirmation boundary; never return a fake hash.
    if (method === "eth_sendTransaction") throw { code: 4001, message: "User rejected transaction" };
    throw new Error(`Unexpected RPC method: ${method}`);
  } };
  class TrackedProvider extends ethers.BrowserProvider {
    constructor(...args) {
      super(...args);
      providers.push(this);
      void this.on("error", () => {});
    }
  }
  const module = { exports: {} };
  const require = createRequire(import.meta.url);
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: name => name === "ethers" ? { ...ethers, BrowserProvider: TrackedProvider } : require(name), window: { ethereum } });
  return { advanceJob: module.exports.advanceJob, fundJob: module.exports.fundJob, connectWallet: module.exports.connectWallet, reconnectWallet: module.exports.reconnectWallet, signWalletMessage: module.exports.signWalletMessage, readableError: module.exports.readableError, calls, providers };
}

test("A rate-limited connection stops its provider instead of leaving network discovery retrying", async () => {
  const { connectWallet, providers, calls } = wallet({ rateLimited: true });
  try {
    await assert.rejects(connectWallet);
    assert.equal(providers.length, 1);
    assert.equal(providers[0].destroyed, true);
    const count = calls.length;
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(calls.length, count, "No network-discovery retries after failure");
  } finally { for (const provider of providers) provider.destroy(); }
});

test("Funding stops at a rate-limited safety read instead of issuing more calls or transactions", async () => {
  const { fundJob, calls, providers, readableError } = wallet({ ratePreflight: true });
  await assert.rejects(() => fundJob({ ...job, status: "Draft", client: freelancer, amount: "5", amountWei: "5000000", paymentAsset: "USDC", fundingHash: "0x" + "4".repeat(64) }, async () => assert.fail("No deployment expected")), error => /rate-limiting/.test(readableError(error)));
  assert.equal(calls.filter(call => call.method === "eth_call").length, 1);
  assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
  assert.ok(providers.every(provider => provider.destroyed));
});

test("Submission restores revoked account access before asking to sign", async () => {
  const { advanceJob, calls, providers } = wallet();
  await assert.rejects(() => advanceJob(job, () => assert.fail("No transaction was broadcast")), error => error.code === "ACTION_REJECTED");
  const methods = calls.map(call => call.method);
  assert.equal(methods[0], "eth_requestAccounts", "Account access precedes ethers network discovery");
  assert.ok(methods.indexOf("eth_requestAccounts") < methods.indexOf("eth_accounts"));
  assert.equal(methods.filter(method => method === "eth_sendTransaction").length, 1);
  const transaction = calls.find(call => call.method === "eth_sendTransaction").params[0];
  assert.equal(transaction.from, freelancer);
  assert.equal(transaction.to, contractAddress);
  assert.ok(providers.every(provider => provider.destroyed));
});

test("Declining account access never opens a transaction request", async () => {
  const { advanceJob, calls } = wallet({ cancelAccess: true });
  await assert.rejects(() => advanceJob(job, () => {}), error => error.cause?.code === 4001);
  assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
});

test("Explicit reconnect reopens permissions without sending a transaction", async () => {
  const { reconnectWallet, calls } = wallet({ requiresPermissionPicker: true });
  const signer = await reconnectWallet();
  assert.equal((await signer.getAddress()).toLowerCase(), freelancer);
  assert.equal(JSON.stringify(calls.find(call => call.method === "wallet_requestPermissions").params), JSON.stringify([{ eth_accounts: {} }]));
  assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
  signer.provider.destroy();
});

test("An unauthorized connection opens permissions once and never retries a payment", async () => {
  const { connectWallet, calls } = wallet({ requiresPermissionPicker: true });
  const signer = await connectWallet();
  assert.equal(calls.filter(call => call.method === "wallet_requestPermissions").length, 1);
  assert.equal(calls.filter(call => call.method === "eth_requestAccounts").length, 2);
  assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
  signer.provider.destroy();
});

test("Missing network permission is repaired even when account access already succeeds", async () => {
  const { connectWallet, calls, providers } = wallet({ requiresChainPermission: true });
  const signer = await connectWallet();
  assert.equal(calls.filter(call => call.method === "wallet_requestPermissions").length, 1);
  assert.equal(providers[0].destroyed, true, "The failed network connection is stopped");
  assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
  signer.provider.destroy();
});

test("Declining permission recovery stops without another connection or payment attempt", async () => {
  const { connectWallet, calls } = wallet({ requiresPermissionPicker: true, cancelPermissions: true });
  await assert.rejects(connectWallet, error => error.cause?.code === 4001);
  assert.equal(calls.filter(call => call.method === "wallet_requestPermissions").length, 1);
  assert.equal(calls.filter(call => call.method === "eth_requestAccounts").length, 1);
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

test("A denied login signature renews permissions once and signs the same message/account", async () => {
  const { connectWallet, signWalletMessage, calls } = wallet({ requiresSigningPermission: true });
  const signer = await connectWallet();
  try {
    let prompted = 0;
    const message = "Sign in to FairPay on Arc Testnet";
    const signature = await signWalletMessage(signer, message, job.chainId, () => prompted++);
    assert.equal(ethers.verifyMessage(message, signature).toLowerCase(), freelancer);
    assert.equal(prompted, 1);
    assert.equal(calls.filter(call => call.method === "wallet_requestPermissions").length, 1);
    const signatures = calls.filter(call => call.method === "personal_sign");
    assert.equal(signatures.length, 2);
    assert.deepEqual(signatures[0].params, signatures[1].params);
    assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
  } finally { signer.provider.destroy(); }
});

test("Normal login signing and declined signatures do not open permission recovery", async () => {
  for (const cancelSignature of [false, true]) {
    const { connectWallet, signWalletMessage, calls } = wallet({ cancelSignature });
    const signer = await connectWallet();
    try {
      const operation = () => signWalletMessage(signer, "FairPay sign-in", job.chainId);
      if (cancelSignature) await assert.rejects(operation, error => error.code === "ACTION_REJECTED"); else await operation();
      assert.equal(calls.filter(call => call.method === "personal_sign").length, 1);
      assert.equal(calls.filter(call => call.method === "wallet_requestPermissions").length, 0);
    } finally { signer.provider.destroy(); }
  }
});

test("Declined recovery and persistent signature denial stop without looping", async () => {
  for (const cancelPermissions of [false, true]) {
    const { connectWallet, signWalletMessage, calls } = wallet({ denyEverySignature: true, cancelPermissions });
    const signer = await connectWallet();
    try {
      await assert.rejects(() => signWalletMessage(signer, "FairPay sign-in", job.chainId));
      assert.equal(calls.filter(call => call.method === "wallet_requestPermissions").length, 1);
      assert.equal(calls.filter(call => call.method === "personal_sign").length, cancelPermissions ? 1 : 2);
      assert.ok(!calls.some(call => call.method === "eth_sendTransaction"));
    } finally { signer.provider.destroy(); }
  }
});

test("Changing account or chain during permission recovery cannot sign the old challenge", async () => {
  for (const [options, expected] of [
    [{ accountAfterPermission: "0x" + "3".repeat(40) }, /selected wallet changed/],
    [{ chainAfterPermission: 11155111 }, /wallet network changed/],
  ]) {
    const { connectWallet, signWalletMessage, calls } = wallet({ requiresSigningPermission: true, ...options });
    const signer = await connectWallet();
    try {
      await assert.rejects(() => signWalletMessage(signer, "FairPay sign-in", job.chainId), expected);
      assert.equal(calls.filter(call => call.method === "personal_sign").length, 1);
    } finally { signer.provider.destroy(); }
  }
});

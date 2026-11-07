import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import ganache from "ganache";
import solc from "solc";
import {
  BrowserProvider,
  Contract,
  ContractFactory,
  parseUnits,
  ZeroAddress,
  ZeroHash,
} from "ethers";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
fs.mkdirSync(new URL(".reference/", root), { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL("src/lib/verify-escrow.ts", root))],
  outfile: fileURLToPath(new URL(".reference/verify-escrow.test.mjs", root)),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
});
const { verifyEscrowState } = await import(
  new URL(".reference/verify-escrow.test.mjs", root)
);
await build({
  entryPoints: [fileURLToPath(new URL("src/lib/ethereum.ts", root))],
  outfile: fileURLToPath(new URL(".reference/ethereum.test.mjs", root)),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
});
const { fundJob, advanceJob } = await import(
  new URL(".reference/ethereum.test.mjs", root)
);
const artifact = JSON.parse(
  fs.readFileSync(new URL("src/lib/stable-escrow-artifact.json", root)),
);
const terms = "0x" + "ab".repeat(32);
const usdc = "0x3600000000000000000000000000000000000000";
const amount = parseUnits("25.123456", 6);
const source = `pragma solidity 0.8.30;
contract TestUSDC {
  uint8 public constant decimals = 6;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;
  bool public fail; bool public fee;
  bool public paused;
  mapping(address => bool) public isBlacklisted;
  function setPaused(bool value) external { paused = value; }
  function setBlacklisted(address account, bool value) external { isBlacklisted[account] = value; }
  function mint(address a, uint256 v) external { balanceOf[a] += v; }
  function configure(bool f, bool fee_) external { fail = f; fee = fee_; }
  function approve(address a, uint256 v) external returns(bool) { allowance[msg.sender][a] = v; return true; }
  function transferFrom(address a, address b, uint256 v) external returns(bool) {
    if(fail) return false;
    require(allowance[a][msg.sender] >= v, "Allowance"); allowance[a][msg.sender] -= v;
    move(a,b,v); return true;
  }
  function transfer(address b, uint256 v) external returns(bool) { if(fail) return false; move(msg.sender,b,v); return true; }
  function move(address a, address b, uint256 v) internal { require(balanceOf[a] >= v, "Balance"); balanceOf[a] -= v; balanceOf[b] += fee ? v-1 : v; }
}`;
const compiled = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources: { "Test.sol": { content: source } },
      settings: {
        evmVersion: "paris",
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
          },
        },
      },
    }),
  ),
);
const mock = compiled.contracts["Test.sol"].TestUSDC;
let chain, provider, client, freelancer, stranger, token;
before(async () => {
  chain = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 5042002, hardfork: "shanghai" },
    wallet: { totalAccounts: 3 },
  });
  provider = new BrowserProvider(chain, undefined, { cacheTimeout: -1 });
  provider.pollingInterval = 20;
  [client, freelancer, stranger] = await Promise.all(
    [0, 1, 2].map((i) => provider.getSigner(i)),
  );
  // Model Arc's official system-token address with a six-decimal ERC20 test double.
  await provider.send("evm_setAccountCode", [
    usdc,
    "0x" + mock.evm.deployedBytecode.object,
  ]);
  token = new Contract(usdc, mock.abi, client);
  await (
    await token.mint(await client.getAddress(), parseUnits("100000", 6))
  ).wait();
});
after(async () => {
  provider?.destroy();
  await chain?.disconnect();
});

test("wallet flow resumes a rejected USDC permission on the same escrow and verification pays", async () => {
  const previousWindow = globalThis.window;
  let active = await client.getAddress();
  let rejectApproval = true;
  globalThis.window = {
    ethereum: {
      request: async (args) => {
        if (
          args.method === "eth_accounts" ||
          args.method === "eth_requestAccounts"
        )
          return [active];
        if (
          rejectApproval &&
          args.method === "eth_sendTransaction" &&
          args.params[0].data?.startsWith("0x095ea7b3")
        ) {
          const error = new Error("User rejected token permission");
          error.code = 4001;
          throw error;
        }
        return chain.request(args);
      },
    },
  };
  try {
    const job = {
      id: "resume-job",
      title: "Wallet recovery job",
      description:
        "Deliver the agreed final design files for client verification.",
      client: (await client.getAddress()).toLowerCase(),
      freelancer: (await freelancer.getAddress()).toLowerCase(),
      amountWei: amount.toString(),
      chainId: 5042002,
      paymentAsset: "USDC",
      status: "Draft",
    };
    const stages = [];
    await assert.rejects(
      fundJob(
        job,
        async (hash) => {
          job.fundingHash = hash;
        },
        (stage) => stages.push(stage),
      ),
    );
    assert.ok(job.fundingHash);
    job.contractAddress = (
      await provider.getTransactionReceipt(job.fundingHash)
    ).contractAddress;
    const escrow = new Contract(job.contractAddress, artifact.abi, client);
    assert.equal(await escrow.status(), 0n);
    assert.equal(await token.balanceOf(job.contractAddress), 0n);
    rejectApproval = false;
    let deployments = 0;
    assert.equal(
      await fundJob(job, async () => {
        deployments++;
      }),
      job.fundingHash,
    );
    assert.equal(deployments, 0);
    assert.equal(await escrow.status(), 1n);
    assert.equal(await token.balanceOf(job.contractAddress), amount);
    // Retrying after a confirmed deposit reads state and never pulls a second payment.
    await fundJob(job, async () => {
      deployments++;
    });
    assert.equal(await token.balanceOf(job.contractAddress), amount);
    job.status = "Funded";
    active = await freelancer.getAddress();
    await advanceJob(job, () => {});
    assert.equal(await escrow.status(), 2n);
    job.status = "Submitted";
    active = await client.getAddress();
    const before = await token.balanceOf(job.freelancer);
    await advanceJob(job, () => {});
    assert.equal(await escrow.status(), 3n);
    assert.equal(await token.balanceOf(job.freelancer), before + amount);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("funding preflight rejects paused USDC and blocked participants before deployment", async () => {
  const previousWindow = globalThis.window;
  globalThis.window = { ethereum: {
    request: ({ method, params }) => chain.request({
      method: method === "eth_requestAccounts" ? "eth_accounts" : method,
      params,
    }),
  } };
  const job = {
    id: "blocked-job",
    title: "Funding preflight",
    description:
      "A funding request must stop before payment cannot be delivered.",
    client: (await client.getAddress()).toLowerCase(),
    freelancer: (await freelancer.getAddress()).toLowerCase(),
    amountWei: amount.toString(),
    chainId: 5042002,
    paymentAsset: "USDC",
    status: "Draft",
  };
  let deployed = false;
  try {
    await (await token.setPaused(true)).wait();
    await assert.rejects(
      fundJob(job, async () => {
        deployed = true;
      }),
      /paused/,
    );
    await (await token.setPaused(false)).wait();
    await (await token.setBlacklisted(job.freelancer, true)).wait();
    await assert.rejects(
      fundJob(job, async () => {
        deployed = true;
      }),
      /blocked/,
    );
    assert.equal(deployed, false);
  } finally {
    await (await token.setPaused(false)).wait();
    await (await token.setBlacklisted(job.freelancer, false)).wait();
    globalThis.window = previousWindow;
  }
});
async function reject(operation) {
  await assert.rejects(async () => {
    const tx = await operation();
    if (tx?.wait) await tx.wait();
  });
}
async function deploy(overrides = {}) {
  const escrow = await new ContractFactory(
    artifact.abi,
    artifact.bytecode,
    client,
  ).deploy(
    overrides.title ?? "Design a logo",
    overrides.freelancer ?? (await freelancer.getAddress()),
    overrides.token ?? usdc,
    overrides.amount ?? amount,
    overrides.terms ?? terms,
  );
  await escrow.waitForDeployment();
  return escrow;
}
async function fund(escrow) {
  await (await token.approve(await escrow.getAddress(), amount)).wait();
  await (await escrow.fund()).wait();
}

test("USDC is locked only after funding and client verification atomically pays exactly once", async () => {
  const escrow = await deploy();
  const address = await escrow.getAddress();
  assert.equal(await escrow.status(), 0n);
  assert.equal(await token.balanceOf(address), 0n);
  assert.equal(await escrow.agreementHash(), terms);
  await reject(() => escrow.connect(freelancer).markComplete());
  await reject(() => escrow.verifyAndRelease());
  await reject(() => escrow.connect(stranger).fund());
  await reject(() => escrow.fund()); // no allowance
  assert.equal(await escrow.status(), 0n);
  await fund(escrow);
  assert.equal(await escrow.status(), 1n);
  assert.equal(await token.balanceOf(address), amount);
  assert.equal(await token.allowance(await client.getAddress(), address), 0n);
  await reject(() => escrow.fund());
  await reject(() => escrow.markComplete());
  await reject(() => escrow.connect(stranger).markComplete());
  await reject(() => escrow.verifyAndRelease());
  await (await escrow.connect(freelancer).markComplete()).wait();
  await reject(() => escrow.connect(stranger).verifyAndRelease());
  await reject(() => escrow.connect(freelancer).verifyAndRelease());
  const before = await token.balanceOf(await freelancer.getAddress());
  await (await escrow.verifyAndRelease()).wait();
  assert.equal(await escrow.status(), 3n);
  assert.equal(await token.balanceOf(address), 0n);
  assert.equal(
    await token.balanceOf(await freelancer.getAddress()),
    before + amount,
  );
  await reject(() => escrow.verifyAndRelease());
});

test("failed or short token deposits roll back and can be retried on the same contract", async () => {
  const escrow = await deploy();
  const address = await escrow.getAddress();
  await (await token.approve(address, amount)).wait();
  await (await token.configure(true, false)).wait();
  await reject(() => escrow.fund());
  assert.equal(await escrow.status(), 0n);
  await (await token.configure(false, true)).wait();
  await reject(() => escrow.fund());
  assert.equal(await escrow.status(), 0n);
  assert.equal(await token.balanceOf(address), 0n);
  await (await token.configure(false, false)).wait();
  await (await escrow.fund()).wait();
  assert.equal(await escrow.status(), 1n);
});

test("failed payouts retain Submitted state and the full deposit", async () => {
  const escrow = await deploy();
  await fund(escrow);
  await (await escrow.connect(freelancer).markComplete()).wait();
  await (await token.configure(true, false)).wait();
  await reject(() => escrow.verifyAndRelease());
  assert.equal(await escrow.status(), 2n);
  assert.equal(await token.balanceOf(await escrow.getAddress()), amount);
  await (await token.configure(false, true)).wait();
  await reject(() => escrow.verifyAndRelease());
  assert.equal(await escrow.status(), 2n);
  assert.equal(await token.balanceOf(await escrow.getAddress()), amount);
  await (await token.configure(false, false)).wait();
  await (await escrow.verifyAndRelease()).wait();
  assert.equal(await escrow.status(), 3n);
});

test("invalid terms, title, parties, token and amount cannot create an escrow", async () => {
  for (const overrides of [
    { title: "" },
    { title: "a".repeat(161) },
    { freelancer: ZeroAddress },
    { freelancer: await client.getAddress() },
    { token: ZeroAddress },
    { amount: 0n },
    { terms: ZeroHash },
  ])
    await reject(() => deploy(overrides));
});

test("backend verification distinguishes creation from deposit and rejects altered agreements", async () => {
  const job = {
    _id: "test-job",
    title: "Verify real terms",
    description: "A complete immutable agreement for this job.",
    clientAddress: (await client.getAddress()).toLowerCase(),
    freelancerAddress: (await freelancer.getAddress()).toLowerCase(),
    chainId: 5042002,
    paymentAsset: "USDC",
    amountWei: amount.toString(),
  };
  const { keccak256, toUtf8Bytes } = await import("ethers");
  const hash = keccak256(
    toUtf8Bytes(
      JSON.stringify([
        "fairpay-agreement-v1",
        job._id,
        job.chainId,
        job.clientAddress,
        job.freelancerAddress,
        job.title,
        job.description,
        job.amountWei,
      ]),
    ),
  );
  const escrow = await deploy({ title: job.title, terms: hash });
  const txHash = escrow.deploymentTransaction().hash;
  assert.equal(
    (await verifyEscrowState(provider, job, txHash)).status,
    "Draft",
  );
  await fund(escrow);
  assert.equal(
    (await verifyEscrowState(provider, job, txHash)).status,
    "Funded",
  );
  await (await escrow.connect(freelancer).markComplete()).wait();
  assert.equal(
    (await verifyEscrowState(provider, job, txHash)).status,
    "Submitted",
  );
  await (await escrow.verifyAndRelease()).wait();
  assert.equal((await verifyEscrowState(provider, job, txHash)).status, "Paid");
  for (const change of [
    { description: "Changed scope" },
    { amountWei: "1" },
    { title: "Different job" },
    { freelancerAddress: await stranger.getAddress() },
    { clientAddress: await stranger.getAddress() },
    { paymentAsset: undefined },
    { chainId: 11155111 },
  ])
    await assert.rejects(
      verifyEscrowState(provider, { ...job, ...change }, txHash),
    );
});

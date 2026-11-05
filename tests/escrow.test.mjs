import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import ganache from "ganache";
import { BrowserProvider, ContractFactory, parseEther } from "ethers";
import solc from "solc";
import fs from "node:fs";

const artifact = JSON.parse(
  fs.readFileSync(
    new URL("../src/lib/escrow-artifact.json", import.meta.url),
    "utf8",
  ),
);
let chain;
let provider;
let client;
let freelancer;
let stranger;
const deposit = parseEther("0.01");

before(async () => {
  chain = ganache.provider({
    logging: { quiet: true },
    chain: { hardfork: "shanghai" },
    wallet: { totalAccounts: 3 },
  });
  provider = new BrowserProvider(chain, undefined, { cacheTimeout: -1 });
  provider.pollingInterval = 20;
  [client, freelancer, stranger] = await Promise.all(
    [0, 1, 2].map((index) => provider.getSigner(index)),
  );
});

after(async () => {
  provider?.destroy();
  await chain?.disconnect();
});

async function deploy(overrides = {}) {
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, client);
  const contract = await factory.deploy(
    overrides.title ?? "Design a logo",
    overrides.freelancer ?? (await freelancer.getAddress()),
    { value: overrides.value ?? deposit },
  );
  await contract.waitForDeployment();
  return contract;
}

async function balance(address) {
  return BigInt(await provider.send("eth_getBalance", [address, "latest"]));
}

async function rejectsTransaction(operation) {
  await assert.rejects(async () => {
    const result = await operation();
    if (result?.wait) await result.wait();
  });
}

test("funded job pays the freelancer exactly once after their submission and client approval", async () => {
  const escrow = await deploy();
  const address = await escrow.getAddress();
  assert.equal(await escrow.client(), await client.getAddress());
  assert.equal(await escrow.freelancer(), await freelancer.getAddress());
  assert.equal(await escrow.amount(), deposit);
  assert.equal(await balance(address), deposit);
  assert.equal(await escrow.status(), 0n);
  await rejectsTransaction(() => escrow.releasePayment());
  await rejectsTransaction(() => escrow.markComplete());
  await rejectsTransaction(() => escrow.connect(stranger).markComplete());
  await (await escrow.connect(freelancer).markComplete()).wait();
  assert.equal(await escrow.status(), 1n);
  await rejectsTransaction(() => escrow.connect(freelancer).markComplete());
  await rejectsTransaction(() => escrow.connect(freelancer).releasePayment());
  await rejectsTransaction(() => escrow.connect(stranger).releasePayment());
  const before = await balance(await freelancer.getAddress());
  await (await escrow.releasePayment()).wait();
  assert.equal(await escrow.status(), 2n);
  assert.equal(await balance(address), 0n);
  assert.equal(await balance(await freelancer.getAddress()), before + deposit);
  await rejectsTransaction(() => escrow.releasePayment());
});

test("deployment rejects empty deposits, invalid freelancers and invalid titles", async () => {
  await assert.rejects(deploy({ value: 0n }));
  await assert.rejects(
    deploy({ freelancer: "0x0000000000000000000000000000000000000000" }),
  );
  await assert.rejects(deploy({ freelancer: await client.getAddress() }));
  await assert.rejects(deploy({ title: "" }));
  await assert.rejects(deploy({ title: "a".repeat(161) }));
});

test("a rejected ETH transfer preserves the submitted job and its deposit", async () => {
  const source = `pragma solidity 0.8.30;
    interface Escrow { function markComplete() external; }
    contract RejectingFreelancer {
      function submit(address escrow) external { Escrow(escrow).markComplete(); }
      receive() external payable { revert("Reject payment"); }
    }`;
  const result = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: { "Freelancer.sol": { content: source } },
        settings: {
          evmVersion: "paris",
          outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
      }),
    ),
  );
  const compiled = result.contracts["Freelancer.sol"].RejectingFreelancer;
  const receiver = await new ContractFactory(
    compiled.abi,
    `0x${compiled.evm.bytecode.object}`,
    client,
  ).deploy();
  await receiver.waitForDeployment();
  const escrow = await deploy({ freelancer: await receiver.getAddress() });
  await (await receiver.submit(await escrow.getAddress())).wait();
  await rejectsTransaction(() => escrow.releasePayment());
  assert.equal(await escrow.status(), 1n);
  assert.equal(await balance(await escrow.getAddress()), deposit);
});

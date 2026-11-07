import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { build } from "esbuild";

const result = await build({ entryPoints: ["convex/lib/userRecovery.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external" });
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: createRequire(import.meta.url) });
const { recoverDeletedFreelancer } = module.exports;
const walletAddress = "0x" + "1".repeat(40);
function fixture() {
  const args = { walletAddress, previousUserId: "old-user", authAccountId: "login", jobIds: ["job1", "job2"], name: "Freelancer" };
  const rows = {
    users: [],
    authAccounts: [{ _id: "login", provider: "wallet", providerAccountId: walletAddress, userId: "old-user" }],
    jobs: ["job1", "job2"].map(_id => ({ _id, clientId: "client", freelancerId: "old-user", freelancerAddress: walletAddress, clientAddress: "0x" + "2".repeat(40), status: "Funded", contractAddress: "escrow", amountWei: "5000000" })),
  };
  const writes = [];
  const ctx = { db: {
    get: async id => Object.values(rows).flat().find(row => row._id === id) ?? null,
    query(table) { return { withIndex(_index, select) { let field, value; select({ eq(k, v) { field = k; value = v; return this; } }); const found = rows[table].filter(row => row[field] === value); return { unique: async () => found[0] ?? null, collect: async () => found }; } }; },
    insert: async (table, value) => { rows[table].push({ _id: "restored-user", ...value }); writes.push({ table, value }); return "restored-user"; },
    patch: async (id, value) => { const row = Object.values(rows).flat().find(row => row._id === id); Object.assign(row, value); writes.push({ id, value }); },
  } };
  return { args, rows, writes, ctx };
}
test("Recovery defaults to a read-only plan", async () => {
  const f = fixture();
  assert.equal((await recoverDeletedFreelancer(f.ctx, f.args)).applied, false);
  assert.equal(f.writes.length, 0);
});
test("Recovery reconnects only the audited login and jobs, preserving escrow terms", async () => {
  const f = fixture();
  const before = structuredClone(f.rows.jobs);
  const result = await recoverDeletedFreelancer(f.ctx, { ...f.args, apply: true });
  assert.equal(result.userId, "restored-user");
  assert.equal(f.rows.authAccounts[0].userId, "restored-user");
  assert.equal(f.writes.length, 4);
  for (let i = 0; i < before.length; i++) assert.deepEqual(f.rows.jobs[i], { ...before[i], freelancerId: "restored-user" });
});
test("Changed wallet, login, or job evidence stops before any write", async () => {
  for (const tamper of [f => f.rows.authAccounts[0].providerAccountId = "0x" + "3".repeat(40), f => f.rows.jobs[0].freelancerAddress = "0x" + "3".repeat(40), f => f.args.jobIds.pop()]) {
    const f = fixture(); tamper(f);
    await assert.rejects(() => recoverDeletedFreelancer(f.ctx, { ...f.args, apply: true }));
    assert.equal(f.writes.length, 0);
  }
});
test("An existing profile or conflicting client role cannot be overwritten", async () => {
  for (const tamper of [f => f.rows.users.push({ _id: "new-user", walletAddress }), f => f.rows.jobs[0].clientId = "old-user"]) {
    const f = fixture(); tamper(f);
    await assert.rejects(() => recoverDeletedFreelancer(f.ctx, { ...f.args, apply: true }));
    assert.equal(f.writes.length, 0);
  }
});

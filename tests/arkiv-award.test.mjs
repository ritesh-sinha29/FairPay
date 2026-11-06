import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
async function load(entry, options = {}) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, platform: "node", format: "cjs", packages: "external" });
  const module = { exports: {} };
  // Convex Auth exposes its server entry point as ESM only.
  const auth = entry === "convex/jobs.ts" ? await import("@convex-dev/auth/server") : null;
  const moduleRequire = name => name === "@convex-dev/auth/server" ? auth : require(name);
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: moduleRequire, TextEncoder, URL, AbortSignal, process: { env: { SITE_URL: "https://trusted.example" } }, console, fetch: options.fetch || fetch });
  return module.exports;
}

const entityKey = "0x" + "a".repeat(64);
const proposalKey = "0x" + "b".repeat(64);
const clientAddress = "0x" + "1".repeat(40);
const freelancerAddress = "0x" + "2".repeat(40);
const scope = "Deliver the agreed responsive portfolio and source code.";
const proof = () => ({
  clientAddress, entityKey, proposalKey, scope, currency: "arc-usdc",
  job: { key: entityKey, clientAddress, title: "Build portfolio", description: scope, status: "open", expiresAt: Date.now() + 3600000, budgetEth: "2.5" },
  proposal: { key: proposalKey, jobKey: entityKey, freelancerAddress },
});

test("Verified award preserves budget, selected currency, scope, and applicant", async () => {
  const { verifiedAwardTerms } = await load("convex/lib/arkivAward.ts");
  const terms = verifiedAwardTerms(proof());
  assert.equal(terms.amountWei, "2500000");
  assert.equal(terms.paymentAsset, "USDC");
  assert.equal(terms.chainId, 5042002);
  assert.equal(terms.description, scope);
  assert.equal(terms.freelancerAddress, freelancerAddress);
  assert.equal(verifiedAwardTerms({ ...proof(), currency: "sepolia-eth" }).amountWei, "2500000000000000000");
  const small = proof(); small.job.budgetEth = "0.0000001";
  assert.throws(() => verifiedAwardTerms(small), /precision/);
});

test("Awards reject wrong owners, unrelated proposals, expired listings, and invalid terms", async () => {
  const { verifiedAwardTerms } = await load("convex/lib/arkivAward.ts");
  assert.throws(() => verifiedAwardTerms({ ...proof(), clientAddress: freelancerAddress }), /Only the client/);
  const unrelated = proof(); unrelated.proposal.jobKey = proposalKey;
  assert.throws(() => verifiedAwardTerms(unrelated), /does not belong/);
  const expired = proof(); expired.job.expiresAt = Date.now() - 1;
  assert.throws(() => verifiedAwardTerms(expired), /no longer open/);
  const awarded = proof(); awarded.job.status = "awarded";
  assert.throws(() => verifiedAwardTerms(awarded), /no longer open/);
  assert.throws(() => verifiedAwardTerms({ ...proof(), scope: "Too short" }), /Describe/);
});

// Execute the real registered Convex handlers against an isolated database.
// Convex itself provides transaction isolation; these checks cover the business
// rules that must remain valid for retries and both participant workspaces.
function database() {
  const rows = new Map([
    ["client", { _id: "client", name: "Client", role: "client", walletAddress: clientAddress }],
    ["freelancer", { _id: "freelancer", name: "Applicant", role: "freelancer", walletAddress: freelancerAddress }],
    ["other", { _id: "other", name: "Other", role: "freelancer", walletAddress: "0x" + "3".repeat(40) }],
  ]);
  let sequence = 0;
  const db = {
    get: async id => rows.get(id) || null,
    query: table => ({
      withIndex(_index, predicate) {
        const conditions = [];
        const query = { eq(key, value) { conditions.push([key, value]); return query; } };
        predicate(query);
        const matches = () => [...rows.values()].filter(row => (table === "jobs" ? row._id.startsWith("job-") : !row._id.startsWith("job-")) && conditions.every(([key, value]) => row[key] === value));
        return { unique: async () => matches()[0] || null, order: () => ({ collect: async () => matches() }) };
      },
    }),
    insert: async (_table, value) => { const id = `job-${++sequence}`; rows.set(id, { _id: id, ...value }); return id; },
    patch: async (id, value) => { rows.set(id, { ...rows.get(id), ...value }); },
  };
  return { rows, context: id => ({ db, auth: { getUserIdentity: async () => id ? { subject: `${id}|session` } : null } }) };
}

test("Award creates one shared Draft deal; retries reuse it and another selection is rejected", async () => {
  const jobs = await load("convex/jobs.ts");
  const { verifiedAwardTerms } = await load("convex/lib/arkivAward.ts");
  const store = database();
  const args = { entityKey, proposalKey, ...verifiedAwardTerms(proof()) };
  const id = await jobs.createFromArkiv._handler(store.context("client"), args);
  assert.equal(await jobs.createFromArkiv._handler(store.context("client"), args), id);
  await assert.rejects(() => jobs.createFromArkiv._handler(store.context("client"), { ...args, proposalKey: entityKey }), /different proposal/);
  assert.equal([...store.rows.keys()].filter(key => key.startsWith("job-")).length, 1);
  const job = store.rows.get(id);
  assert.equal(job.clientId, "client");
  assert.equal(job.freelancerId, "freelancer");
  assert.equal(job.status, "Draft");
  assert.equal(job.acceptedAt, undefined);
  for (const participant of ["client", "freelancer"]) {
    assert.equal((await jobs.list._handler(store.context(participant), {}))[0]._id, id);
    assert.equal((await jobs.forArkiv._handler(store.context(participant), { entityKey })).jobId, id);
  }
  assert.equal(await jobs.forArkiv._handler(store.context("other"), { entityKey }), null);
  await assert.rejects(() => jobs.createFromArkiv._handler(store.context("freelancer"), args), /Only clients/);
});

test("The selected freelancer must agree before funding becomes available", async () => {
  const jobs = await load("convex/jobs.ts");
  const { verifiedAwardTerms } = await load("convex/lib/arkivAward.ts");
  const store = database();
  const jobId = await jobs.createFromArkiv._handler(store.context("client"), { entityKey, proposalKey, ...verifiedAwardTerms(proof()) });
  const funding = { jobId, token: "a-valid-reservation-token-for-this-job" };
  await assert.rejects(() => jobs.reserveFunding._handler(store.context("client"), funding), /freelancer must agree/);
  await assert.rejects(() => jobs.accept._handler(store.context("client"), { jobId }), /assigned freelancer/);
  await jobs.accept._handler(store.context("freelancer"), { jobId });
  await jobs.reserveFunding._handler(store.context("client"), funding);
  assert.equal(store.rows.get(jobId).fundingReservation, funding.token);
  assert.ok(store.rows.get(jobId).acceptedAt);
});

test("The public acceptance action reads verified records and retries without duplicating the deal", async () => {
  let reads = 0;
  const proofData = proof();
  const jobs = await load("convex/jobs.ts", { fetch: async url => {
    assert.equal(url.origin, "https://trusted.example");
    reads += 1;
    return Response.json(url.pathname.endsWith("entities") ? { entity: proofData.job } : { proposal: proofData.proposal });
  } });
  const store = database();
  const context = {
    runQuery: async (_ref, args) => jobs.arkivAwardContext._handler(store.context("client"), args),
    runMutation: async (_ref, args) => jobs.createFromArkiv._handler(store.context("client"), args),
  };
  const args = { entityKey, proposalKey, scope, currency: "arc-usdc" };
  const id = await jobs.awardArkivProposal._handler(context, args);
  assert.equal(await jobs.awardArkivProposal._handler(context, args), id);
  assert.equal(reads, 2);
  assert.equal(store.rows.get(id).amountWei, "2500000");
  const invalid = { ...context, runQuery: async (_ref, queryArgs) => jobs.arkivAwardContext._handler(store.context("freelancer"), queryArgs) };
  await assert.rejects(() => jobs.awardArkivProposal._handler(invalid, args), /Only clients/);
  assert.equal(reads, 2);
});

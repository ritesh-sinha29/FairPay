import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const profile = {
  _id: "test-user", name: "Test client", role: "client",
  walletAddress: "0x1111111111111111111111111111111111111111",
};

async function load(entry, options = {}) {
  const output = await build({
    entryPoints: [entry], bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
    plugins: [{
      name: "isolated-auth",
      setup(builder) {
        builder.onResolve({ filter: /^(server-only|@convex-dev\/auth\/nextjs\/server|convex\/nextjs)$/ }, args => ({ path: args.path, namespace: "test-only" }));
        builder.onLoad({ filter: /.*/, namespace: "test-only" }, args => ({ contents:
          args.path === "server-only" ? "" : args.path === "convex/nextjs"
            ? "export async function fetchQuery(_ref, args) { return args?.entityKeys ? globalThis.testAwardStates : globalThis.testProfile; }"
            : "export async function convexAuthNextjsToken() { return globalThis.testToken; }",
        }));
      },
    }],
  });
  const module = { exports: {} };
  const context = {
    module, exports: module.exports, require,
    process: { env: { ARKIV_ACCESS_KEY: "unit-test", ...options.env } },
    testToken: options.authenticated === false ? undefined : "unit-test-token",
    testProfile: options.profile || profile,
    testAwardStates: options.awardStates || [],
    console, URL, URLSearchParams, Request, Response, AbortSignal, setTimeout, clearTimeout,
    fetch: (...args) => globalThis.fetch(...args),
  };
  vm.runInNewContext(output.outputFiles[0].text, context);
  return module.exports;
}

const timing = { currentBlock: 1000n, currentBlockTime: 1700000000, blockDuration: 2 };
const jobRow = () => ({
  $key: "0x" + "a".repeat(64), $owner: profile.walletAddress,
  $createdAt: 900n, $expiresAt: 2800n,
  $attributes: {
    title: { type: "str", value: "Regression test job" },
    category: { type: "str", value: "design" },
    status: { type: "str", value: "open" },
    budgetEth: { type: "dec", value: "5" },
    clientAddress: { type: "addr", value: profile.walletAddress },
    milestonesCount: { type: "u64", value: 2n },
    createdAt: { type: "u64", value: 1700000000n },
  },
});

test("Arkiv system block heights become timestamps; expired open jobs are excluded", async () => {
  const { jobFromArkiv } = await load("src/lib/arkiv-server.ts");
  const job = jobFromArkiv(jobRow(), timing);
  assert.equal(job.expiresAt, 1700003600000);
  assert.equal(job.remainingHours, 1);
  assert.equal(job.createdAt, 1700000000000);
  assert.equal(job.txHash, undefined);
  assert.equal(jobFromArkiv({ ...jobRow(), $expiresAt: 999n }, timing), null);
  assert.equal(jobFromArkiv({ ...jobRow(), $attributes: {} }, timing), null);
});

test("All statuses does not silently query only open jobs", async () => {
  const { buildArkivQuery } = await load("src/lib/arkiv.ts");
  assert.match(buildArkivQuery(), /status = str\('open'\)/);
  assert.doesNotMatch(buildArkivQuery({ status: "all" }), /status =/);
  assert.match(buildArkivQuery({ category: "design", minBudget: 3 }), /category = str\('design'\)/);
});

test("A missing server signer cannot generate an entity or transaction hash", async () => {
  const { arkivWriter } = await load("src/lib/arkiv-server.ts");
  assert.throws(arkivWriter, /publishing is not configured/);
  const route = await load("src/app/api/arkiv/create/route.ts");
  const response = await route.POST(new Request("http://localhost/api/arkiv/create", {
    method: "POST", body: JSON.stringify({ title: "Regression test", category: "design", budgetEth: "5", milestonesCount: 2, days: 7 }),
  }));
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.equal(data.entity, undefined);
  assert.equal(data.success, undefined);
});

test("Unauthenticated publishing is rejected before any chain write", async () => {
  for (const path of ["create", "proposals"]) {
    const route = await load(`src/app/api/arkiv/${path}/route.ts`, { authenticated: false });
    const response = await route.POST(new Request(`http://localhost/api/arkiv/${path}`, { method: "POST", body: "{}" }));
    assert.equal(response.status, 403);
  }
});

test("An empty chain remains empty, and RPC failure returns 503 without fallback data", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, init) => {
      const { id, method } = JSON.parse(init.body);
      const result = method === "arkiv_getBlockTiming"
        ? { current_block: "0x3e8", current_block_time: 1700000000, duration: 2 }
        : { data: [], blockNumber: "0x3e8" };
      return Response.json({ jsonrpc: "2.0", id, result });
    };
    const route = await load("src/app/api/arkiv/entities/route.ts");
    assert.equal(route.POST, undefined);
    const response = await route.GET(new Request("http://localhost/api/arkiv/entities"));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).entities.length, 0);
    globalThis.fetch = async () => new Response("Rate limited", { status: 429 });
    const failed = await route.GET(new Request("http://localhost/api/arkiv/entities"));
    assert.equal(failed.status, 503);
    assert.equal((await failed.json()).entities, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const bundle = await build({ entryPoints: ["src/components/client-delivery-review.tsx"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external" });
const module = { exports: {} };
vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require });
const { ClientDeliveryReview } = module.exports;

function render(status, walletState = "ready", busy = false) {
  return renderToStaticMarkup(createElement(ClientDeliveryReview, {
    job: { status, freelancerName: "Assigned freelancer", amount: "2" },
    walletState, networkName: "Arc Testnet", paymentSymbol: "USDC", busy,
    onVerify() {}, onRefresh() {},
  }));
}
function verificationButton(html) {
  return html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)?.find(button => button.includes("Verify work &amp; release payment"));
}

test("A funded job shows a disabled verification button and explains the freelancer's missing transaction", () => {
  const html = render("Funded");
  assert.ok(verificationButton(html));
  assert.match(verificationButton(html), / disabled=""/);
  assert.match(html, /Submission not confirmed yet/);
  assert.match(html, /Submit work for review/);
  assert.match(html, /confirm the transaction on Arc Testnet/);
  assert.match(html, /Check submission status/);
});

test("Client verification enables only after submission and with the correct wallet and network", () => {
  const submitted = render("Submitted");
  assert.doesNotMatch(verificationButton(submitted), / disabled=""/);
  assert.match(submitted, /Verifying releases 2 USDC/);
  assert.match(submitted, /Submission confirmed/);
  for (const state of ["disconnected", "wrong-wallet", "wrong-network"]) {
    assert.match(verificationButton(render("Submitted", state)), / disabled=""/);
  }
  assert.match(verificationButton(render("Submitted", "ready", true)), / disabled=""/);
});

test("Draft and paid jobs do not offer a verification or second release action", () => {
  assert.equal(render("Draft"), "");
  assert.equal(render("Paid"), "");
});

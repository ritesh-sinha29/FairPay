import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, Lock, FileText } from "lucide-react";
import { Navbar, Footer } from "@/modules/web";

export const metadata = {
  title: "Protocol Terms | FairPay",
  description: "Non-custodial protocol terms, smart contract escrow agreement, and decentralized settlement policies.",
};

export default function TermsPage() {
  return (
    <div className="bg-black text-white min-h-screen font-sans flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-36 sm:pt-44 pb-20">
        {/* Breadcrumb */}
        <Link
          href="/web"
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>

        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-xs text-neutral-300 mb-4">
            <Scale className="w-3.5 h-3.5 text-white" />
            <span>Non-Custodial Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Protocol Terms & Agreement
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
            Last updated: November 2026. FairPay is a decentralized, non-custodial milestone escrow protocol running autonomously on Arc Testnet and Arkiv DB-Chain.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-neutral-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-neutral-400" />
              1. Non-Custodial Architecture & Zero Holding
            </h2>
            <p>
              FairPay is an open-source decentralized software interface connecting users to self-executing smart contracts on the Arc Testnet. At no point does FairPay, its contributors, or any affiliate hold custody, possess private keys, or control collateral funds deposited into protocol contracts.
            </p>
            <p className="text-neutral-400 text-xs font-mono bg-neutral-900/60 p-3.5 rounded-lg border border-white/[0.06]">
              All deposits consist of native Circle USDC routed directly from client wallets into deterministic contract addresses. We maintain no banking licenses, financial custody, or centralized balances.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-neutral-400" />
              2. Milestone Escrow & Execution Rules
            </h2>
            <p>
              When a client funds a milestone, 100% of the collateral USDC is locked in contract state. Neither party can unilaterally withdraw or alter milestone values while work is in review:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
              <li>Deliverable Submission: Builders submit work proofs or execution links recorded on-chain.</li>
              <li>Milestone Release: Client approval triggers an immediate, irreversible transfer from the contract directly to the builder&apos;s wallet address.</li>
              <li>Gas Fees: Transactions incur standard Arc network gas paid by the executing wallet. FairPay charges 0% platform commission on settled funds.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-neutral-400" />
              3. Arkiv DB-Chain TTL & Proposal Pruning
            </h2>
            <p>
              Requests for Proposals (RFPs) submitted to FairPay are published to Arkiv&apos;s decentralized database chain with a defined Time-To-Live (TTL) block lease. Upon lease expiration, the protocol autonomously prunes the posting. FairPay provides no guarantee of perpetual storage for uncontracted or expired RFPs.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-neutral-400" />
              4. Cryptographic Proofs & Blockchain Transparency
            </h2>
            <p>
              All interactions are permanently and publicly indexed on the Arc Testnet and verifiable via Blockscout Explorer. By using the protocol, you acknowledge that blockchain transactions are immutable, irreversible, and publicly inspectable by any third party.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}


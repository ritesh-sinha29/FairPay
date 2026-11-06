import React from "react";
import Link from "next/link";
import { ArrowLeft, EyeOff, Shield, Database, Lock } from "lucide-react";
import { Navbar, Footer } from "@/modules/web";

export const metadata = {
  title: "Privacy Notice | FairPay",
  description: "Decentralized privacy policies, on-chain ledger transparency, and self-custodial data ethics on FairPay.",
};

export default function PrivacyPage() {
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
            <EyeOff className="w-3.5 h-3.5 text-white" />
            <span>Decentralized Privacy Notice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
            FairPay is built on self-custody principles. We do not sell your personal data, track off-chain financial profiles, or hold banking credentials.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-neutral-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-neutral-400" />
              1. Zero PII Collection & Custody
            </h2>
            <p>
              Unlike legacy freelance marketplaces that collect passports, government IDs, bank details, and social security numbers, FairPay requires only your EVM Web3 wallet connection. We do not maintain centralized user databases of sensitive personal identifiable information.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-neutral-400" />
              2. On-Chain Ledger Transparency
            </h2>
            <p>
              When you deposit funds, release milestones, or deploy an escrow contract, transactions are submitted directly to the Arc Testnet. This public blockchain ledger records:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
              <li>Your public wallet address (e.g., 0x...).</li>
              <li>Transaction execution timestamps, block numbers, and gas paid.</li>
              <li>Smart contract milestone state and disbursement receipts indexed on Blockscout Explorer.</li>
            </ul>
            <p className="text-neutral-500 text-xs">
              Because public blockchain ledgers are immutable, on-chain transaction records cannot be modified or deleted.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
              <Database className="w-4 h-4 text-neutral-400" />
              3. Ephemeral Arkiv DB-Chain Records
            </h2>
            <p>
              RFP postings and bid proposals submitted through the Arkiv network carry deterministic Time-To-Live (TTL) expiration leases. Upon expiration, uncontracted RFP metadata is automatically pruned from the state layer to prevent data bloat and dead ghost listings.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}


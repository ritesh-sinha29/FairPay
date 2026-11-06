"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const defaultFaqs: FAQItem[] = [
  {
    id: "escrow-mechanics",
    question: "How does non-custodial milestone escrow work on FairPay?",
    answer:
      "Clients deposit Circle USDC directly into deterministic on-chain smart contracts on Arc Testnet before work commences. Neither FairPay nor any central party holds custody of your funds. Once the builder submits deliverables and the client reviews and approves the milestone, funds release directly to the contractor wallet in a single gas-efficient transaction.",
  },
  {
    id: "arkiv-ttl",
    question: "What is Arkiv DB-Chain and how does native protocol TTL eliminate ghost jobs?",
    answer:
      "Arkiv is a decentralized database chain. Every Request for Proposal (RFP) posted to FairPay is assigned an on-chain Time-To-Live (TTL) lease (e.g. 24 hours to 7 days). If an RFP is unfulfilled or the lease expires, protocol-level state pruning automatically deletes the listing, ensuring every opportunity on the board has an active budget and verified sponsor.",
  },
  {
    id: "platform-fees",
    question: "What are the platform fees on FairPay?",
    answer:
      "FairPay charges 0% platform extraction on milestone payouts. Unlike legacy freelance platforms that take 10% to 20% of your earnings, FairPay charges zero platform cuts. Both parties pay only standard Arc network execution gas (fractions of a cent), keeping 100% of the funds with the builders.",
  },
  {
    id: "audit-explorer",
    question: "How are milestone submissions and payouts audited?",
    answer:
      "Every contract deployment, collateral deposit, milestone submission, and payout disbursement produces an immutable execution receipt indexed on Blockscout Explorer. Both clients and contractors can independently verify cryptographic transaction proofs, block numbers, and contract state anytime.",
  },
  {
    id: "dispute-resolution",
    question: "How are milestone disputes handled?",
    answer:
      "Milestones are strictly segmented into granular deliverables agreed upon before work begins. Funds remain locked trustlessly inside the contract and cannot be unilaterally withdrawn by either party while a milestone is under review, protecting contractors from non-payment and clients from unverified deliverables.",
  },
  {
    id: "supported-wallets",
    question: "Which networks and wallets are supported?",
    answer:
      "FairPay supports all standard EVM Web3 wallets (including MetaMask, Rabby, Coinbase Wallet, and WalletConnect). All settlement contracts execute on the Arc Testnet using native Circle USDC for stable, non-volatile settlement.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="relative w-full bg-black pt-6 sm:pt-10 pb-20 sm:pb-28 px-6 md:px-12 font-sans overflow-hidden scroll-mt-24"
    >
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-1 text-xs text-neutral-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            Security & Protocol FAQ
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight mb-3"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-neutral-400 max-w-lg mx-auto leading-relaxed"
          >
            Everything you need to know about milestone escrow, 0% platform cuts, and Arkiv DB-Chain.
          </motion.p>
        </div>

        {/* Refined WeKraft-Style Accordion List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3"
        >
          {defaultFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                  isOpen
                    ? "border-white/20 bg-neutral-900/40 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                    : "border-white/[0.07] bg-neutral-950/40 hover:border-white/15"
                }`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="w-full flex items-center justify-between px-5 py-4 text-left select-none">
                  <span
                    className={`text-sm md:text-[15px] font-medium pr-4 transition-colors ${
                      isOpen ? "text-white" : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal border-t border-white/[0.04] mt-1 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default FAQ;

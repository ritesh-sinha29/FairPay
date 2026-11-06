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
    question: "How does FairPay protect contractors from client ghosting and non-payment?",
    answer:
      "Over 71% of freelancers have experienced delayed payment or complete client ghosting. On FairPay, clients must deposit 100% of the agreed milestone funds in native Circle USDC into an Arc Testnet smart contract before any code is committed. Once locked in contract escrow, the client cannot unilaterally retract or charge back funds. When you submit deliverables and the client approves, funds release instantly to your wallet.",
  },
  {
    id: "platform-fees",
    question: "Why does FairPay charge 0% platform fees? What is the catch?",
    answer:
      "There is no catch. Legacy freelance marketplaces (Upwork, Fiverr) operate massive centralized overhead and extract 10% to 20% from every paycheck, plus 3-5% payment processing fees and paid 'Connects' to pitch. FairPay is a decentralized Web3 protocol: smart contracts handle escrow on Arc Testnet, and Arkiv DB-Chain handles RFP storage. Because there are no middlemen, 100% of the funds go straight to the builder. Users pay only standard network gas (< $0.0002).",
  },
  {
    id: "arkiv-ttl",
    question: "How does Arkiv DB-Chain eliminate fake and 'Ghost Jobs'?",
    answer:
      "On traditional job boards, over 38% of postings are dead listings where clients interview nobody and let posts expire, burning paid Connects without a refund. On FairPay, every RFP is published to Arkiv's decentralized database chain with a native block-lease Time-To-Live (TTL). When the timer expires without an active contract, the listing automatically prunes from the network. Every opportunity you see on FairPay is backed by an active, verifiable budget.",
  },
  {
    id: "payout-speed",
    question: "How fast do payouts settle compared to traditional platforms?",
    answer:
      "Immediately (< 2 seconds). Upwork and freelance escrow companies enforce a 5 to 10-day 'security review' hold before clearing funds, followed by 2 to 3 days of bank processing. With FairPay, once a milestone is approved by the client, funds release directly into your self-custody EVM wallet in a single gas-efficient transaction. Zero holds, zero bank delays.",
  },
  {
    id: "custody-risk",
    question: "Can FairPay freeze my account, seize funds, or block withdrawals?",
    answer:
      "No. FairPay is strictly non-custodial. We never hold your private keys, deposit funds into a centralized bank, or act as a custodial custodian. All escrow logic is enforced autonomously by immutable smart contracts on Arc Testnet. You connect directly with your self-custodial wallet (MetaMask, Rabby, Coinbase), ensuring you maintain 100% ownership of your money at all times.",
  },
  {
    id: "audit-explorer",
    question: "How are milestone deliverables and contract proofs audited?",
    answer:
      "Every contract creation, deposit, deliverable submission, and payout disbursement produces an immutable cryptographic execution receipt indexed on Blockscout Explorer. Both clients and contractors can verify transaction hashes, timestamps, and contract balances on-chain with zero reliance on subjective customer support agents.",
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

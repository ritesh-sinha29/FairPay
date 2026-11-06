"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, ExternalLink, Database } from "lucide-react";

export interface FeatureBlock {
  tag: string;
  title: string;
  description: string;
  image?: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  link?: string;
  linkText?: string;
  mockType: "escrow" | "arkiv" | "settlement" | "audit";
}

const features: FeatureBlock[] = [
  {
    tag: "Milestone Escrow",
    title: "Lock funds upfront before work begins.",
    description:
      "Deposit Circle USDC directly into deterministic on-chain smart contracts on Arc Testnet. Funds are secured trustlessly before any code is committed — eliminating client ghosting and contractor non-payment.",
    image: "", // Place your screenshot path here (e.g. "/features/escrow.png")
    imageAlt: "FairPay milestone escrow smart contract management",
    imagePosition: "right",
    link: "/jobs/new",
    linkText: "Create an escrow",
    mockType: "escrow",
  },
  {
    tag: "Arkiv DB-Chain",
    title: "Eliminate ghost jobs with protocol TTL.",
    description:
      "Every Request for Proposal (RFP) is published to Arkiv's decentralized database chain with a native block-lease timer. Open bids auto-prune upon expiration, guaranteeing active budgets and zero dead listings.",
    image: "", // Place your screenshot path here (e.g. "/features/arkiv.png")
    imageAlt: "Arkiv decentralized database RFP board with TTL",
    imagePosition: "left",
    link: "/arkiv",
    linkText: "Explore Arkiv board",
    mockType: "arkiv",
  },
  {
    tag: "Instant Settlement",
    title: "One-click release. Zero platform fee.",
    description:
      "Review deliverables, verify milestone completion, and release funds instantly in a single transaction. Funds transfer directly from smart contract to contractor wallet with 0% platform extraction.",
    image: "", // Place your screenshot path here (e.g. "/features/settlement.png")
    imageAlt: "One-click milestone release and instant payout",
    imagePosition: "right",
    link: "/jobs",
    linkText: "View settlement flow",
    mockType: "settlement",
  },
  {
    tag: "Audit Trail",
    title: "Verifiable escrow proofs on Blockscout.",
    description:
      "Every milestone deposit, work submission, and disbursement is immutably indexed with verifiable execution receipts. Direct Blockscout Explorer links provide transparent proof for every party.",
    image: "", // Place your screenshot path here (e.g. "/features/audit.png")
    imageAlt: "Blockscout cryptographic audit trail and explorer verification",
    imagePosition: "left",
    link: "https://testnet.arcscan.io",
    linkText: "Inspect verified contracts",
    mockType: "audit",
  },
];

/* ─── Mock Preview Components (Rendered when no screenshot image is provided) ─── */

function MockPreview({ type }: { type: FeatureBlock["mockType"] }) {
  if (type === "escrow") {
    return (
      <div className="w-full bg-[#0c0d10] p-5 sm:p-7 text-left font-sans select-none">
        {/* Window Bar */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <span className="text-[11px] text-neutral-500 font-mono ml-2">contract: 0x48b2...a19f</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> Arc Testnet
          </span>
        </div>

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Active Job Escrow</div>
            <h4 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Smart Contract Audit & Frontend
            </h4>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-neutral-900/90 text-right">
            <div className="text-[10px] text-neutral-400 font-mono">Locked Escrow</div>
            <div className="text-sm sm:text-base font-semibold text-white font-mono">4,500 USDC</div>
          </div>
        </div>

        {/* Milestone Steps */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.08] bg-neutral-900/40">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <div>
                <div className="text-xs font-medium text-white">Milestone 1: Security Specification</div>
                <div className="text-[10px] text-neutral-500">Approved & Settled</div>
              </div>
            </div>
            <span className="text-xs font-mono font-medium text-white">1,500 USDC</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-neutral-900/80">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-neutral-300" />
              <div>
                <div className="text-xs font-medium text-white">Milestone 2: Test Suite & Fuzzing</div>
                <div className="text-[10px] text-neutral-400">PR Submitted • Pending Approval</div>
              </div>
            </div>
            <span className="text-xs font-mono font-medium text-white">1,500 USDC</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-neutral-900/20 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border border-neutral-600 flex items-center justify-center text-[9px] text-neutral-500">3</div>
              <div>
                <div className="text-xs font-medium text-neutral-300">Milestone 3: Mainnet Remediation</div>
                <div className="text-[10px] text-neutral-500">Locked in contract</div>
              </div>
            </div>
            <span className="text-xs font-mono font-medium text-neutral-400">1,500 USDC</span>
          </div>
        </div>

        {/* Placeholder helper indicator */}
        <div className="pt-3 border-t border-dashed border-white/10 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Structure placeholder</span>
          <span>Ready for screenshot image</span>
        </div>
      </div>
    );
  }

  if (type === "arkiv") {
    return (
      <div className="w-full bg-[#0c0d10] p-5 sm:p-7 text-left font-sans select-none">
        {/* Window Bar */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <span className="text-[11px] text-neutral-500 font-mono ml-2">arkiv-db: lease_id_902</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-neutral-300">
            <Database className="w-3 h-3 text-white" /> TTL Active
          </span>
        </div>

        {/* RFP Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-neutral-400">RFP Posting • Arkiv Chain</span>
            <span className="text-[11px] font-mono text-neutral-300">Lease: 48h 00m</span>
          </div>
          <h4 className="text-base sm:text-lg font-semibold text-white tracking-tight">
            Build Arkiv Contract Indexer & Graph
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic TTL pruning eliminates dead listings. Zero stale jobs.
          </p>
        </div>

        {/* TTL Bar */}
        <div className="p-3.5 rounded-lg border border-white/10 bg-neutral-900/60 mb-5">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-neutral-400 font-mono text-[11px]">TTL Lease Countdown</span>
            <span className="text-white font-mono text-[11px] font-medium">32h 45m Remaining</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full w-2/3" />
          </div>
        </div>

        {/* Bids List */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs p-2.5 rounded border border-white/[0.06] bg-neutral-950/60">
            <span className="text-white font-medium">Proposal #1 • 0x3d...f81c</span>
            <span className="text-neutral-300 font-mono">2,200 USDC</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2.5 rounded border border-white/[0.06] bg-neutral-950/60">
            <span className="text-white font-medium">Proposal #2 • 0x9a...2b44</span>
            <span className="text-neutral-300 font-mono">2,000 USDC</span>
          </div>
        </div>

        {/* Placeholder helper indicator */}
        <div className="pt-3 border-t border-dashed border-white/10 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Structure placeholder</span>
          <span>Ready for screenshot image</span>
        </div>
      </div>
    );
  }

  if (type === "settlement") {
    return (
      <div className="w-full bg-[#0c0d10] p-5 sm:p-7 text-left font-sans select-none">
        {/* Window Bar */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <span className="text-[11px] text-neutral-500 font-mono ml-2">settlement: instant_release</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-neutral-300">
            0% Cut
          </span>
        </div>

        <div className="mb-5">
          <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Receipt Breakdown</div>
          <h4 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
            Single-Transaction Escrow Payout
          </h4>
        </div>

        {/* Calculation Table */}
        <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4 space-y-3 mb-5 font-mono text-xs">
          <div className="flex justify-between text-neutral-300">
            <span>Escrow Approved:</span>
            <span className="text-white font-semibold">2,500.00 USDC</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Platform Commission:</span>
            <span className="text-white font-semibold">$0.00 (0%)</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Arc Network Gas:</span>
            <span className="text-neutral-300">$0.00018</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between text-white font-semibold text-sm">
            <span>Contractor Net Payout:</span>
            <span>2,500.00 USDC</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-white/[0.08] bg-neutral-950/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-neutral-200">Execution Speed: 1.2s</span>
          </div>
          <span className="font-mono text-neutral-400 text-[11px]">Confirmed</span>
        </div>

        {/* Placeholder helper indicator */}
        <div className="mt-5 pt-3 border-t border-dashed border-white/10 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Structure placeholder</span>
          <span>Ready for screenshot image</span>
        </div>
      </div>
    );
  }

  // audit
  return (
    <div className="w-full bg-[#0c0d10] p-5 sm:p-7 text-left font-sans select-none">
      {/* Window Bar */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
          <span className="text-[11px] text-neutral-500 font-mono ml-2">explorer.testnet.arc.network</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-neutral-300">
          <ShieldCheck className="w-3 h-3 text-white" /> Verified
        </span>
      </div>

      <div className="mb-5">
        <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Immutable Audit Record</div>
        <h4 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
          Blockscout Verified Contract Call
        </h4>
      </div>

      <div className="space-y-2.5 mb-5 font-mono text-xs">
        <div className="p-2.5 rounded border border-white/[0.08] bg-neutral-950/70 flex justify-between items-center">
          <span className="text-neutral-400">Method</span>
          <span className="text-white font-medium">releaseMilestone(uint256,address)</span>
        </div>
        <div className="p-2.5 rounded border border-white/[0.08] bg-neutral-950/70 flex justify-between items-center">
          <span className="text-neutral-400">Transaction Hash</span>
          <span className="text-neutral-200">0x9f4a...28d1</span>
        </div>
        <div className="p-2.5 rounded border border-white/[0.08] bg-neutral-950/70 flex justify-between items-center">
          <span className="text-neutral-400">Block Number</span>
          <span className="text-neutral-200">#3,904,118</span>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-neutral-900/60 text-xs">
        <span className="text-neutral-300">Verification Hash</span>
        <span className="text-white font-mono flex items-center gap-1">
          Cryptographically Validated
          <ExternalLink className="w-3 h-3 text-neutral-400" />
        </span>
      </div>

      {/* Placeholder helper indicator */}
      <div className="mt-5 pt-3 border-t border-dashed border-white/10 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <span>Structure placeholder</span>
        <span>Ready for screenshot image</span>
      </div>
    </div>
  );
}

/* ─── Feature Row Component with Exact WeKraft Appear Animation ─── */

function FeatureRow({
  feature,
  index,
}: {
  feature: FeatureBlock;
  index: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-80px 0px" });

  const isImageRight = feature.imagePosition === "right";

  return (
    <div
      ref={rowRef}
      className={`grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center py-20 ${
        index !== features.length - 1 ? "border-b border-white/[0.06]" : ""
      }`}
    >
      {/* Text Block — Exact WeKraft entrance: y: 50 -> 0, duration: 0.9, cubic-bezier, delay: 0.1 */}
      <motion.div
        className={`flex flex-col gap-5 lg:col-span-2 ${
          isImageRight ? "lg:order-1" : "lg:order-2"
        }`}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{
          duration: 0.9,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.1,
        }}
      >
        {/* Tag pill */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-neutral-900/60 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span className="text-[13px] font-medium text-white tracking-wide">
              {feature.tag}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-white tracking-tight leading-[1.2]">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-md">
          {feature.description}
        </p>

        {/* CTA Link */}
        {feature.link && (
          <div className="mt-2">
            <Link
              href={feature.link}
              className="inline-flex items-center gap-2 text-neutral-300 text-sm font-medium group/link hover:text-white transition-colors duration-200"
            >
              <span>{feature.linkText || "Learn more"}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" />
            </Link>
          </div>
        )}
      </motion.div>

      {/* Image / Mock Preview Container — Exact WeKraft horizontal glide: x: ±120 -> 0, duration: 1.0, delay: 0.3 */}
      <motion.div
        className={`relative lg:col-span-3 ${
          isImageRight ? "lg:order-2" : "lg:order-1"
        }`}
        initial={{
          opacity: 0,
          x: isImageRight ? 120 : -120,
        }}
        animate={
          isInView
            ? { opacity: 1, x: 0 }
            : { opacity: 0, x: isImageRight ? 120 : -120 }
        }
        transition={{
          duration: 1,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.3,
        }}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -inset-x-4 -top-4 bottom-1/4 bg-gradient-to-b from-neutral-800/90 to-transparent rounded-t-2xl blur-2xl pointer-events-none" />

        {/* Frame with WeKraft subtle gradient bottom mask */}
        <div
          className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_8px_60px_rgba(0,0,0,0.5)] group bg-[#0c0d10]"
          style={{
            maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
          }}
        >
          {/* Subtle hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

          {feature.image ? (
            <Image
              src={feature.image}
              alt={feature.imageAlt}
              width={1200}
              height={750}
              className="w-full h-auto block"
              quality={90}
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          ) : (
            <MockPreview type={feature.mockType} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Section 2 Component ─── */

export function WhyFairPay() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(sectionRef, { once: true, margin: "-60px 0px" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("scroll") === "features") {
      const timer = setTimeout(() => {
        const element = document.getElementById("features");
        if (element) {
          window.scrollTo(0, 0);

          const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - 90;
          const startPosition = 0;
          const distance = targetPosition;
          const duration = 1200;
          let start: number | null = null;

          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);

            const easing =
              percentage < 0.5
                ? 4 * percentage * percentage * percentage
                : 1 - Math.pow(-2 * percentage + 2, 3) / 2;

            window.scrollTo(0, startPosition + distance * easing);

            if (progress < duration) {
              window.requestAnimationFrame(step);
            }
          };

          window.requestAnimationFrame(step);
        }
        window.history.replaceState(null, "", window.location.pathname);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <section id="features" className="bg-black py-20 md:py-32 px-6 md:px-12 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header (Exact WeKraft appear animation: y: 24 -> 0, duration: 0.6) */}
        <motion.div
          ref={sectionRef}
          className="text-center mb-8 md:mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="font-semibold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 leading-[1.1] max-w-4xl mx-auto">
            <h2 className="text-white">Built for speed.</h2>
            <h2 className="text-neutral-400 mt-1">Designed for simplicity.</h2>
          </div>

          <p className="text-neutral-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Everything you need to agree, fund, and settle — in one decentralized workspace that guarantees payment.
          </p>
        </motion.div>

        {/* Feature Rows */}
        {features.map((feature, index) => (
          <FeatureRow key={feature.tag} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}

export default WhyFairPay;

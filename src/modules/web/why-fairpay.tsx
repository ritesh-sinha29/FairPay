"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, ExternalLink, Database, Wallet } from "lucide-react";

export interface FeatureBlock {
  tag: string;
  title: string;
  description: string;
  image?: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  link?: string;
  linkText?: string;
  mockType: "escrow" | "arkiv" | "agreement" | "wallet";
}

const features: FeatureBlock[] = [
  {
    tag: "Settlement Layer • Arc Testnet 5042002",
    title: "Trustless USDC Escrow via FairPayStableEscrow.sol",
    description:
      "Clients lock milestone funds upfront into our smart contract on Arc Testnet (Chain ID 5042002) utilizing Circle USDC and OpenZeppelin's SafeERC20. The contract manages the complete milestone lifecycle: deposit lockup, deliverable submission, client release triggers, and automated timeout refunds. Contractors start work knowing payment is 100% secured.",
    image: "",
    imageAlt: "FairPay milestone escrow smart contract management on Arc Testnet",
    imagePosition: "right",
    link: "/jobs/new",
    linkText: "Create an escrow",
    mockType: "escrow",
  },
  {
    tag: "Ephemeral RFP Layer • Rabdi 7794095",
    title: "Auto-Expiring RFPs on Arkiv DB-Chain",
    description:
      "Integrated via @arkiv-network/sdk on Rabdi testnet (Chain ID 7794095). FairPay stores live freelance postings as on-chain entities with native protocol-level ExpirationTime TTLs (24h to 7d). When an RFP expires or is fulfilled, Arkiv's consensus layer prunes it without manual transaction overhead, dead ghost listings, or state bloat.",
    image: "",
    imageAlt: "Arkiv decentralized database RFP board with native TTL pruning",
    imagePosition: "left",
    link: "/arkiv",
    linkText: "Explore Arkiv board",
    mockType: "arkiv",
  },
  {
    tag: "Gasless Auth & Reactive State • Convex",
    title: "Cryptographic Agreement Verification via Keccak-256",
    description:
      "Off-chain coordination powered by Convex. Clients and contractors authenticate gaslessly using EIP-191 (Sign-In with Ethereum). The agreed scope and deliverables generate a canonical Keccak-256 agreement hash locked on-chain before funds lock — permanently preventing scope creep and revision disputes.",
    image: "",
    imageAlt: "Convex reactive state and cryptographic Keccak-256 agreement verification",
    imagePosition: "right",
    link: "/jobs",
    linkText: "View agreement flow",
    mockType: "agreement",
  },
  {
    tag: "Zero Custody Risk • 0% Platform Fee",
    title: "Atomic Wallet Payouts. Zero Intermediary Cut.",
    description:
      "Legacy Web2 freelance platforms extract 10% to 20% in fees while holding your money in centralized bank accounts for 5 to 10 days. FairPay charges 0% platform cuts. Approved milestone funds release atomically from the smart contract directly to your self-custody EVM wallet (MetaMask, Rabby, Coinbase).",
    image: "",
    imageAlt: "Supported EVM Web3 wallets and zero fee direct wallet settlement",
    imagePosition: "left",
    link: "/jobs",
    linkText: "Try Now",
    mockType: "wallet",
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
            <span className="text-[11px] text-neutral-400 font-mono ml-2">FairPayStableEscrow.sol (Arc 5042002)</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> SafeERC20 USDC
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

        {/* Bottom Status Row (Matching Image 4) */}
        <div className="pt-4 flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">Non-Custodial Protocol</span>
          <span className="text-white font-medium">Direct Wallet Settlement</span>
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
            <span className="text-[11px] text-neutral-400 font-mono ml-2">@arkiv-network/sdk (Rabdi 7794095)</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-neutral-300">
            <Database className="w-3 h-3 text-white" /> Consensus TTL Active
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

        {/* Bottom Status Row */}
        <div className="pt-4 flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">Arkiv Decentralized DB</span>
          <span className="text-white font-medium">Native TTL Auto-Pruning</span>
        </div>
      </div>
    );
  }

  if (type === "wallet") {
    return (
      <div className="w-full bg-[#0c0d10] p-6 sm:p-8 text-left font-sans select-none">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-xs text-neutral-300 mb-5">
          <Wallet className="w-3.5 h-3.5 text-neutral-300" />
          <span>Universal Web3 Access</span>
        </div>

        {/* Title & Subtitle */}
        <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Supported Wallets & Arc Network
        </h4>
        <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
          Connect with your preferred EVM Web3 wallet. Instant authorization, zero centralized custody.
        </p>

        {/* Spec Rows */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-neutral-900/40 text-xs sm:text-sm">
            <span className="text-neutral-400">Supported Wallets:</span>
            <span className="font-mono text-white font-medium">MetaMask, Rabby, Coinbase</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-neutral-900/40 text-xs sm:text-sm">
            <span className="text-neutral-400">Settlement Asset:</span>
            <span className="font-mono text-white font-medium">Native Circle USDC</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-neutral-900/40 text-xs sm:text-sm">
            <span className="text-neutral-400">Target Layer:</span>
            <span className="font-mono text-white font-medium">Arc Testnet (EVM)</span>
          </div>
        </div>

        {/* Button */}
        <Link
          href="/jobs"
          className="w-full py-3.5 px-6 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          <span>Try Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (type === "agreement") {
    return (
      <div className="w-full bg-[#0c0d10] p-5 sm:p-7 text-left font-sans select-none">
        {/* Window Bar */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <span className="text-[11px] text-neutral-400 font-mono ml-2">convex: reactive_state_engine</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-neutral-300">
            <ShieldCheck className="w-3 h-3 text-white" /> EIP-191 Verified
          </span>
        </div>

        {/* Header */}
        <div className="mb-5">
          <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Scope Agreement Lock</div>
          <h4 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
            Cryptographic Milestone Specification
          </h4>
        </div>

        {/* Keccak-256 Box */}
        <div className="p-3.5 rounded-lg border border-white/10 bg-neutral-900/60 mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-neutral-400 font-mono text-[11px]">Canonical Keccak-256 Hash</span>
            <span className="text-white font-mono text-[11px] font-medium">On-Chain Anchored</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-200 bg-black/60 p-2.5 rounded border border-white/[0.06] break-all select-all">
            0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
          </div>
        </div>

        {/* Dual Signatures */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs p-2.5 rounded border border-white/[0.06] bg-neutral-950/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span className="text-neutral-300">Client Signature (EIP-191):</span>
            </div>
            <span className="text-white font-mono text-[11px]">0x48b2...a19f (Verified)</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2.5 rounded border border-white/[0.06] bg-neutral-950/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span className="text-neutral-300">Builder Signature (EIP-191):</span>
            </div>
            <span className="text-white font-mono text-[11px]">0x3df8...1c22 (Verified)</span>
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="pt-4 flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">Convex Coordination Engine</span>
          <span className="text-white font-medium">Zero Scope Creep</span>
        </div>
      </div>
    );
  }
  return null;
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
      className={`grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center ${
        index === features.length - 1 ? "pt-12 lg:pt-16 pb-4 lg:pb-6" : "py-12 lg:py-16 border-b border-white/[0.06]"
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
    <section id="features" className="bg-black pt-16 md:pt-24 pb-4 md:pb-6 px-6 md:px-12 font-sans overflow-hidden">
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
            <h2 className="text-white">Three Core Layers.</h2>
            <h2 className="text-neutral-400 mt-1">Zero Intermediary Risk.</h2>
          </div>

          <p className="text-neutral-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Non-custodial Arc Testnet USDC escrow, auto-expiring Arkiv DB-Chain RFPs, and Convex reactive state — eliminating client ghosting and 20% platform extraction.
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

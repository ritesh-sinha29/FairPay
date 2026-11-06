"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Database,
  Wallet,
  BriefcaseBusiness,
  ArrowDownLeft,
  Lock,
  Search,
} from "lucide-react";
import { useConvexAuth } from "convex/react";
import { FairPayLogo } from "@/components/fairpay-logo";

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
    title: "From Deal Agreed to Paid. Every Milestone Guaranteed.",
    description:
      "Once client and freelancer agree on scope, the job progresses through 5 deterministic on-chain stages: Proposed, Agreed, Funded, In Review, and Paid. Milestone USDC locks upfront into FairPayStableEscrow.sol on Arc Testnet with 0 USDC platform fee. Zero custody risk, zero client ghosting.",
    image: "/images/job-agreement-escrow.jpg",
    imageAlt: "FairPay live job agreement escrow dashboard with 5-stage progress and verified smart contract settlement",
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

/* ─── Reusable App Screenshot Shell (Matches actual FairPay dashboard screenshot) ─── */

function AppWindowMock({
  activeNav,
  breadcrumb,
  children,
}: {
  activeNav: "jobs" | "arkiv" | "payments";
  breadcrumb: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-[#08090b] rounded-xl border border-white/10 overflow-hidden font-sans text-left text-xs select-none shadow-[0_8px_60px_rgba(0,0,0,0.6)]">
      <div className="flex min-h-[380px] sm:min-h-[410px]">
        {/* Left App Sidebar (Matches real FairPay sidebar in the screenshot) */}
        <div className="hidden sm:flex w-44 shrink-0 border-r border-white/[0.08] bg-[#0c0d10] p-3.5 flex-col justify-between">
          <div className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <FairPayLogo size={20} />
              <span className="font-semibold text-white tracking-tight text-sm">FairPay</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-900/60 border border-white/[0.06]">
              <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-[10px] font-medium text-white shrink-0">
                MA
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] font-medium text-white truncate">Manas Hatwar</div>
                <div className="text-[9px] text-neutral-400 truncate">Freelancer</div>
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-1 pt-1">
              <div className="text-[9px] font-mono uppercase text-neutral-400 px-2 mb-1">Workspace</div>
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeNav === "jobs"
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "text-neutral-400"
                }`}
              >
                <BriefcaseBusiness className="w-3.5 h-3.5" />
                <span>Jobs</span>
              </div>
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeNav === "arkiv"
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "text-neutral-400"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Arkiv Board</span>
              </div>
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeNav === "payments"
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "text-neutral-400"
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Payments</span>
              </div>
            </div>

            {/* Recent jobs label */}
            <div className="pt-2">
              <div className="text-[9px] font-mono uppercase text-neutral-400 px-2 mb-1">Recent jobs</div>
              <div className="text-[10px] text-neutral-300 px-2 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-neutral-400" /> Webdev
              </div>
            </div>
          </div>

          {/* Bottom user status */}
          <div className="pt-3 border-t border-white/[0.06] text-[10px] text-neutral-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono">Arc Testnet</span>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-black/40 overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
              <span className="text-neutral-400 hidden sm:inline">Workspace</span>
              <span className="hidden sm:inline">&gt;</span>
              <span className="text-white font-medium">{breadcrumb}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Arc Testnet
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-white/10 text-[10px] text-neutral-400 font-mono hidden sm:inline-block">
                0x0a33...1af0
              </span>
            </div>
          </div>

          {/* Child Page Content */}
          <div className="flex-1 flex flex-col justify-between">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mock Preview Components (Rendered with real dashboard screenshot feel) ─── */

function MockPreview({ type }: { type: FeatureBlock["mockType"] }) {
  const { isAuthenticated } = useConvexAuth();
  const tryNowHref = isAuthenticated ? "/jobs" : "/auth";

  if (type === "escrow") {
    return (
      <AppWindowMock activeNav="jobs" breadcrumb="Jobs > Webdev">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase text-neutral-400">Job Agreement</div>
              <h4 className="text-base font-semibold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>Webdev</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                  Deal agreed
                </span>
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-white font-mono block">500.0 USDC</span>
              <span className="text-[9px] text-neutral-400 font-mono">0 USDC fee</span>
            </div>
          </div>

          {/* Agreement Progress */}
          <div className="p-3 rounded-lg border border-white/[0.08] bg-neutral-950/70 mb-3">
            <div className="text-[10px] text-neutral-400 font-mono mb-2">Agreement progress</div>
            <div className="grid grid-cols-5 gap-1 text-center text-[9px] font-mono">
              <div className="p-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                1. Proposed ✓
              </div>
              <div className="p-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                2. Agreed ✓
              </div>
              <div className="p-1 rounded bg-neutral-900 text-neutral-400 border border-white/[0.06]">
                3. Funded
              </div>
              <div className="p-1 rounded bg-neutral-900 text-neutral-400 border border-white/[0.06]">
                4. Review
              </div>
              <div className="p-1 rounded bg-neutral-900 text-neutral-400 border border-white/[0.06]">
                5. Paid
              </div>
            </div>
          </div>

          {/* Client & Freelancer Identifiers */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded border border-white/[0.06] bg-neutral-900/40">
              <span className="text-neutral-400 block text-[9px]">Client: Ritesh Sinha</span>
              <span className="text-white">0x944d...48f8a</span>
            </div>
            <div className="p-2 rounded border border-white/[0.06] bg-neutral-900/40">
              <span className="text-neutral-400 block text-[9px]">Freelancer: Manas Hatwar</span>
              <span className="text-white">0x0a33...f1af0</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-3">
          <span>Escrow: FairPayStableEscrow.sol</span>
          <span className="text-white">Direct Wallet Settlement</span>
        </div>
      </AppWindowMock>
    );
  }

  if (type === "arkiv") {
    return (
      <AppWindowMock activeNav="arkiv" breadcrumb="Arkiv Board">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase text-neutral-400">Rabdi Testnet (7794095)</div>
              <h4 className="text-base font-semibold text-white tracking-tight mt-0.5">
                Decentralized RFP Board
              </h4>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-neutral-300">
              <Database className="w-3 h-3 text-white" /> Consensus TTL
            </span>
          </div>

          {/* Search bar simulation */}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-white/[0.08] bg-neutral-950/80 mb-3 text-[11px] text-neutral-400">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span>Search live RFPs by skill, budget or TTL...</span>
          </div>

          {/* 2 Live Arkiv RFP Postings */}
          <div className="space-y-2 mb-2">
            <div className="p-2.5 rounded-lg border border-white/[0.08] bg-neutral-900/50 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">Build Arc Smart Contract Escrow Subgraph</div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-2">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 32h 45m Remaining
                  </span>
                  <span>•</span>
                  <span>Poster: 0x944d...48f8a</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-white">2,500 USDC</span>
            </div>

            <div className="p-2.5 rounded-lg border border-white/[0.08] bg-neutral-900/50 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">Solidity Fuzzing Test Suite (Echidna)</div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-2">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 18h 12m Remaining
                  </span>
                  <span>•</span>
                  <span>Poster: 0x0a33...f1af0</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-white">1,800 USDC</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-2">
          <span>Arkiv DB-Chain SDK</span>
          <span className="text-white">Zero Ghost Jobs • Auto-Pruning</span>
        </div>
      </AppWindowMock>
    );
  }

  if (type === "agreement") {
    return (
      <AppWindowMock activeNav="jobs" breadcrumb="Jobs > Webdev > Agreement">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase text-neutral-400">Convex Reactive State</div>
              <h4 className="text-base font-semibold text-white tracking-tight mt-0.5">
                EIP-191 Scope Lock
              </h4>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-neutral-300">
              <ShieldCheck className="w-3 h-3 text-white" /> Signed & Anchored
            </span>
          </div>

          {/* Canonical Hash Box */}
          <div className="p-2.5 rounded-lg border border-white/[0.08] bg-neutral-950/80 mb-3">
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono mb-1">
              <span>Canonical Keccak-256 Hash</span>
              <span className="text-emerald-400">On-Chain Locked</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-200 bg-black/60 p-1.5 rounded border border-white/[0.06] truncate">
              0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
            </div>
          </div>

          {/* Dual Verified Signatures */}
          <div className="space-y-1.5 mb-2 font-mono text-[10px]">
            <div className="p-2 rounded border border-white/[0.06] bg-neutral-900/50 flex items-center justify-between">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-white" /> Client EIP-191:
              </span>
              <span className="text-white">Ritesh Sinha (0x944d...48f8a) ✓</span>
            </div>
            <div className="p-2 rounded border border-white/[0.06] bg-neutral-900/50 flex items-center justify-between">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-white" /> Freelancer EIP-191:
              </span>
              <span className="text-white">Manas Hatwar (0x0a33...f1af0) ✓</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-2">
          <span>WebSocket Sync: 12ms</span>
          <span className="text-white">Zero Scope Creep</span>
        </div>
      </AppWindowMock>
    );
  }

  // wallet / settlement view
  return (
    <AppWindowMock activeNav="payments" breadcrumb="Payments">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase text-neutral-400">Direct Wallet Settlement</div>
            <h4 className="text-base font-semibold text-white tracking-tight mt-0.5">
              0% Platform Extraction
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-neutral-300">
            <Wallet className="w-3 h-3 text-white" /> EVM Connected
          </span>
        </div>

        {/* Payout Breakdown Table */}
        <div className="p-3 rounded-lg border border-white/[0.08] bg-neutral-950/80 mb-3 font-mono text-[11px] space-y-1.5">
          <div className="flex justify-between text-neutral-300">
            <span>Escrow Approved:</span>
            <span className="text-white font-semibold">2,500.00 USDC</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Upwork / Fiverr Cut (15%):</span>
            <span className="text-red-400 line-through">-$375.00</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>FairPay Platform Commission:</span>
            <span className="text-emerald-400 font-semibold">$0.00 (0% Cut)</span>
          </div>
          <div className="pt-1.5 border-t border-white/[0.08] flex justify-between text-white font-semibold text-xs">
            <span>Contractor Net Payout:</span>
            <span>2,500.00 USDC (100%)</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={tryNowHref}
          className="w-full py-2.5 px-4 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          <span>Try Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Bottom Status Row */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-2">
        <span>MetaMask • Rabby • Coinbase</span>
        <span className="text-white">&lt; 2s Instant Release</span>
      </div>
    </AppWindowMock>
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
  const { isAuthenticated } = useConvexAuth();
  const tryNowHref = isAuthenticated ? "/jobs" : "/auth";
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-80px 0px" });

  const isImageRight = feature.imagePosition === "right";
  const targetHref = feature.link === "/jobs" ? tryNowHref : feature.link;

  return (
    <div
      ref={rowRef}
      className={`grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center ${
        index === features.length - 1 ? "pt-12 lg:pt-16 pb-4 lg:pb-6" : "py-12 lg:py-16"
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
        {targetHref && (
          <div className="mt-2">
            <Link
              href={targetHref}
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

        {/* Frame with WeKraft subtle gradient bottom mask (applied to both mock cards and photos) */}
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

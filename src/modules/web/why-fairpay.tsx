"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useConvexAuth } from "convex/react";

export interface FeatureBlock {
  tag: string;
  title: string;
  description: string;
  imagePosition: "left" | "right";
  link?: string;
  linkText?: string;
  featureType: "escrow" | "arkiv" | "agreement" | "wallet";
}

const features: FeatureBlock[] = [
  {
    tag: "Settlement Layer • Arc Testnet 5042002",
    title: "From Deal Agreed to Paid. Every Milestone Guaranteed.",
    description:
      "Once client and freelancer agree on scope, the job progresses through 5 deterministic on-chain stages: Proposed, Agreed, Funded, In Review, and Paid. Milestone USDC locks upfront into FairPayStableEscrow.sol on Arc Testnet with 0 USDC platform fee. Zero custody risk, zero client ghosting.",
    imagePosition: "right",
    link: "/jobs/new",
    linkText: "Create an escrow",
    featureType: "escrow",
  },
  {
    tag: "Ephemeral RFP Layer • Rabdi 7794095",
    title: "Auto-Expiring RFPs on Arkiv DB-Chain",
    description:
      "Integrated via @arkiv-network/sdk on Rabdi testnet (Chain ID 7794095). FairPay stores live freelance postings as on-chain entities with native protocol-level ExpirationTime TTLs (24h to 7d). When an RFP expires or is fulfilled, Arkiv's consensus layer prunes it without manual transaction overhead, dead ghost listings, or state bloat.",
    imagePosition: "left",
    link: "/arkiv",
    linkText: "Explore Arkiv board",
    featureType: "arkiv",
  },
  {
    tag: "Gasless Auth & Reactive State • Convex",
    title: "Cryptographic Agreement Verification via Keccak-256",
    description:
      "Off-chain coordination powered by Convex. Clients and contractors authenticate gaslessly using EIP-191 (Sign-In with Ethereum). The agreed scope and deliverables generate a canonical Keccak-256 agreement hash locked on-chain before funds lock — permanently preventing scope creep and revision disputes.",
    imagePosition: "right",
    link: "/jobs",
    linkText: "View agreement flow",
    featureType: "agreement",
  },
  {
    tag: "Zero Custody Risk • 0% Platform Fee",
    title: "Atomic Wallet Payouts. Zero Intermediary Cut.",
    description:
      "Legacy Web2 freelance platforms extract 10% to 20% in fees while holding your money in centralized bank accounts for 5 to 10 days. FairPay charges 0% platform cuts. Approved milestone funds release atomically from the smart contract directly to your self-custody EVM wallet (MetaMask, Rabby, Coinbase).",
    imagePosition: "left",
    link: "/jobs",
    linkText: "Try Now",
    featureType: "wallet",
  },
];

// Product flow illustrations contain no fictional accounts, balances, or jobs.
function FeaturePreview({ type }: { type: FeatureBlock["featureType"] }) {
  const steps = {
    escrow: ["Agree on the scope", "Fund the escrow contract", "Verify work and release payment"],
    arkiv: ["Publish a job on Arkiv", "Freelancers submit proposals", "Expired listings leave the feed"],
    agreement: ["Review the deliverables", "Freelancer accepts the agreement", "Record the agreement hash"],
    wallet: ["Client verifies the work", "Contract transfers the payment", "Freelancer receives funds in their wallet"],
  }[type];
  return (
    <div className="min-h-80 p-8 sm:p-12 flex flex-col justify-center gap-4">
      {steps.map((step, index) => (
        <div key={step} className="rounded-lg border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
          <span className="text-sm text-blue-400 font-mono">{index + 1}</span>
          <p className="text-sm text-neutral-200">{step}</p>
        </div>
      ))}
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
  const { isAuthenticated } = useConvexAuth();
  const tryNowHref = isAuthenticated ? "/jobs" : "/auth";
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-80px 0px" });

  const isImageRight = feature.imagePosition === "right";
  const targetHref = feature.link === "/jobs" ? tryNowHref : feature.link;

  const rowId =
    feature.featureType === "wallet"
      ? "why-fairpay"
      : index === 0
        ? "how-it-works"
        : undefined;

  return (
    <div
      id={rowId}
      ref={rowRef}
      className={`grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center scroll-mt-28 ${
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

      {/* Product flow illustration — Exact WeKraft horizontal glide: x: ±120 -> 0, duration: 1.0, delay: 0.3 */}
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

        {/* Product flow frame */}
        <div
          className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_8px_60px_rgba(0,0,0,0.5)] group bg-[#0c0d10]"
          style={{
            maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
          }}
        >
          {/* Subtle hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

          <FeaturePreview type={feature.featureType} />
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

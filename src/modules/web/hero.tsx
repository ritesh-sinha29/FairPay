"use client";

import Link from "next/link";
import { ArrowRight, Database, ShieldCheck } from "lucide-react";
import { Navbar } from "./navbar";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-black text-white font-sans select-none">
      {/* 1. WeKraft floating pill navbar */}
      <Navbar />

      {/* 2. Optimized 1080p Video Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/hero-globe.jpg"
          className="w-full h-full object-cover object-bottom opacity-80 mix-blend-screen will-change-transform transform-gpu"
        >
          <source
            src="/Digital_globe_rotating_with_network_ea208c27_1080p.mp4"
            type="video/mp4"
          />
        </video>

        {/* Ambient Top Light & Vignette Overlays for Maximum Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/35 to-black/90 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,rgba(35,90,225,0.22),rgba(0,0,0,0))] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
      </div>

      {/* 3. Hero content */}
      <main className="relative z-20 max-w-4xl mx-auto px-6 pt-36 sm:pt-40 pb-16 text-center flex flex-col items-center my-auto">
        {/* WeKraft-style pill badge (No emojis, monochrome) */}
        <div className="inline-flex items-center p-1 pr-3.5 border border-white/10 rounded-full bg-white/[0.04] backdrop-blur-md mb-8">
          <div className="bg-white/10 px-3 py-0.5 rounded-full flex items-center gap-1.5 border border-white/10">
            <span className="text-[11px] font-medium text-white tracking-wide">
              Protocol
            </span>
          </div>
          <span className="text-neutral-300 text-xs font-medium ml-2.5 flex items-center gap-1">
            <span>Decentralized Freelance Escrow</span>
            <ArrowRight size={12} className="text-neutral-400" />
          </span>
        </div>

        {/* Headline (WeKraft tight typography, pure white, no rainbow gradient) */}
        <h1 className="text-white font-sans tracking-tight text-[36px] sm:text-[54px] md:text-[68px] font-semibold leading-[1.08] max-w-4xl mb-6">
          Global Work.
          <br />
          Guaranteed Payouts.
        </h1>

        {/* Subhead (clean neutral) */}
        <p className="text-neutral-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          Non-custodial milestone escrow in Circle USDC with auto-expiring RFPs
          powered by Arkiv DB-Chain. Zero platform cuts, zero custody risk.
        </p>

        {/* CTA Buttons (WeKraft black & white styles) */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
          <Link href="/jobs/new">
            <Button
              size="lg"
              className="h-11 px-6 bg-white text-black hover:bg-neutral-200 font-medium text-xs rounded-lg transition-all shadow-lg shadow-white/5"
            >
              <span>Create Escrow</span>
              <ArrowRight size={13} className="ml-1.5" />
            </Button>
          </Link>
          <Link href="/arkiv">
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 border-white/15 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 text-xs rounded-lg backdrop-blur-md"
            >
              <span>Browse Arkiv RFPs</span>
            </Button>
          </Link>
        </div>

        {/* Minimalist Metrics Strip */}
        <div className="inline-flex items-center gap-6 px-5 py-2 rounded-full border border-white/10 bg-neutral-950/70 text-[11px] text-neutral-400 backdrop-blur-md">
          <span className="text-neutral-300">0% Platform Cut</span>
          <span className="text-neutral-700">•</span>
          <span className="text-neutral-300">Arc USDC Escrow</span>
          <span className="text-neutral-700">•</span>
          <span className="text-neutral-300">Arkiv TTL Pruning</span>
        </div>
      </main>

      {/* 4. Empty bottom spacer to let the video globe horizon breathe */}
      <div className="relative w-full h-12 pointer-events-none" />
    </div>
  );
}

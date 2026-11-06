import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FairPayLogo } from "./fairpay-logo";

interface AuthScreenProps {
  children: ReactNode;
}

export function AuthScreen({ children }: AuthScreenProps) {
  return (
    <div className="h-screen bg-black text-white selection:bg-white selection:text-black font-sans dark p-5">
      {/* Main Container */}
      <div className="flex h-full">
        {/* LEFT SIDE (65% width) */}
        <div className="hidden lg:block border border-border/40 relative overflow-hidden w-[65%] h-full rounded-lg p-8">
          <div className="absolute z-10 -top-20 left-1/2 -translate-x-1/2 w-full max-w-[560px] h-[300px] bg-blue-500/25 blur-[160px] rounded-full pointer-events-none" />
          <div className="absolute z-10 -bottom-10 left-1/2 -translate-x-1/2 w-full h-[160px] bg-black blur-[160px] rounded-full pointer-events-none" />
          <Image
            src="/bg-footer.jpg"
            alt="Background"
            fill
            priority
            className="object-cover z-0 opacity-50"
          />
          <div className="flex items-center gap-2 z-20 relative">
            <FairPayLogo size={35} />
            <h1 className="text-xl font-semibold tracking-tight text-white">
              FairPay
            </h1>
          </div>

          <div className="absolute bottom-10 z-20">
            <h1 className="text-6xl font-semibold tracking-tight bg-gradient-to-r from-white to-neutral-800 text-transparent bg-clip-text">
              Decentralized
            </h1>
            <h1 className="text-6xl font-semibold tracking-tight bg-gradient-to-r from-white to-neutral-800 text-transparent bg-clip-text">
              Milestone Escrow for
            </h1>
            <h1 className="text-6xl leading-snug -mt-1 font-semibold tracking-wide bg-gradient-to-r from-white to-neutral-800 text-transparent bg-clip-text">
              Builders and Startups
            </h1>
          </div>
        </div>

        {/* RIGHT SIDE (35% width, perfectly matched to reference) */}
        <div className="w-full lg:w-[35%] h-full flex flex-col justify-center items-center px-6 sm:px-12 relative overflow-hidden bg-black">
          {/* Header */}
          <div className="flex flex-col items-center gap-5 mb-12 relative z-10">
            <div className="flex items-center gap-3">
              <FairPayLogo size={40} />
              <h1 className="text-3xl font-bold tracking-tight text-white">
                FairPay
              </h1>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-neutral-400 tracking-wide uppercase">
                Building the future together
              </p>
              <div className="h-px w-40 bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto" />
            </div>
          </div>

          {/* Auth Card / Options */}
          <div className="w-full max-w-sm space-y-8 relative z-10">
            {children}
          </div>

          {/* Footer Items - Pinned cleanly to the bottom */}
          <div className="absolute bottom-10 left-0 right-0 px-6 sm:px-12 pointer-events-auto z-10">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-8">
                <Link
                  href="/terms"
                  className="text-[11px] font-medium text-neutral-400 hover:text-neutral-300 transition-colors tracking-wider uppercase"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-[11px] font-medium text-neutral-400 hover:text-neutral-300 transition-colors tracking-wider uppercase"
                >
                  Privacy
                </Link>
                <Link
                  href="/support"
                  className="text-[11px] font-medium text-neutral-400 hover:text-neutral-300 transition-colors tracking-wider uppercase"
                >
                  Support
                </Link>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium tracking-widest uppercase">
                © 2026 FairPay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

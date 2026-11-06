"use client";

import React from "react";
import Link from "next/link";
import { FairPayLogo } from "@/components/fairpay-logo";

interface FooterLinkItem {
  label: string;
  href: string;
  external?: boolean;
}

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: FooterLinkItem[];
}) => (
  <div className="flex flex-col gap-3">
    <h4 className="text-neutral-200 font-semibold text-xs uppercase tracking-wider mb-1">
      {title}
    </h4>
    <div className="flex flex-col gap-2.5">
      {links.map((link) =>
        link.external ? (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white text-[13px] font-medium transition-colors"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.label}
            href={link.href}
            className="text-neutral-400 hover:text-white text-[13px] font-medium transition-colors"
          >
            {link.label}
          </Link>
        )
      )}
    </div>
  </div>
);

export function Footer() {
  return (
    <footer
      id="footer"
      className="bg-[#050505] pt-20 pb-0 px-6 md:px-12 lg:px-16 border-t border-white/[0.04] font-sans relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Branding + Links Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-12 lg:gap-8 mb-20">
          {/* Brand Column (Spans 2 columns on lg screens) */}
          <div className="lg:col-span-2 flex flex-col gap-5 text-left">
            <Link href="/" className="flex items-center gap-2.5">
              <FairPayLogo size={28} />
              <span className="font-semibold text-white text-lg tracking-tight">
                FairPay
              </span>
            </Link>
            <p className="text-neutral-400 text-[13px] leading-relaxed max-w-sm">
              Non-custodial milestone escrow in Circle USDC and auto-expiring RFPs powered by Arkiv DB-Chain. Zero platform cuts, zero custody risk.
            </p>

            {/* Social Icons inside brand column */}
            <div className="flex items-center gap-2 mt-2">
              {[
                {
                  name: "GitHub",
                  href: "https://github.com",
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  ),
                },
                {
                  name: "X",
                  href: "https://x.com",
                  icon: (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  name: "Discord",
                  href: "https://discord.com",
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.893.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-9 h-9 flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.15] rounded-lg text-neutral-400 hover:text-white transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform Column */}
          <div className="lg:col-span-1">
            <FooterColumn
              title="Platform"
              links={[
                { label: "Overview", href: "/web" },
                { label: "Create Escrow", href: "/jobs/new" },
                { label: "Arkiv Board", href: "/arkiv" },
                { label: "Payment Rules", href: "/payments" },
                { label: "Launch App", href: "/jobs" },
              ]}
            />
          </div>

          {/* Features Column */}
          <div className="lg:col-span-1">
            <FooterColumn
              title="Features"
              links={[
                { label: "Milestone Escrow", href: "#features" },
                { label: "Arkiv TTL Pruning", href: "/arkiv" },
                { label: "One-Click Release", href: "#features" },
                { label: "Zero Platform Fee", href: "#features" },
                { label: "Arc USDC Collateral", href: "#features" },
              ]}
            />
          </div>

          {/* Ecosystem Column */}
          <div className="lg:col-span-1">
            <FooterColumn
              title="Ecosystem"
              links={[
                { label: "Arc Testnet", href: "https://arc.network", external: true },
                { label: "Circle USDC", href: "https://www.circle.com/usdc", external: true },
                { label: "Arkiv DB-Chain", href: "https://arkiv.network", external: true },
                { label: "Blockscout Scan", href: "https://testnet.arcscan.io", external: true },
                { label: "Convex Cloud", href: "https://convex.dev", external: true },
              ]}
            />
          </div>

          {/* Resources Column */}
          <div className="lg:col-span-1">
            <FooterColumn
              title="Resources"
              links={[
                { label: "Protocol FAQ", href: "#faq" },
                { label: "Security & Specs", href: "#faq" },
                { label: "Smart Contracts", href: "https://github.com", external: true },
                { label: "Blockscout Audit", href: "https://testnet.arcscan.io", external: true },
              ]}
            />
          </div>

          {/* Legal Column */}
          <div className="lg:col-span-1">
            <FooterColumn
              title="Legal"
              links={[
                { label: "Terms of Protocol", href: "/terms" },
                { label: "Privacy Notice", href: "/privacy" },
                { label: "Non-Custodial Notice", href: "/terms" },
              ]}
            />
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-neutral-500 text-xs font-normal">
            &copy; {new Date().getFullYear()} FairPay Protocol. Non-custodial & open source.
          </span>
          <span className="text-neutral-600 text-[11px] font-normal hover:text-neutral-400 transition-colors duration-200">
            Built for global builders, secured by smart contracts.
          </span>
        </div>

        {/* Giant Sarvam-Style Brand Typography Banner fitted cleanly edge-to-edge */}
        <div className="w-full overflow-hidden flex justify-center -mb-4 sm:-mb-6 md:-mb-8 pt-10 sm:pt-16 select-none pointer-events-none">
          <span className="text-[13vw] sm:text-[14.5vw] md:text-[15.5vw] font-black tracking-tight leading-none text-center font-sans bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-300 to-neutral-800">
            fairpay
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;


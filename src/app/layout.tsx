import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./fairpay.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexProvider } from "@/components/convex-provider";
import { Application } from "@/components/application";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FairPay — Your work. Your payment.",
  description:
    "Non-custodial Circle USDC milestone escrow on Arc Testnet with auto-expiring RFPs on Arkiv DB-Chain. Zero platform cuts, zero custody risk.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "FairPay — Guaranteed Payouts for Web3 Builders",
    description:
      "Deterministic smart contract escrow and auto-expiring decentralized RFPs. 0% platform extraction.",
    siteName: "FairPay",
    images: [
      {
        url: "/fairpay-logo.svg",
        width: 1200,
        height: 630,
        alt: "FairPay Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FairPay — Milestone Escrow for Builders",
    description:
      "Non-custodial Circle USDC milestone escrow on Arc Testnet with auto-expiring RFPs on Arkiv DB-Chain.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark scroll-smooth ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <ConvexAuthNextjsServerProvider>
          <ConvexProvider>
            <TooltipProvider>
              <Application>{children}</Application>
              <Toaster />
            </TooltipProvider>
          </ConvexProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}

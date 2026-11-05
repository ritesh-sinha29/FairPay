import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./fairpay.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexProvider } from "@/components/convex-provider";
import { Application } from "@/components/application";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "FairPay — Your work. Your payment.",
  description:
    "Create funded work agreements, submit work, and release payments with Ethereum escrow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <ConvexAuthNextjsServerProvider>
          <ConvexProvider>
            <TooltipProvider>
              <Application>{children}</Application>
            </TooltipProvider>
          </ConvexProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}

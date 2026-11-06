"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Menu, X } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { FairPayLogo } from "@/components/fairpay-logo";
import { Button } from "@/components/ui/button";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "How it works", href: "/web#features" },
  { label: "Payment rules", href: "/payments" },
  { label: "Arkiv Board", href: "/arkiv" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  const tryNowHref = isAuthenticated ? "/jobs" : "/auth";
  const logoHref = "/web";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
        scrolled || isMenuOpen
          ? "top-4 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-4xl w-[95%] md:w-full rounded-2xl border border-white/10 bg-neutral-900/60"
          : "top-0 bg-transparent w-full border-none shadow-none"
      )}
    >
      <nav
        className={clsx(
          "mx-auto max-w-7xl px-6 flex items-center justify-between transition-all duration-300",
          scrolled ? "h-14 max-w-5xl mx-auto" : "h-20"
        )}
      >
        {/* Brand Logo */}
        <Link
          href={logoHref}
          className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
        >
          <FairPayLogo size={scrolled ? 26 : 30} />
          <span className="font-semibold text-white text-base tracking-tight">
            FairPay
          </span>
        </Link>

        {/* Desktop Links (WeKraft inspired animated underline) */}
        <div
          className={clsx(
            "hidden md:flex text-sm font-medium shrink-0 items-center",
            scrolled ? "gap-1" : "gap-2"
          )}
        >
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="relative cursor-pointer transition-all duration-300 text-neutral-300 hover:text-white px-3.5 py-1.5 text-xs group"
            >
              <span>{label}</span>
              <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-white transition-all duration-300 ease-out -translate-x-1/2 group-hover:w-[calc(100%-1.5rem)]" />
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href={isAuthenticated ? "/jobs" : "/sign-in"} className="hidden sm:inline-block">
            <span className="text-xs font-medium text-neutral-300 hover:text-white transition-colors px-2 py-1">
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </span>
          </Link>
          <Link href={tryNowHref}>
            <Button
              size="sm"
              className={clsx(
                "transition-all duration-200 font-medium text-xs bg-white text-black hover:bg-neutral-200",
                scrolled ? "h-8 px-3.5" : "h-9 px-4"
              )}
            >
              <span>Try Now</span>
              <ArrowRight size={12} className="ml-1" />
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-1 opacity-80 hover:opacity-100 transition-opacity ml-1"
            aria-label="Toggle Navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 px-6 py-4 flex flex-col gap-3 bg-neutral-950/95 backdrop-blur-2xl rounded-b-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-neutral-300 text-xs font-medium hover:text-white transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Link
              href={isAuthenticated ? "/jobs" : "/sign-in"}
              onClick={() => setIsMenuOpen(false)}
              className="text-xs text-neutral-300 hover:text-white py-1"
            >
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Link>
            <Link
              href={tryNowHref}
              onClick={() => setIsMenuOpen(false)}
              className="text-xs text-white font-medium py-1"
            >
              Try Now →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}


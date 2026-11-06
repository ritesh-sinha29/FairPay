"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Hero, WhyFairPay, FAQ, Footer } from "@/modules/web";

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    // If visiting the site and logged in, redirect just once per session to dashboard
    if (!isLoading && isAuthenticated && typeof window !== "undefined") {
      const redirected = sessionStorage.getItem("fairpay_initial_redirected");
      if (!redirected) {
        sessionStorage.setItem("fairpay_initial_redirected", "true");
        router.replace("/jobs");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="bg-black text-white min-h-screen">
      <Hero />
      <WhyFairPay />
      <FAQ />
      <Footer />
    </div>
  );
}

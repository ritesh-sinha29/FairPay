import { Hero, WhyFairPay, FAQ, Footer } from "@/modules/web";

export default function WebPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Hero />
      <WhyFairPay />
      <FAQ />
      <Footer />
    </div>
  );
}



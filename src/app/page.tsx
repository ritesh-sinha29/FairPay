import { Hero, WhyFairPay, FAQ, Footer } from "@/modules/web";

export default function Page() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Hero />
      <WhyFairPay />
      <FAQ />
      <Footer />
    </div>
  );
}

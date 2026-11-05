import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Link
          href="/sign-in"
          className="flex items-center gap-3 text-2xl font-semibold tracking-tight"
        >
          <span className="brand-mark">
            <ShieldCheck size={23} />
          </span>
          FairPay<span className="text-blue-400">.</span>
        </Link>
        <div className="auth-story-content">
          <p className="eyebrow">WORK WITH A CLEAR AGREEMENT</p>
          <h1>
            A funded job.
            <br />A clear delivery.
            <br />A fair payment.
          </h1>
          <p>
            Clients set aside the payment before work begins. Freelancers
            deliver against a shared brief. Both can follow the same agreement.
          </p>
          <div className="mt-9 flex items-center gap-3 rounded-lg border border-blue-900/50 bg-blue-950/30 p-4 text-xs text-blue-200">
            <ShieldCheck size={22} />
            <span>Escrow payments are authorized by your wallet.</span>
          </div>
        </div>
        <footer className="text-[10px] text-muted-foreground">
          Built for ETHGlobal Mumbai · Arc Testnet
        </footer>
      </aside>
      <main className="auth-form-area">
        <div>{children}</div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Palette } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
  return (
    <AuthScreen>
      <p className="eyebrow">CREATE YOUR ACCOUNT</p>
      <h1 className="text-3xl font-medium tracking-tight">
        How will you use FairPay?
      </h1>
      <p className="mt-3 text-xs leading-7 text-muted-foreground">
        Choose the workspace that fits your work.
      </p>
      <div className="mt-8 space-y-4">
        <Link href="/sign-up/client" className="block">
          <Card className="auth-role-card">
            <CardContent className="flex items-start gap-4">
              <span className="rounded-lg border border-blue-900 bg-blue-950/40 p-3 text-blue-300">
                <BriefcaseBusiness size={22} />
              </span>
              <div className="flex-1">
                <h2 className="text-base font-medium">I’m a client</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Hire a freelancer, fund the job, and verify their work to
                  release payment.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs text-blue-300">
                  Create client account <ArrowRight size={13} />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/sign-up/freelancer" className="block">
          <Card className="auth-role-card">
            <CardContent className="flex items-start gap-4">
              <span className="rounded-lg border border-violet-900 bg-violet-950/30 p-3 text-violet-300">
                <Palette size={22} />
              </span>
              <div className="flex-1">
                <h2 className="text-base font-medium">I’m a freelancer</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Receive funded jobs, share your delivery, and track your
                  payment.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs text-violet-300">
                  Create freelancer account <ArrowRight size={13} />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
      <p className="mt-7 text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/sign-in"
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </AuthScreen>
  );
}

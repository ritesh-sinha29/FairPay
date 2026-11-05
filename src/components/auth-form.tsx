"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowLeft, ArrowRight, LoaderCircle, Wallet } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { connectWallet, readableError } from "@/lib/ethereum";
import type { Role } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AuthForm({ role }: { role?: Role }) {
  const signup = !!role;
  const begin = useAction(api.walletActions.begin);
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (stage) return;
    setError("");
    try {
      setStage("Connect your wallet…");
      const signer = await connectWallet();
      const address = await signer.getAddress();
      const challenge = await begin({
        address,
        flow: signup ? "signUp" : "signIn",
        ...(signup ? { role, name, headline } : {}),
      });
      setStage("Approve the sign-in message in your wallet…");
      const signature = await signer.signMessage(challenge.message);
      setStage("Verifying your signature…");
      await signIn("wallet", { challengeId: challenge.challengeId, signature });
      const requested = new URLSearchParams(window.location.search).get(
        "returnTo",
      );
      const destination =
        requested?.startsWith("/") && !requested.startsWith("//")
          ? requested
          : "/";
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setError(readableError(error));
      setStage("");
    }
  }

  return (
    <>
      {signup && (
        <Link
          href="/sign-up"
          className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground"
        >
          <ArrowLeft size={13} /> Choose account type
        </Link>
      )}
      <Badge variant="outline" className="mb-5 text-[10px]">
        {signup
          ? `${role === "client" ? "Client" : "Freelancer"} account`
          : "WELCOME BACK"}
      </Badge>
      <h1 className="text-3xl font-medium tracking-tight">
        {signup
          ? role === "client"
            ? "Hire with confidence."
            : "Get your work funded."
          : "Sign in to FairPay."}
      </h1>
      <p className="mt-3 text-xs leading-7 text-muted-foreground">
        {signup
          ? role === "client"
            ? "Create funded jobs, choose freelancers, and review their delivery."
            : "Receive jobs, submit your work, and track your payments."
          : "Use the wallet linked to your client or freelancer account."}
      </p>
      <Card className="mt-7">
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            {signup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Your name</Label>
                  <Input
                    id="signup-name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="How should we address you?"
                    required
                    disabled={!!stage}
                  />
                </div>
                {role === "freelancer" && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-headline">
                      What do you do?{" "}
                      <span className="text-xs text-muted-foreground">
                        Optional
                      </span>
                    </Label>
                    <Input
                      id="signup-headline"
                      maxLength={160}
                      value={headline}
                      onChange={(event) => setHeadline(event.target.value)}
                      placeholder="e.g. Brand designer and frontend developer"
                      disabled={!!stage}
                    />
                  </div>
                )}
              </>
            )}
            <div className="rounded-lg border bg-muted/30 p-4 text-xs leading-6 text-muted-foreground">
              <Wallet className="mb-2 text-blue-300" size={18} />A wallet
              signature proves you control this address. Signing in costs no
              gas. Your wallet stays under your control.
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs leading-6">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button
              className="h-auto min-h-10 w-full whitespace-normal text-xs"
              disabled={!!stage}
            >
              {stage ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Wallet size={16} />
              )}
              {stage ||
                (signup ? `Create ${role} account` : "Sign in with wallet")}
              {!stage && <ArrowRight size={14} />}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {signup ? "Already have an account?" : "New to FairPay?"}{" "}
        <Link
          href={signup ? "/sign-in" : "/sign-up"}
          className="ml-1 text-foreground underline underline-offset-4"
        >
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
      <p className="mt-6 text-center text-[10px] leading-6 text-muted-foreground">
        Choose your account type when signing up. The role is saved with your
        wallet.
      </p>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Wallet,
  BriefcaseBusiness,
  Palette,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { connectWallet, readableError } from "@/lib/ethereum";
import type { Role } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthFormProps {
  role?: Role;
  mode?: "signIn" | "signUp";
}

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function AuthForm({ role: initialRole, mode }: AuthFormProps) {
  const isSignUp = mode === "signUp" || !!initialRole;
  const begin = useAction(api.walletActions.begin);
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role>(
    initialRole || "client",
  );
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  async function handleOAuth(provider: "github" | "google") {
    setError("");
    setSocialLoading(provider);
    try {
      await signIn(provider);
    } catch (err: unknown) {
      // If OAuth provider is not yet provisioned in Convex deployment
      const message =
        err instanceof Error ? err.message : "OAuth sign-in failed";
      setError(
        message.includes("provider") || message.includes("not configured")
          ? `${provider.toUpperCase()} provider is not configured yet in this environment. Please sign in with your Web3 Wallet below.`
          : message,
      );
      setShowWalletDetails(true);
      setSocialLoading(null);
    }
  }

  async function submitWallet(event?: React.FormEvent) {
    if (event) event.preventDefault();
    if (stage) return;
    setError("");

    if (isSignUp && !name.trim()) {
      setShowWalletDetails(true);
      setError("Please enter your name to create an account.");
      return;
    }

    try {
      setStage("Connecting wallet…");
      const signer = await connectWallet();
      const address = await signer.getAddress();

      setStage("Preparing challenge…");
      const challenge = await begin({
        address,
        flow: isSignUp ? "signUp" : "signIn",
        ...(isSignUp ? { role: selectedRole, name, headline } : {}),
      });

      setStage("Approve message in wallet…");
      const signature = await signer.signMessage(challenge.message);

      setStage("Verifying signature…");
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
    } catch (err) {
      setError(readableError(err));
      setStage("");
    }
  }

  return (
    <div className="w-full">
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2.5">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="text-xs text-[#8e93a6]">
          {isSignUp
            ? "Sign up to start creating and managing escrow agreements"
            : "Sign in to access your jobs and payments"}
        </p>
      </div>

      {/* Social Buttons */}
      <div className="space-y-4">
        {/* Continue with Google Button */}
        <button
          type="button"
          disabled={!!stage || socialLoading !== null}
          onClick={() => handleOAuth("google")}
          className="w-full py-3 px-4 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-3 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {socialLoading === "google" ? (
            <LoaderCircle className="animate-spin text-blue-400" size={18} />
          ) : (
            <GoogleIcon className="w-4 h-4 transition-transform group-hover:scale-105" />
          )}
          <span className="text-xs font-medium tracking-tight">
            Continue with Google
          </span>
        </button>
      </div>

      {/* Web3 Wallet Option (Preserving FairPay Escrow Authentication) */}
      <div className="mt-6 pt-6 border-t border-zinc-800/60">
        {!showWalletDetails && !isSignUp ? (
          <button
            type="button"
            disabled={!!stage}
            onClick={() => submitWallet()}
            className="w-full py-3 px-4 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 font-medium text-xs flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            {stage ? (
              <LoaderCircle className="animate-spin" size={15} />
            ) : (
              <Wallet size={15} />
            )}
            <span>{stage || "Continue with Web3 Wallet"}</span>
          </button>
        ) : null}

        {/* Expandable Web3 Wallet Details & Sign-up Setup */}
        <div className={!showWalletDetails && !isSignUp ? "mt-4" : ""}>
          {!isSignUp && (
            <button
              type="button"
              onClick={() => setShowWalletDetails(!showWalletDetails)}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] text-[#717688] hover:text-[#9ea3b5] transition-colors py-1 cursor-pointer"
            >
              <span>{showWalletDetails ? "Hide wallet options" : "More sign-in options"}</span>
              {showWalletDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {(showWalletDetails || isSignUp) && (
            <form
              onSubmit={submitWallet}
              className="mt-3.5 space-y-4 rounded-xl border border-zinc-800/80 bg-[#0a0c10] p-4 text-left"
            >
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300 font-medium">
                      Account Type
                    </Label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("client")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          selectedRole === "client"
                            ? "border-blue-500 bg-blue-500/15 text-white"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                        }`}
                      >
                        <BriefcaseBusiness size={14} className="text-blue-400" />
                        Client
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("freelancer")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          selectedRole === "freelancer"
                            ? "border-blue-500 bg-blue-500/15 text-white"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                        }`}
                      >
                        <Palette size={14} className="text-violet-400" />
                        Freelancer
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="auth-name" className="text-xs text-zinc-300">
                      Your Name
                    </Label>
                    <Input
                      id="auth-name"
                      autoComplete="name"
                      minLength={2}
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      required
                      disabled={!!stage}
                      className="bg-zinc-900/60 border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:border-blue-500"
                    />
                  </div>

                  {selectedRole === "freelancer" && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="auth-headline"
                        className="text-xs text-zinc-300"
                      >
                        Headline{" "}
                        <span className="text-[10px] text-zinc-500">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        id="auth-headline"
                        maxLength={160}
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Fullstack AI Engineer"
                        disabled={!!stage}
                        className="bg-zinc-900/60 border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:border-blue-500"
                      />
                    </div>
                  )}
                </>
              )}

              <Button
                type="submit"
                disabled={!!stage}
                className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {stage ? (
                  <LoaderCircle className="animate-spin" size={15} />
                ) : (
                  <Wallet size={15} />
                )}
                <span>
                  {stage ||
                    (isSignUp
                      ? `Create ${selectedRole} account with Wallet`
                      : "Sign in with Ethereum Wallet")}
                </span>
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <Alert
          variant="destructive"
          className="mt-4 bg-red-950/40 border-red-900/50 text-red-200 text-xs"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Toggle between Sign In and Sign Up */}
      <div className="mt-8 text-center text-xs text-[#8e93a6]">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="ml-1 text-white hover:text-blue-400 font-medium underline underline-offset-4 transition-colors"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </div>
    </div>
  );
}

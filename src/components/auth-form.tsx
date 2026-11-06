"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Wallet,
  BriefcaseBusiness,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { connectWallet, readableError } from "@/lib/ethereum";
import type { Role } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFormProps {
  role?: Role;
  mode?: "signIn" | "signUp";
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
  const [stage, setStage] = useState("");
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  async function handleOAuth(provider: "google") {
    setSocialLoading(provider);
    try {
      await signIn(provider);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "OAuth sign-in failed";
      const errorMsg =
        message.includes("provider") || message.includes("not configured")
          ? `${provider.toUpperCase()} provider is not configured yet in this environment. Please sign in with your Web3 Wallet.`
          : message;
      toast.error(errorMsg);
      setShowWalletDetails(true);
      setSocialLoading(null);
    }
  }

  async function submitWallet(event?: React.FormEvent) {
    if (event) event.preventDefault();
    if (stage) return;

    if (isSignUp && !name.trim()) {
      setShowWalletDetails(true);
      toast.error("Please enter your name to create an account.");
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

      toast.success(
        isSignUp ? "Account created successfully!" : "Signed in successfully!",
      );
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
      const errMsg = readableError(err);
      toast.error(errMsg);
      setStage("");
    }
  }

  return (
    <div className="w-full space-y-5">
      {/* Title & Subtitle (Clean & Compact) */}
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="text-xs text-neutral-400">
          {isSignUp
            ? "Sign up to start creating and managing escrow agreements"
            : "Sign in to access your jobs and payments"}
        </p>
      </div>

      {/* Main Actions Container */}
      <div className="space-y-2.5">
        {/* Continue with Google Button */}
        <button
          type="button"
          disabled={!!stage || socialLoading !== null}
          onClick={() => handleOAuth("google")}
          className="w-full h-10 bg-neutral-900/60 border border-neutral-800 hover:bg-neutral-800/80 hover:border-neutral-700 transition-all duration-200 flex items-center justify-center gap-2.5 text-white rounded-lg group cursor-pointer shadow-sm relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {socialLoading === "google" ? (
            <LoaderCircle className="animate-spin text-neutral-400" size={16} />
          ) : (
            <Image
              src="/search.png"
              alt="google"
              width={18}
              height={18}
              className="transition-transform group-hover:scale-105"
            />
          )}
          <span className="text-xs font-medium tracking-tight">
            Continue with Google
          </span>
        </button>

        {/* Continue with Web3 Wallet (Sign-in mode) */}
        {!showWalletDetails && !isSignUp ? (
          <button
            type="button"
            disabled={!!stage}
            onClick={() => submitWallet()}
            className="w-full h-10 bg-neutral-900/60 border border-neutral-800 hover:bg-neutral-800/80 hover:border-neutral-700 transition-all duration-200 flex items-center justify-center gap-2.5 text-white rounded-lg group cursor-pointer shadow-sm relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {stage ? (
              <LoaderCircle className="animate-spin text-neutral-400" size={16} />
            ) : (
              <Wallet
                size={16}
                className="text-neutral-300 transition-transform group-hover:scale-105"
              />
            )}
            <span className="text-xs font-medium tracking-tight">
              {stage || "Continue with Web3 Wallet"}
            </span>
          </button>
        ) : null}

        {/* Expandable Options Toggle (Only on Sign In) */}
        {!isSignUp && (
          <button
            type="button"
            onClick={() => setShowWalletDetails(!showWalletDetails)}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors pt-0.5 cursor-pointer"
          >
            <span>{showWalletDetails ? "Hide wallet options" : "More sign-in options"}</span>
            {showWalletDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        {/* Web3 Wallet Form (Clean, no nested outer box) */}
        {(showWalletDetails || isSignUp) && (
          <form
            onSubmit={submitWallet}
            className="space-y-3.5 text-left pt-1"
          >
            {isSignUp && (
              <>
                {/* Account Type: Label on Left, Segmented Pills on Right */}
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs text-neutral-300 font-medium">
                    Account Type
                  </Label>
                  <div className="inline-flex p-0.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("client")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        selectedRole === "client"
                          ? "bg-neutral-800 text-white shadow-xs"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <BriefcaseBusiness
                        size={12}
                        className={
                          selectedRole === "client"
                            ? "text-blue-400"
                            : "text-neutral-500"
                        }
                      />
                      Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("freelancer")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        selectedRole === "freelancer"
                          ? "bg-neutral-800 text-white shadow-xs"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Palette
                        size={12}
                        className={
                          selectedRole === "freelancer"
                            ? "text-purple-400"
                            : "text-neutral-500"
                        }
                      />
                      Freelancer
                    </button>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name" className="text-xs text-neutral-300 font-medium">
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
                    className="h-10 bg-neutral-900/50 border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-700 rounded-lg"
                  />
                </div>

                {selectedRole === "freelancer" && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="auth-headline"
                      className="text-xs text-neutral-300 font-medium"
                    >
                      Headline{" "}
                      <span className="text-[10px] text-neutral-500 font-normal">
                        (Optional)
                      </span>
                    </Label>
                    <Input
                      id="auth-headline"
                      maxLength={160}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Fullstack Web3 Engineer"
                      disabled={!!stage}
                      className="h-10 bg-neutral-900/50 border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-700 rounded-lg"
                    />
                  </div>
                )}
              </>
            )}

            {/* Primary Action Button */}
            <Button
              type="submit"
              disabled={!!stage}
              className="w-full h-10 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {stage ? (
                <LoaderCircle className="animate-spin text-neutral-400" size={15} />
              ) : (
                <Wallet size={15} className="text-neutral-300" />
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

      {/* Toggle between Sign In and Sign Up */}
      <div className="text-center text-xs text-neutral-400 pt-0.5">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="ml-1 text-white hover:text-neutral-300 font-medium underline underline-offset-4 transition-colors"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  LoaderCircle,
  Wallet,
  Briefcase,
  Code2,
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

  async function submitWallet(event?: React.FormEvent) {
    if (event) event.preventDefault();
    if (stage) return;

    if (isSignUp && !name.trim()) {
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
    <div className="w-full space-y-8">
      {/* Title & Subtitle */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="text-sm text-neutral-400">
          {isSignUp
            ? "Sign up to start creating and managing escrow agreements"
            : "Sign in to access your jobs and payments"}
        </p>
      </div>

      {/* Main Actions Container */}
      <div className="space-y-3.5">
        {!isSignUp ? (
          /* Sign-in Option: Sleek Dark Glass Button matching reference */
          <Button
            type="button"
            disabled={!!stage}
            onClick={() => submitWallet()}
            variant="outline"
            className="w-full h-10 bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-300 gap-3 text-white rounded-lg group cursor-pointer shadow-sm relative overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {stage ? (
              <LoaderCircle className="animate-spin text-white" size={16} />
            ) : (
              <Wallet className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
            )}
            <span className="text-xs font-medium tracking-tight">
              {stage || "Continue with Web3 Wallet"}
            </span>
          </Button>
        ) : (
          /* Sign-up Form */
          <form onSubmit={submitWallet} className="space-y-4 text-left">
            {/* Account Type Inline Segmented Picker */}
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-neutral-300 font-medium">
                Account Type
              </Label>
              <div className="inline-flex p-0.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedRole("client")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    selectedRole === "client"
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Briefcase
                    size={13}
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    selectedRole === "freelancer"
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Code2
                    size={13}
                    className={
                      selectedRole === "freelancer"
                        ? "text-indigo-400"
                        : "text-neutral-500"
                    }
                  />
                  Freelancer
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <Label
                htmlFor="auth-name"
                className="text-xs text-neutral-300 font-medium"
              >
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
                className="h-10 bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 text-xs text-white placeholder:text-neutral-500 rounded-lg focus:border-neutral-600 transition-colors"
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
                  className="h-10 bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 text-xs text-white placeholder:text-neutral-500 rounded-lg focus:border-neutral-600 transition-colors"
                />
              </div>
            )}

            {/* Primary Submit Button */}
            <Button
              type="submit"
              disabled={!!stage}
              variant="outline"
              className="w-full h-10 bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-300 gap-3 text-white rounded-lg group cursor-pointer shadow-sm relative overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {stage ? (
                <LoaderCircle className="animate-spin text-white" size={16} />
              ) : (
                <Wallet
                  size={15}
                  className="text-white transition-transform group-hover:scale-110"
                />
              )}
              <span className="text-xs font-medium tracking-tight">
                {stage || `Create ${selectedRole} account with Wallet`}
              </span>
            </Button>
          </form>
        )}
      </div>

      {/* Toggle between Sign In and Sign Up */}
      <div className="text-center text-xs text-neutral-400">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="ml-1 text-white hover:text-neutral-200 font-medium underline underline-offset-4 transition-colors"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </div>
    </div>
  );
}

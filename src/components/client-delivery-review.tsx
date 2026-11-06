"use client";

import { FileCheck2, RefreshCw } from "lucide-react";
import type { Job } from "@/lib/jobs";
import { Button } from "./ui/button";

export type ReviewWalletState = "disconnected" | "wrong-wallet" | "wrong-network" | "ready";

export function ClientDeliveryReview({
  job, walletState, networkName, paymentSymbol, busy, onVerify, onRefresh,
}: {
  job: Pick<Job, "status" | "freelancerName" | "amount">;
  walletState: ReviewWalletState;
  networkName: string;
  paymentSymbol: string;
  busy: boolean;
  onVerify: () => void;
  onRefresh: () => void;
}) {
  if (job.status !== "Funded" && job.status !== "Submitted") return null;
  const submitted = job.status === "Submitted";
  const walletInstruction = {
    disconnected: "Connect your client wallet using the controls below.",
    "wrong-wallet": "Switch to the client wallet linked to this account.",
    "wrong-network": `Switch your wallet to ${networkName} using the controls below.`,
    ready: "",
  }[walletState];
  return (
    <div className="mt-5 space-y-3 rounded-lg border border-border p-4">
      <p className="text-xs font-medium">Work verification</p>
      <p role="status" className={`text-xs ${submitted ? "text-emerald-400" : "text-amber-400"}`}>
        {submitted ? "Submission confirmed — ready for client review" : "Submission not confirmed yet"}
      </p>
      <p className="text-xs leading-6 text-muted-foreground">
        {submitted
          ? `Review the deliverable against the agreed scope. Verifying releases ${job.amount} ${paymentSymbol} to ${job.freelancerName} in the same transaction.`
          : `${job.freelancerName} must sign in with their freelancer wallet, click “Submit work for review” in this job, and confirm the transaction on ${networkName}. Saved delivery notes alone do not complete that submission.`}
      </p>
      {submitted && walletInstruction && <p className="text-xs leading-6 text-amber-400">{walletInstruction}</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onVerify} disabled={!submitted || walletState !== "ready" || busy}>
          <FileCheck2 size={14} /> Verify work &amp; release payment
        </Button>
        <Button variant="outline" onClick={onRefresh} disabled={busy}>
          <RefreshCw size={14} /> Check submission status
        </Button>
      </div>
    </div>
  );
}

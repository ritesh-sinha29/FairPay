"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { AwardCurrency } from "../../convex/lib/arkivAward";
import type { ArkivJobEntity, ArkivProposalEntity } from "@/lib/arkiv";
import { readableError } from "@/lib/ethereum";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

export function AwardProposalButton({ job, proposal }: { job: ArkivJobEntity; proposal: ArkivProposalEntity }) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const deal = useQuery(api.jobs.forArkiv, isAuthenticated ? { entityKey: job.key } : "skip");
  const award = useAction(api.jobs.awardArkivProposal);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState(job.description);
  const [currency, setCurrency] = useState<AwardCurrency | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const proposalKey = proposal.key || proposal.id;

  async function accept(event: React.FormEvent) {
    event.preventDefault();
    if (!currency || busy) return;
    setBusy(true);
    setError("");
    try {
      const jobId = await award({ entityKey: job.key, proposalKey, scope, currency });
      toast.success("Proposal accepted. The deal is now in both workspaces.");
      setOpen(false);
      router.push(`/jobs/${jobId}`);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(false);
    }
  }

  if (deal) {
    return deal.proposalKey === proposalKey.toLowerCase() ? (
      <Button asChild size="sm"><Link href={`/jobs/${deal.jobId}`}>Open deal <ArrowRight size={13} /></Link></Button>
    ) : <Button size="sm" variant="outline" disabled>Another proposal accepted</Button>;
  }

  return (
    <>
      <Button size="sm" disabled={deal === undefined || job.status !== "open"} onClick={() => { setError(""); setOpen(true); }}>
        Accept proposal <ArrowRight size={13} />
      </Button>
      <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Accept {proposal.freelancerName}&apos;s proposal</DialogTitle>
            <DialogDescription>
              Create a deal for {job.title}. The freelancer will receive it in their workspace and confirm the agreement before you fund escrow.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={accept} className="space-y-4">
            <p className="text-sm">Listed amount: <strong>{job.budgetEth}</strong></p>
            <div className="space-y-2">
              <Label htmlFor={`currency-${proposalKey}`}>Payment currency for this deal</Label>
              <select id={`currency-${proposalKey}`} required value={currency} onChange={event => setCurrency(event.target.value as AwardCurrency)} className="w-full rounded-md border border-border bg-background p-2 text-sm">
                <option value="" disabled>Choose the settlement currency</option>
                <option value="arc-usdc">USDC on Arc Testnet</option>
                <option value="sepolia-eth">Test ETH on Sepolia</option>
              </select>
              {currency && <p className="text-xs text-muted-foreground">Agreed payment: {job.budgetEth} {currency === "arc-usdc" ? "USDC on Arc Testnet" : "test ETH on Sepolia"}.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`scope-${proposalKey}`}>Scope and acceptance criteria</Label>
              <Textarea id={`scope-${proposalKey}`} required minLength={20} maxLength={6000} rows={5} value={scope} onChange={event => setScope(event.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !currency || scope.trim().length < 20}>
              {busy && <LoaderCircle size={14} className="animate-spin" />}
              {busy ? "Creating deal…" : "Accept proposal and create deal"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

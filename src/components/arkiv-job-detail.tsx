"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Database,
  ExternalLink,
  LoaderCircle,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "./workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ARKIV_CHAIN_ID,
  ARKIV_EXPLORER_URL,
  type ArkivJobEntity,
} from "@/lib/arkiv";

export function ArkivJobDetail({ entityKey }: { entityKey: string }) {
  const { user, notify } = useWorkspace();
  const [job, setJob] = useState<ArkivJobEntity | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposal State
  const [proposalNote, setProposalNote] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      try {
        // 1. Fetch from server entities API
        const res = await fetch(`/api/arkiv/entities?key=${encodeURIComponent(entityKey)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.entity) {
            setJob(json.entity);
            loadProposals(json.entity.key);
            setLoading(false);
            return;
          }
        }

        // 2. Fallback to localStorage
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("fairpay_arkiv_user_entities");
          const localList: ArkivJobEntity[] = raw ? JSON.parse(raw) : [];
          const found = localList.find(
            (e) => e.key.toLowerCase() === entityKey.toLowerCase(),
          );
          if (found) {
            setJob(found);
            loadProposals(found.key);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not load Arkiv entity:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchJob();
  }, [entityKey]);

  function loadProposals(jobKey: string) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("fairpay_arkiv_proposals");
      const all: any[] = raw ? JSON.parse(raw) : [];
      setProposals(all.filter((p) => p.jobKey === jobKey));
    } catch {}
  }

  function handleProposalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    setSubmittingProposal(true);
    setTimeout(() => {
      setSubmittingProposal(false);
      setProposalSuccess(true);
      try {
        const raw = localStorage.getItem("fairpay_arkiv_proposals");
        const existing = raw ? JSON.parse(raw) : [];
        const newProposal = {
          id: `prop-${Date.now()}`,
          jobKey: job.key,
          jobTitle: job.title,
          freelancerAddress: user?.walletAddress || "0x...",
          freelancerName: user?.name || "Freelancer",
          proposalNote,
          portfolioLink,
          createdAt: Date.now(),
        };
        const updated = [newProposal, ...existing];
        localStorage.setItem("fairpay_arkiv_proposals", JSON.stringify(updated));
        setProposals((prev) => [newProposal, ...prev]);
        notify("Proposal submitted to client!");
      } catch {
        toast.error("Could not save proposal");
      }
    }, 1000);
  }

  function copyText(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  }

  if (loading) {
    return (
      <div className="page-wrap py-20 text-center">
        <LoaderCircle className="mx-auto animate-spin" size={24} />
        <p className="mt-4 text-xs text-muted-foreground">Loading onchain listing…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-wrap py-12">
        <Link
          href="/jobs"
          className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-white"
        >
          <ArrowLeft size={13} /> Back to jobs
        </Link>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center space-y-4">
          <Database className="mx-auto text-blue-400" size={32} />
          <h2 className="text-base font-semibold text-white">Listing Not Found</h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            This job listing may have reached its auto-deletion expiration window or was not indexed yet.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/arkiv">Browse Explore Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isClient = user?.role === "client";
  const isOwner = Boolean(
    user?.walletAddress &&
      (job.clientAddress?.toLowerCase() === user.walletAddress.toLowerCase() ||
        job.owner?.toLowerCase() === user.walletAddress.toLowerCase()),
  );

  return (
    <div className="page-wrap max-w-6xl">
      <Link
        href="/jobs"
        className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft size={13} /> All jobs
      </Link>

      <div className="page-title-row">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="eyebrow">ARKIV DECENTRALIZED RFP</span>
            <span className="text-xs text-neutral-600">·</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Rabdi Testnet ({ARKIV_CHAIN_ID})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{job.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Open for bids
            </span>
            <span className="text-xs text-neutral-500">
              Created {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(window.location.href);
            toast.success("Job link copied to clipboard!");
          }}
          className="text-xs gap-1.5 border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
        >
          <Copy size={13} /> Share job
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        {/* Left Column: Scope, Progress & Bidding */}
        <div className="space-y-6">
          <Card className="border-neutral-800 bg-neutral-950/70">
            <CardHeader>
              <CardTitle className="text-sm text-neutral-200">Agreement progress</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Step indicator */}
              <div className="mb-8 grid grid-cols-5 gap-2">
                {[
                  { label: "1. Published", done: true },
                  { label: "2. Open Bids", done: true },
                  { label: "3. Proposal", done: proposals.length > 0 },
                  { label: "4. Escrow", done: false },
                  { label: "5. Paid", done: false },
                ].map((step, idx) => (
                  <div key={step.label} className="text-center">
                    <span
                      className={`mx-auto grid size-8 place-items-center rounded-full border text-xs font-semibold ${
                        step.done
                          ? "border-blue-500 bg-blue-950 text-blue-200"
                          : "border-neutral-800 bg-neutral-900 text-neutral-500"
                      }`}
                    >
                      {step.done ? <Check size={13} /> : idx + 1}
                    </span>
                    <p className="mt-2 text-[10px] text-neutral-400 font-mono truncate">{step.label}</p>
                  </div>
                ))}
              </div>

              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Scope and expected delivery
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {job.description || "Milestone deliverables and requirements published on Arkiv DB-Chain."}
              </p>

              <div className="mt-7 grid gap-6 border-t border-neutral-800/80 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">
                    Client / Issuer
                  </p>
                  <p className="mt-1 text-xs font-mono text-white truncate">{job.clientAddress}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">Verified onchain creator</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">
                    Assigned Freelancer
                  </p>
                  <p className="mt-1 text-xs text-blue-400 italic">Open for bids (Decentralized RFP)</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{proposals.length} proposal(s) submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action / Next Steps Card */}
          <Card className="border-neutral-800 bg-neutral-950/70">
            <CardHeader>
              <CardTitle className="text-sm text-neutral-200">
                {isOwner ? "Review Proposals & Next Steps" : "Your Next Step"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOwner ? (
                /* Client / Creator View: Review submitted bids */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400">
                      Freelancers who submitted proposals for your listing:
                    </p>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-300 text-[10px]">
                      {proposals.length} Applications
                    </Badge>
                  </div>

                  {proposals.length === 0 ? (
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 text-center space-y-2">
                      <Clock size={20} className="mx-auto text-neutral-500" />
                      <p className="text-xs text-neutral-400 font-medium">Waiting for freelancer bids</p>
                      <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                        Your listing is active on Arkiv DB-Chain. When freelancers apply, their pitches will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {proposals.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-xs">{p.freelancerName}</span>
                            <span className="font-mono text-[10px] text-neutral-500">
                              {p.freelancerAddress?.slice(0, 8)}...{p.freelancerAddress?.slice(-6)}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed">{p.proposalNote}</p>
                          {p.portfolioLink && (
                            <a
                              href={p.portfolioLink.startsWith("http") ? p.portfolioLink : `https://${p.portfolioLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>{p.portfolioLink}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                          <div className="pt-2 flex justify-end">
                            <Button asChild size="sm" className="h-8 text-xs bg-white text-black hover:bg-neutral-200">
                              <Link href={`/jobs/new?freelancer=${encodeURIComponent(p.freelancerAddress)}&amount=${job.budgetEth}&title=${encodeURIComponent(job.title)}`}>
                                Award & Fund Escrow <ArrowRight size={12} className="ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Freelancer View: Pitch & Apply Form */
                <div>
                  {proposalSuccess ? (
                    <div className="py-6 text-center space-y-3">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                      <h4 className="text-sm font-semibold text-white">Proposal Successfully Transmitted!</h4>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                        Your application has been delivered to the client. Once the client approves your proposal, they will lock the escrow deposit onchain.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProposalSuccess(false)}
                        className="text-xs"
                      >
                        Submit another note
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleProposalSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-300">Your Proposal & Pitch</Label>
                        <Textarea
                          rows={3}
                          value={proposalNote}
                          onChange={(e) => setProposalNote(e.target.value)}
                          placeholder="Explain how you will deliver these milestone requirements..."
                          className="bg-neutral-900 border-neutral-800 text-xs text-white"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-300">Portfolio / Github Link</Label>
                        <Input
                          type="text"
                          value={portfolioLink}
                          onChange={(e) => setPortfolioLink(e.target.value)}
                          placeholder="https://github.com/... or portfolio link"
                          className="bg-neutral-900 border-neutral-800 text-xs text-white"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={submittingProposal}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 gap-1.5"
                      >
                        <Sparkles size={13} />
                        {submittingProposal ? "Submitting to client..." : "Apply & Accept Terms"}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Escrow Payment, Attestation & Explorer */}
        <div className="space-y-6">
          <Card className="border-neutral-800 bg-neutral-950/70">
            <CardHeader className="pb-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Agreed Payment
              </span>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl font-bold tracking-tight text-emerald-400">
                  {job.budgetEth}
                </span>
                <span className="text-base font-semibold text-neutral-300">ETH</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2 border-t border-neutral-800/80 pt-3">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Network</span>
                  <span className="text-white font-medium">Arkiv Rabdi Testnet</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Milestone Stages</span>
                  <span className="text-white font-medium">{job.milestonesCount} Stages</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Auto-Pruning</span>
                  <span className="text-amber-400 font-medium">Expires in {job.remainingHours}h</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Your Role</span>
                  <span className="text-white font-medium capitalize">{user?.role || "Visitor"}</span>
                </div>
              </div>

              {/* Onchain Record & Explorer Link */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 text-[10px]">ENTITY KEY</span>
                  <button
                    type="button"
                    onClick={() => copyText(job.key, "Entity Key")}
                    className="text-neutral-400 hover:text-white"
                  >
                    <Copy size={11} />
                  </button>
                </div>
                <p className="text-blue-400 truncate">{job.key}</p>

                {job.txHash && (
                  <div className="pt-2 border-t border-neutral-800">
                    <span className="text-neutral-500 text-[10px] block">ATTESTATION HASH</span>
                    <p className="text-purple-400 truncate">{job.txHash}</p>
                  </div>
                )}
              </div>

              <div className="pt-1 space-y-2">
                <a
                  href={job.txHash ? `${ARKIV_EXPLORER_URL}/tx/${job.txHash}` : `${ARKIV_EXPLORER_URL}/entity/${job.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                >
                  <span>View on Arkiv Explorer</span>
                  <ArrowUpRight size={13} />
                </a>

                <div className="flex items-center gap-2 p-2 rounded bg-neutral-900/40 text-[11px] text-neutral-400 border border-neutral-800/60">
                  <Shield size={14} className="text-emerald-400 shrink-0" />
                  <span>Verified cryptographic state on Arkiv DB-Chain.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

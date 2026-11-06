"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Clock,
  ExternalLink,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Code2,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchArkivJobs,
  buildArkivQuery,
  getExpirationOptions,
  publishJobToArkiv,
  ARKIV_CHAIN_ID,
  ARKIV_EXPLORER_URL,
  ARKIV_WRITER_WALLET,
  type ArkivJobEntity,
} from "@/lib/arkiv";
import { useWorkspace } from "@/components/workspace-provider";

export default function ArkivBoardPage() {
  const { user } = useWorkspace();
  const [entities, setEntities] = useState<ArkivJobEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"arkiv-live" | "arkiv-empty">("arkiv-empty");
  const [rawSql, setRawSql] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("open");
  const [minBudget, setMinBudget] = useState(0);

  // New Job Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("smart-contracts");
  const [newBudget, setNewBudget] = useState("1.5");
  const [newMilestones, setNewMilestones] = useState(2);
  const [newDays, setNewDays] = useState(7);
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchArkivJobs(
        {
          category: category !== "all" ? category : undefined,
          status: status !== "all" ? status : undefined,
          minBudget: minBudget > 0 ? minBudget : undefined,
        },
        user?.walletAddress,
      );

      // Purge any legacy demo cache from browser storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("fairpay_arkiv_local_entities");
      }

      // Load user-published entities
      const localSaved: ArkivJobEntity[] =
        typeof window !== "undefined"
          ? JSON.parse(
              localStorage.getItem("fairpay_arkiv_user_entities") || "[]",
            )
          : [];

      // Filter locally published items matching active filters (reject any legacy dummy items)
      const filteredLocal = localSaved.filter((item) => {
        if (!item || !item.title || item.title === "Arkiv Milestone RFP") return false;
        if (category !== "all" && item.category !== category) return false;
        if (status !== "all" && item.status !== status) return false;
        if (minBudget > 0 && parseFloat(item.budgetEth) < minBudget) return false;
        return true;
      });

      // Merge testnet entities with user items
      const combined = [...filteredLocal, ...res.entities];
      setEntities(combined);
      setRawSql(res.rawQuery);
      setSource(res.source);
    } catch {
      toast.error("Failed to fetch Arkiv entities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [category, status, minBudget]);

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      const created = await publishJobToArkiv({
        title: newTitle,
        category: newCategory,
        budgetEth: newBudget,
        milestonesCount: newMilestones,
        clientAddress: user?.walletAddress,
        description: newDesc,
        days: newDays,
      });

      setEntities((prev) => [created, ...prev]);
      setOpenDialog(false);
      setNewTitle("");
      setNewDesc("");
      toast.success(
        `Job published to Arkiv Rabdi Testnet! Lifetime: ${newDays} days (auto-expiring).`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Error creating Arkiv entity");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-wrap px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16 max-w-7xl mx-auto w-full">
      {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Database className="w-3.5 h-3.5" />
                <span>Arkiv DB-Chain Integration</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-neutral-400 font-normal">Rabdi Testnet (Chain {ARKIV_CHAIN_ID})</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Decentralized & Expiring Escrow RFPs
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Milestone listings live on <strong className="text-neutral-200">Arkiv</strong> with native wallet ownership and time-based expiration.
                When the bidding window closes, entities automatically prune off the query index without orphaned database garbage.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="h-10 bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800 text-white gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Feed</span>
              </Button>

              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="h-10 bg-white hover:bg-neutral-200 text-black font-semibold gap-2 shadow-sm">
                    <Plus className="w-4 h-4" />
                    <span>Post to Arkiv</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-950 border-neutral-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-400" />
                      Publish Milestone RFP to Arkiv
                    </DialogTitle>
                    <DialogDescription className="text-xs text-neutral-400">
                      Stores an ephemeral job entity on Arkiv Rabdi testnet owned by your wallet. Choose an expiration window; Arkiv drops it automatically once the deadline passes.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateJob} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-neutral-300">Project / RFP Title</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. ERC-4337 Account Abstraction Milestone Escrow"
                        className="bg-neutral-900/60 border-neutral-800 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-300">Category</Label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full h-9 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-white px-2.5"
                        >
                          <option value="smart-contracts">Smart Contracts</option>
                          <option value="frontend">Frontend</option>
                          <option value="fullstack">Fullstack</option>
                          <option value="security-audit">Security Audit</option>
                          <option value="design">Design</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-300">Budget (ETH)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.1"
                          value={newBudget}
                          onChange={(e) => setNewBudget(e.target.value)}
                          className="bg-neutral-900/60 border-neutral-800 text-xs text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-neutral-300 flex items-center justify-between">
                        <span>Arkiv Expiration Window (Protocol-Level Pruning)</span>
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {getExpirationOptions().map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setNewDays(opt.value)}
                            className={`p-2 rounded-lg border text-left transition-all ${
                              newDays === opt.value
                                ? "bg-blue-600/20 border-blue-500 text-white font-medium"
                                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                            }`}
                          >
                            <div className="text-xs font-semibold">{opt.value} {opt.value === 1 ? "Day" : "Days"}</div>
                            <div className="text-[10px] text-neutral-500 truncate">{opt.helper.split(".")[1]}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-neutral-300">Description</Label>
                      <textarea
                        rows={3}
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Detail the milestone requirements, deliverables, and acceptance criteria..."
                        className="w-full rounded-md bg-neutral-900/60 border border-neutral-800 text-xs text-white p-2.5 focus:border-neutral-700 outline-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs h-10 mt-2"
                    >
                      {submitting ? "Writing to Arkiv DB-Chain..." : `Sign & Write to Arkiv (${newDays} Days Lifetime)`}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Live SQL-Like Query Bar */}
        <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto text-xs font-mono text-neutral-300">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-sans font-semibold shrink-0 text-[11px]">
              Active Arkiv Query
            </span>
            <code className="text-emerald-400 truncate">
              {rawSql || "SELECT * WHERE status = str('open') ORDER BY expiresAt ASC"}
            </code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyText(rawSql, "Arkiv Query")}
              className="h-8 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Query</span>
            </Button>
            <a
              href={`${ARKIV_EXPLORER_URL}/address/${ARKIV_WRITER_WALLET || user?.walletAddress || ""}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </a>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Category Filter
            </Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-lg bg-neutral-900/70 border border-neutral-800 text-xs text-white px-3"
            >
              <option value="all">All Categories</option>
              <option value="smart-contracts">Smart Contracts</option>
              <option value="frontend">Frontend</option>
              <option value="fullstack">Fullstack</option>
              <option value="security-audit">Security Audit</option>
              <option value="design">Design</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Status Filter
            </Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg bg-neutral-900/70 border border-neutral-800 text-xs text-white px-3"
            >
              <option value="open">Open (Active Bidding)</option>
              <option value="awarded">Awarded</option>
              <option value="all">All Statuses</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Min Budget
            </Label>
            <select
              value={minBudget}
              onChange={(e) => setMinBudget(Number(e.target.value))}
              className="w-full h-9 rounded-lg bg-neutral-900/70 border border-neutral-800 text-xs text-white px-3"
            >
              <option value="0">Any Budget</option>
              <option value="1">At least 1.0 ETH</option>
              <option value="2">At least 2.0 ETH</option>
              <option value="3">At least 3.0 ETH</option>
            </select>
          </div>
        </div>

        {/* Entities Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>Verified Arkiv Entities</span>
              <span className="text-xs font-normal text-neutral-500">
                ({entities.length} results)
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Wallet-Owned & Cryptographically Attested</span>
            </div>
          </div>

          {entities.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                No active entities on Arkiv Rabdi Testnet
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                No open milestone RFPs currently match your query filter. Post an auto-expiring RFP to publish the first listing on Rabdi testnet.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategory("all");
                    setStatus("all");
                    setMinBudget(0);
                  }}
                  className="text-xs bg-neutral-900 border-neutral-800 text-neutral-300"
                >
                  Reset Filters
                </Button>
                <Button
                  size="sm"
                  onClick={() => setOpenDialog(true)}
                  className="text-xs bg-white hover:bg-neutral-200 text-black font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Post to Arkiv
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entities.map((job) => (
                <div
                  key={job.key}
                  className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-5 flex flex-col justify-between hover:border-neutral-700 transition-all duration-200"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category & Expiration Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="capitalize text-[10px] bg-neutral-900 border-neutral-800 text-neutral-300"
                        >
                          {job.category.replace("-", " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${
                            job.status === "open"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          }`}
                        >
                          {job.status}
                        </Badge>
                      </div>

                      {/* Arkiv Expiration Indicator */}
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        <span>Expires in {job.remainingHours}h</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-white leading-snug">
                      {job.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800/60 font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Stats & Keys */}
                  <div className="pt-5 mt-4 border-t border-neutral-900 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-neutral-500 text-[11px] block">Escrow Budget</span>
                        <span className="text-sm font-bold text-white">{job.budgetEth} ETH</span>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-500 text-[11px] block">Milestones</span>
                        <span className="text-sm font-semibold text-neutral-300">{job.milestonesCount} Stages</span>
                      </div>
                    </div>

                    {/* Arkiv Key & Owner */}
                    <div className="bg-neutral-900/60 rounded-lg p-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <div className="flex items-center gap-1.5 truncate mr-2">
                        <span className="text-neutral-500 text-[10px]">KEY:</span>
                        <span className="truncate">{job.key.slice(0, 10)}...{job.key.slice(-8)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(job.key, "Arkiv Entity Key")}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/jobs/new?title=${encodeURIComponent(job.title)}&amount=${job.budgetEth}`}
                        className="flex-1"
                      >
                        <Button className="w-full h-8 text-xs bg-white hover:bg-neutral-200 text-black font-semibold">
                          Create Milestone Escrow
                        </Button>
                      </Link>
                      {job.txHash && (
                        <a
                          href={`${ARKIV_EXPLORER_URL}/tx/${job.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2.5 inline-flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
                          title="View on Arkiv Explorer"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ETHGlobal Mumbai Hackathon Submission Summary Card */}
        <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/10 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>ETHGlobal Mumbai — Arkiv Track Submission & Verification Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
            <div className="space-y-2 p-3.5 rounded-xl bg-black/40 border border-neutral-800/80">
              <span className="text-white font-semibold block">1. Writer Wallet Address</span>
              <code className="text-emerald-400 block font-mono text-[11px] break-all">
                {ARKIV_WRITER_WALLET || user?.walletAddress || "Configured via NEXT_PUBLIC_ARKIV_WRITER_WALLET"}
              </code>
              <p className="text-[11px] text-neutral-400">
                All entities are signed and published on Rabdi testnet with this designated wallet.
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-black/40 border border-neutral-800/80">
              <span className="text-white font-semibold block">2. Runnable Arkiv CLI / SDK Query</span>
              <code className="text-emerald-400 block font-mono text-[11px] break-all">
                client.query("category = str(&apos;smart-contracts&apos;) AND status = str(&apos;open&apos;)")
              </code>
              <p className="text-[11px] text-neutral-400">
                Gas-free typed query executed against Rabdi testnet without requiring a private key.
              </p>
            </div>
          </div>

          {/* Links to Required Documentation Files */}
          <div className="pt-2 border-t border-blue-500/20 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
            <span className="text-white font-medium">Arkiv Submission Files:</span>
            <span className="text-blue-400 hover:underline font-mono">/arkiv/schema.md</span>
            <span className="text-blue-400 hover:underline font-mono">/arkiv/why-arkiv.md</span>
            <span className="text-blue-400 hover:underline font-mono">/arkiv/how-you-use-arkiv.md</span>
            <span className="text-blue-400 hover:underline font-mono">/arkiv/friction.md</span>
            <span className="text-blue-400 hover:underline font-mono">/arkiv/reach.md</span>
          </div>
        </div>
      </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  FileText,
  Compass,
  ChevronDown,
  ChevronUp,
  Briefcase,
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
  fetchArkivProposals,
  buildArkivQuery,
  getExpirationOptions,
  publishJobToArkiv,
  publishProposalToArkiv,
  ARKIV_CHAIN_ID,
  ARKIV_EXPLORER_URL,
  type ArkivJobEntity,
  type ArkivProposalEntity,
} from "@/lib/arkiv";
import { useOptionalWorkspace } from "@/components/workspace-provider";

export default function ArkivBoardPage() {
  const user = useOptionalWorkspace()?.user;
  const [entities, setEntities] = useState<ArkivJobEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const requestId = useRef(0);
  const [rawSql, setRawSql] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("open");
  const [minBudget, setMinBudget] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showTechDetails, setShowTechDetails] = useState(false);

  // New Job Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("smart-contracts");
  const [newBudget, setNewBudget] = useState("1.5");
  const [newMilestones, setNewMilestones] = useState(2);
  const [newDays, setNewDays] = useState(7);
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Proposal / Apply Modal State
  const [applyingJob, setApplyingJob] = useState<ArkivJobEntity | null>(null);
  const [inspectingJob, setInspectingJob] = useState<ArkivJobEntity | null>(null);
  const [proposalNote, setProposalNote] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const [allProposals, setAllProposals] = useState<any[]>([]);

  async function handleProposalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applyingJob) return;
    if (!user?.walletAddress || user.role !== "freelancer") {
      toast.error("Sign in as a freelancer and connect your wallet to apply.");
      return;
    }
    setSubmittingProposal(true);

    try {
      const created = await publishProposalToArkiv({
        jobKey: applyingJob.key,
        jobTitle: applyingJob.title,
        proposalNote,
        portfolioLink,
      });

      setAllProposals((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
      setProposalSuccess(true);
      toast.success("Proposal published directly to Arkiv DB-Chain!");
    } catch (err: any) {
      console.error("Proposal submit error:", err);
      toast.error(err?.message || "Failed to submit proposal to Arkiv");
    } finally {
      setSubmittingProposal(false);
    }
  }

  const loadData = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError("");
    try {
      const jobsRes = await fetchArkivJobs(
        {
          category: category !== "all" ? category : undefined,
          status,
          minBudget: minBudget > 0 ? minBudget : undefined,
        },
        user?.walletAddress,
      );

      if (currentRequest === requestId.current && Array.isArray(jobsRes.entities)) {
        setEntities(jobsRes.entities);
        setRawSql(jobsRes.rawQuery);
      }
    } catch (jErr) {
      console.warn("Arkiv jobs load error:", jErr);
      if (currentRequest === requestId.current) {
        setEntities([]);
        setLoadError("Could not load listings from Arkiv. Please refresh to try again.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [category, status, minBudget, user?.walletAddress]);

  const loadProposals = useCallback(async () => {
    try {
      const proposalsList = await fetchArkivProposals();
      if (Array.isArray(proposalsList)) {
        setAllProposals(proposalsList);
      }
    } catch (pErr) {
      console.warn("Arkiv proposals load error:", pErr);
    }
  }, []);

  useEffect(() => {
    void loadData();
    return () => { requestId.current += 1; };
  }, [loadData]);

  useEffect(() => { void loadProposals(); }, [loadProposals]);

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (user?.role !== "client") {
      toast.error("Only client accounts can post jobs.");
      return;
    }
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
      {!user && <p className="text-sm text-neutral-400">Browse live Arkiv listings. <Link href="/sign-in" className="text-blue-400 underline">Sign in</Link> to post a job or apply.</p>}
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Compass className="w-3.5 h-3.5" />
              <span>Decentralized Escrow Marketplace</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-400 font-normal">Rabdi DB-Chain</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Explore Open Jobs & Escrow RFPs
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Browse open Web3 milestone projects, review proposed budgets, and submit proposals. Listings are recorded on Arkiv with an expiration. A listing does not confirm escrow funding.
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

            {user?.role === "client" && (
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="h-10 bg-white hover:bg-neutral-200 text-black font-semibold gap-2 shadow-sm">
                    <Plus className="w-4 h-4" />
                    <span>Post a Job</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-950 border-neutral-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-400" />
                      Create & Publish Open Job
                    </DialogTitle>
                    <DialogDescription className="text-xs text-neutral-400">
                      Creates an open milestone listing on the decentralized DB-Chain. Set budget, milestones, and custom auto-deletion duration.
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
                        <Label className="text-xs text-neutral-300">Budget (ETH / USDC)</Label>
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-neutral-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>Auto-Deletion Duration</span>
                        </Label>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          Expires in {newDays} {newDays === 1 ? "day" : "days"}
                        </span>
                      </div>

                      {/* Quick presets */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 3, 7, 14, 30].map((daysVal) => (
                          <button
                            key={daysVal}
                            type="button"
                            onClick={() => setNewDays(daysVal)}
                            className={`py-1.5 px-2 rounded-md border text-center transition-all text-xs ${
                              newDays === daysVal
                                ? "bg-blue-600 border-blue-500 text-white font-semibold"
                                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                            }`}
                          >
                            {daysVal}d
                          </button>
                        ))}
                      </div>

                      {/* Custom duration input */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            value={newDays}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(90, Number(e.target.value) || 1));
                              setNewDays(val);
                            }}
                            placeholder="Custom days (1-90)"
                            className="bg-neutral-900/70 border-neutral-800 text-xs text-white h-8.5 pr-12"
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-neutral-400 pointer-events-none">
                            Days
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 shrink-0">
                          (Custom 1-90 days)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-neutral-300">Description & Deliverables</Label>
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
                      {submitting ? "Publishing Job..." : `Publish Job Listing (${newDays} Days Window)`}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search jobs by title, keyword, or skill..."
              className="pl-9 h-9 bg-neutral-900/80 border-neutral-800 text-xs text-white placeholder:text-neutral-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-white px-3"
            >
              <option value="all">All Categories</option>
              <option value="smart-contracts">Smart Contracts</option>
              <option value="frontend">Frontend</option>
              <option value="fullstack">Fullstack</option>
              <option value="security-audit">Security Audit</option>
              <option value="design">Design</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-white px-3"
            >
              <option value="open">Open (Accepting Bids)</option>
              <option value="awarded">Awarded</option>
              <option value="all">All Statuses</option>
            </select>

            <select
              value={minBudget}
              onChange={(e) => setMinBudget(Number(e.target.value))}
              className="h-9 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-white px-3"
            >
              <option value="0">Any Budget</option>
              <option value="1">≥ 1.0 ETH</option>
              <option value="2">≥ 2.0 ETH</option>
              <option value="3">≥ 3.0 ETH</option>
            </select>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="h-9 text-xs text-neutral-400 hover:text-white px-2.5 gap-1 shrink-0"
              title="Toggle Onchain Verification / Technical Details"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Protocol</span>
              {showTechDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Collapsible Tech/Query Details for Developers / Judges */}
        {showTechDetails && (
          <div className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-sans font-medium">
                Live Query
              </span>
              <code className="text-emerald-400 text-[11px] truncate">{rawSql || "SELECT * WHERE status = str('open') ORDER BY expiresAt ASC"}</code>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => copyText(rawSql, "Arkiv Query")}
                className="text-neutral-400 hover:text-white flex items-center gap-1 font-sans text-[11px]"
              >
                <Copy className="w-3 h-3" /> Copy Query
              </button>
              <span className="text-neutral-700">·</span>
              <a
                href={ARKIV_EXPLORER_URL}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-sans text-[11px]"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Entities Grid */}
      {loadError && <p role="alert" className="text-sm text-red-400">{loadError}</p>}
      <div className="space-y-4">
        {(() => {
          const filteredEntities = entities.filter((job) => {
            if (!searchKeyword.trim()) return true;
            const q = searchKeyword.toLowerCase();
            return (
              job.title.toLowerCase().includes(q) ||
              job.description.toLowerCase().includes(q) ||
              job.category.toLowerCase().includes(q) ||
              job.tags.some((t) => t.toLowerCase().includes(q))
            );
          });

          return (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    Open Job Listings
                  </h2>
                  <Badge variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-400 text-xs font-normal">
                    {filteredEntities.length} {filteredEntities.length === 1 ? "job available" : "jobs available"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Listed project budgets</span>
                </div>
              </div>

              {filteredEntities.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-3">
                  <div className="mx-auto w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {loading ? "Loading job listings…" : loadError ? "Listings unavailable" : "No jobs match your filters"}
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Try adjusting your search keywords, budget threshold, or category filter to discover more listings.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategory("all");
                        setStatus("all");
                        setMinBudget(0);
                        setSearchKeyword("");
                      }}
                      className="text-xs bg-neutral-900 border-neutral-800 text-neutral-300"
                    >
                      Reset Filters
                    </Button>
                    {user?.role === "client" && (
                      <Button
                        size="sm"
                        onClick={() => setOpenDialog(true)}
                        className="text-xs bg-white hover:bg-neutral-200 text-black font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Post a Job
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEntities.map((job) => {
                    const isOwner = Boolean(
                      user?.walletAddress &&
                      (job.clientAddress?.toLowerCase() === user.walletAddress.toLowerCase() ||
                       job.owner?.toLowerCase() === user.walletAddress.toLowerCase())
                    );
                    const proposalCount = allProposals.filter(
                      (p: any) => p?.jobKey && p.jobKey.toLowerCase() === job.key.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={job.key}
                        className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-5 flex flex-col justify-between hover:border-neutral-700 transition-all duration-200 space-y-4"
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
                                {job.status === "open" ? "Open for Bids" : job.status}
                              </Badge>
                            </div>

                            {/* Expiration Indicator */}
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              <span>
                                {job.remainingHours >= 24
                                  ? `Expires in ${Math.round(job.remainingHours / 24)}d`
                                  : `Expires in ${job.remainingHours}h`}
                              </span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-semibold leading-snug">
                            <Link
                              href={`/arkiv/${encodeURIComponent(job.key)}`}
                              className="text-white hover:text-blue-300 transition-colors"
                            >
                              {job.title}
                            </Link>
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
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

                        {/* Bottom Stats & Actions */}
                        <div className="pt-4 border-t border-neutral-900 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-neutral-500 text-[11px] block">Escrow Budget</span>
                              <span className="text-sm font-bold text-emerald-400">{job.budgetEth} ETH / USDC</span>
                            </div>
                            <div className="text-right">
                              <span className="text-neutral-500 text-[11px] block">Milestones</span>
                              <span className="text-sm font-semibold text-neutral-300">{job.milestonesCount} Stages</span>
                            </div>
                          </div>

                          {/* Client / Issuer Info */}
                          <div className="bg-neutral-900/60 rounded-lg p-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                            <div className="flex items-center gap-1.5 truncate mr-2">
                              <span className="text-neutral-500 text-[10px]">CLIENT:</span>
                              <span className="truncate">
                                {job.clientAddress
                                  ? `${job.clientAddress.slice(0, 8)}...${job.clientAddress.slice(-6)}`
                                  : "Client address unavailable"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => copyText(job.key, "Arkiv Entity Key")}
                                className="text-neutral-400 hover:text-white transition-colors p-0.5"
                                title="Copy Entity Key"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={job.txHash ? `${ARKIV_EXPLORER_URL}/tx/${job.txHash}` : `${ARKIV_EXPLORER_URL}/entity/${job.key}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-[10px] font-sans font-medium"
                                title="Open onchain record in Arkiv Explorer"
                              >
                                <span>Proof</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            {isOwner ? (
                              <button
                                type="button"
                                onClick={() => setInspectingJob(job)}
                                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-medium transition-colors"
                              >
                                <span>Your Listing • Open for Bids</span>
                                {proposalCount > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-semibold">
                                    {proposalCount}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <Button
                                onClick={() => {
                                  setApplyingJob(job);
                                  setProposalSuccess(false);
                                  setProposalNote("");
                                }}
                                className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5" /> Apply for RFP
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setInspectingJob(job)}
                              className="h-8 px-2.5 text-xs border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 flex items-center gap-1"
                              title="View Full Job Log & Onchain Audit"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span>Log</span>
                            </Button>

                            <a
                              href={job.txHash ? `${ARKIV_EXPLORER_URL}/tx/${job.txHash}` : `${ARKIV_EXPLORER_URL}/entity/${job.key}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-2.5 inline-flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
                              title="Open onchain record in Arkiv Explorer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

        {/* Freelancer Apply Proposal Dialog */}
        <Dialog
          open={Boolean(applyingJob)}
          onOpenChange={(open) => {
            if (!open) setApplyingJob(null);
          }}
        >
          <DialogContent className="sm:max-w-md bg-neutral-950 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Apply for Milestone RFP
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Submit your pitch for{" "}
                <span className="text-white font-medium">
                  {applyingJob?.title}
                </span>
                . Budget: {applyingJob?.budgetEth} USDC / ETH.
              </DialogDescription>
            </DialogHeader>

            {proposalSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-sm font-semibold text-emerald-400">
                  Proposal Submitted!
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your proposal and wallet address have been transmitted to the
                  client. Once the client approves your proposal, the milestone
                  escrow will be locked on Arc Testnet USDC.
                </p>
                <Button
                  onClick={() => {
                    setApplyingJob(null);
                    setProposalSuccess(false);
                  }}
                  className="w-full bg-white hover:bg-neutral-200 text-black text-xs h-9 font-semibold"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleProposalSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-300">
                    Your Proposal & Approach
                  </Label>
                  <textarea
                    rows={4}
                    value={proposalNote}
                    onChange={(e) => setProposalNote(e.target.value)}
                    placeholder="Explain how you will deliver this milestone, your timeline, and why you are the best fit..."
                    required
                    className="w-full rounded-md bg-neutral-900 border border-neutral-800 text-xs text-white p-2.5 outline-none focus:border-neutral-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-300">
                    Portfolio / GitHub Profile
                  </Label>
                  <Input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://github.com/..."
                    className="bg-neutral-900 border-neutral-800 text-xs text-white"
                  />
                </div>
                <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-2.5 text-[11px] text-neutral-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Payment is guaranteed: the client must lock 100% deposit in
                    escrow before you start work.
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={submittingProposal}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9"
                >
                  {submittingProposal
                    ? "Submitting to Client..."
                    : "Send Application"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Job Log & Onchain Record Dialog */}
        <Dialog
          open={Boolean(inspectingJob)}
          onOpenChange={(open) => {
            if (!open) setInspectingJob(null);
          }}
        >
          <DialogContent className="sm:max-w-xl bg-neutral-950 border-neutral-800 text-white p-6">
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Job Lifecycle & Audit Log
                </DialogTitle>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs">
                  Arkiv DB-Chain
                </Badge>
              </div>
              <DialogDescription className="text-xs text-neutral-400">
                Cryptographic attestation and indexing event log on Rabdi Testnet (Chain {ARKIV_CHAIN_ID})
              </DialogDescription>
            </DialogHeader>

            {inspectingJob && (
              <div className="space-y-4 pt-2 text-xs">
                {/* Header Summary */}
                <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-white">{inspectingJob.title}</h4>
                    <span className="font-mono text-emerald-400 font-semibold">{inspectingJob.budgetEth} ETH</span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed">{inspectingJob.description}</p>
                </div>

                {/* Audit Trail & Timestamps */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                    Onchain Timeline & Lifecycle
                  </span>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 space-y-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-neutral-500">Created:</span>
                      <span className="text-white">{new Date(inspectingJob.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-neutral-500">Auto-Pruning Window:</span>
                      <span className="text-amber-400">Expires in {inspectingJob.remainingHours}h ({new Date(inspectingJob.expiresAt).toLocaleDateString()})</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-neutral-500">Client / Issuer:</span>
                      <span className="text-neutral-300 truncate max-w-[240px]">{inspectingJob.clientAddress}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-neutral-500">Arkiv Entity Key:</span>
                      <span className="text-blue-400 truncate max-w-[240px]">{inspectingJob.key}</span>
                    </div>
                    {inspectingJob.txHash && (
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-neutral-500">Transaction Hash:</span>
                        <span className="text-purple-400 truncate max-w-[240px]">{inspectingJob.txHash}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitted Proposals Log */}
                {(() => {
                  const proposals = allProposals.filter(
                    (p: any) => p?.jobKey && p.jobKey.toLowerCase() === inspectingJob.key.toLowerCase()
                  );

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                          Received Proposals / Bids
                        </span>
                        <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-400">
                          {proposals.length} Submitted
                        </Badge>
                      </div>

                      {proposals.length === 0 ? (
                        <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 text-center text-neutral-500 text-xs">
                          No proposals submitted yet. Listing is currently open for freelancer bids.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {proposals.map((p: any) => (
                            <div key={p.id} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white">{p.freelancerName}</span>
                                <span className="text-[10px] text-neutral-500">{new Date(p.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-neutral-400 text-xs">{p.proposalNote}</p>
                              {p.portfolioLink && (
                                <a
                                  href={p.portfolioLink.startsWith("http") ? p.portfolioLink : `https://${p.portfolioLink}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 hover:underline text-[10px] flex items-center gap-1"
                                >
                                  {p.portfolioLink} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Direct External Redirect Links */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-neutral-900">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyText(inspectingJob.key, "Entity Key")}
                    className="w-full sm:w-auto text-xs border-neutral-800 bg-neutral-900 text-neutral-300 gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Entity Key
                  </Button>
                  <a
                    href={inspectingJob.txHash ? `${ARKIV_EXPLORER_URL}/tx/${inspectingJob.txHash}` : `${ARKIV_EXPLORER_URL}/entity/${inspectingJob.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <span>View on Arkiv Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Collapsible Architecture & Track Details */}
      <div className="pt-6 border-t border-neutral-900">
        <button
          type="button"
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-2 transition-colors mx-auto py-2 px-3 rounded-lg hover:bg-neutral-900/60"
        >
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>Protocol Architecture & Track Verification Details</span>
          {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTechDetails && (
          <div className="mt-4 p-6 rounded-2xl border border-blue-500/20 bg-blue-950/10 space-y-4">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>ETHGlobal Mumbai — Arkiv Track Submission & Verification Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
              <div className="space-y-2 p-3.5 rounded-xl bg-black/40 border border-neutral-800/80">
                <span className="text-white font-semibold block">1. On-chain Entity Owners</span>
                <code className="text-emerald-400 block font-mono text-[11px] break-all">
                  {entities.length ? [...new Set(entities.map((job) => job.owner))].join(", ") : "No live listing owners to display"}
                </code>
                <p className="text-[11px] text-neutral-400">
                  These addresses come from the live records returned by Arkiv.
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
        )}
      </div>
      </div>
  );
}

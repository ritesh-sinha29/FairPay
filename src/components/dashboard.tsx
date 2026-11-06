"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatUnits } from "ethers";
import { paymentNetwork } from "@/lib/payments";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleCheck,
  Clock3,
  Database,
  Download,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "./workspace-provider";
import { StatusBadge } from "./status-badge";
import { jobUrl } from "@/lib/jobs";
import { fetchArkivJobs, type ArkivJobEntity } from "@/lib/arkiv";

export function Dashboard({
  view,
}: {
  view: "overview" | "escrows" | "payments";
}) {
  const { user, jobs, ready, refresh, refreshing } = useWorkspace();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const isClient = user.role === "client";
  const [userArkivJobs, setUserArkivJobs] = useState<ArkivJobEntity[]>([]);

  async function loadArkivListings() {
    try {
      // Fetch live entities directly from Arkiv DB-Chain
      const res = await fetchArkivJobs({}, user?.walletAddress);

      const seen = new Set<string>();
      const myJobs = (res.entities || []).filter((item) => {
        if (!item || !item.title || item.title === "Arkiv Milestone RFP") return false;
        const key = item.key || item.title;
        if (seen.has(key.toLowerCase())) return false;
        seen.add(key.toLowerCase());

        if (!user?.walletAddress) return true;
        const w = user.walletAddress.toLowerCase();
        return (
          item.clientAddress?.toLowerCase() === w ||
          item.owner?.toLowerCase() === w
        );
      });

      setUserArkivJobs(myJobs);
    } catch (e) {
      console.warn("Could not load Arkiv listings:", e);
    }
  }

  useEffect(() => {
    void loadArkivListings();
  }, [user?.walletAddress, ready]);

  async function handleRefresh() {
    await Promise.allSettled([refresh(), loadArkivListings()]);
  }
  const funded = jobs.filter((job) =>
    ["Funded", "Submitted"].includes(job.status),
  );
  const paid = jobs.filter((job) => job.status === "Paid");
  const review = jobs.filter((job) => job.status === "Submitted");
  const total = (items: typeof jobs) => {
    const networks = [...new Set(items.map((job) => job.chainId))];
    if (!networks.length) return "0 USDC";
    return networks
      .map((id) => {
        const network = paymentNetwork(id);
        const amount = items
          .filter((job) => job.chainId === id)
          .reduce((sum, job) => sum + BigInt(job.amountWei), 0n);
        return `${formatUnits(amount, network.decimals)} ${network.symbol}`;
      })
      .join(" · ");
  };
  const actionJob = jobs.find((job) =>
    isClient
      ? job.status === "Submitted" || job.status === "Draft"
      : job.status === "Funded" || (job.status === "Draft" && !job.acceptedAt),
  );
  const records = view === "payments" ? paid : jobs;
  const filtered = records.filter(
    (job) =>
      (filter === "All" || job.status === filter) &&
      `${job.title} ${job.clientName} ${job.freelancerName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const filteredArkiv = userArkivJobs.filter(
    (item) =>
      (filter === "All" || filter === "Open RFP") &&
      view !== "payments" &&
      `${item.title} ${item.category} ${item.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  function exportPayments() {
    const cell = (value: string) =>
      `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
    const csv = [
      "Job,Amount,Currency,Network,Client,Freelancer,Contract",
      ...filtered.map((job) =>
        [
          job.title,
          job.amount,
          paymentNetwork(job.chainId).symbol,
          paymentNetwork(job.chainId).name,
          job.clientName,
          job.freelancerName,
          job.contractAddress ?? "",
        ]
          .map(cell)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fairpay-payments.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    {
      label: "Funds in escrow",
      value: total(funded),
      detail: `${funded.length} active jobs`,
      icon: LockKeyhole,
    },
    {
      label: "Your jobs",
      value: String(jobs.length + (isClient ? userArkivJobs.length : 0)).padStart(2, "0"),
      detail: isClient
        ? userArkivJobs.length > 0
          ? `${jobs.length} agreement(s) · ${userArkivJobs.length} Arkiv RFP(s)`
          : "Created by you"
        : "Assigned to you",
      icon: BriefcaseBusiness,
    },
    {
      label: "Awaiting review",
      value: String(review.length).padStart(2, "0"),
      detail: isClient ? "Ready for verification" : "Waiting for the client",
      icon: Clock3,
    },
    {
      label: isClient ? "Payments released" : "Payments received",
      value: total(paid),
      detail: `${paid.length} completed jobs`,
      icon: Wallet,
    },
  ];

  return (
    <div className="page-wrap">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">
            {isClient ? "CLIENT WORKSPACE" : "FREELANCER WORKSPACE"}
          </p>
          <h1>
            {view === "overview"
              ? `Welcome, ${user.name.split(" ")[0]}`
              : view === "payments"
                ? "Payment history"
                : isClient
                  ? "Your jobs"
                  : "Your assigned jobs"}
            <span className="text-blue-400">.</span>
          </h1>
          <p className="page-description">
            {view === "overview"
              ? isClient
                ? "Fund a job, review the delivery, and pay your freelancer."
                : "See your funded jobs, share your work, and track payment."
              : "Your job records update across devices through Convex."}
          </p>
        </div>
        {view === "payments" ? (
          <Button variant="outline" onClick={exportPayments}>
            <Download size={15} /> Export CSV
          </Button>
        ) : (
          isClient && (
            <Button asChild>
              <Link href="/jobs/new">
                <Plus size={15} /> Create job
              </Link>
            </Button>
          )
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="gap-0 py-5">
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {label}
                <Icon size={16} />
              </div>
              {ready ? (
                <p className="mt-5 text-2xl font-medium tracking-tight">
                  {value}
                </p>
              ) : (
                <Skeleton className="mt-5 h-8 w-24" />
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {view === "overview" && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card className="border-blue-900/50 bg-blue-950/15">
            <CardContent>
              <p className="text-xs font-medium text-blue-300">
                How your payments work
              </p>
              <ol className="mt-5 space-y-4 text-xs leading-6">
                <li>
                  <strong>1. Both agree on the job.</strong> The client then
                  locks the payment in escrow.
                </li>
                <li>
                  <strong>2. Freelancer delivers the work.</strong> Add the
                  delivery link and confirm submission.
                </li>
                <li>
                  <strong>3. Client verifies the work.</strong> Verification
                  releases the deposit to the freelancer.
                </li>
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="text-sm font-medium">Your next step</h2>
              {actionJob ? (
                <>
                  <StatusBadge
                    status={actionJob.status}
                    acceptedAt={actionJob.acceptedAt}
                  />
                  <h3 className="mt-4 text-base font-medium">
                    {actionJob.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {actionJob.status === "Draft"
                      ? actionJob.acceptedAt
                        ? "The deal is agreed. Lock the payment so your freelancer can begin."
                        : isClient
                          ? "Waiting for the freelancer to agree on the job and payment."
                          : "Review the job proposal and agree to the scope and payment."
                      : actionJob.status === "Submitted"
                        ? "Verify the delivery to release payment automatically."
                        : "The deposit is funded. Complete and submit your work."}
                  </p>
                  <Button asChild variant="outline" className="mt-5" size="sm">
                    <Link href={jobUrl(actionJob)}>
                      Open job <ArrowRight size={14} />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="py-7 text-center text-muted-foreground">
                  <CircleCheck className="mx-auto text-emerald-400" size={24} />
                  <p className="mt-3 text-xs">You’re all caught up.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {isClient && userArkivJobs.length > 0 && view !== "payments" && (
        <section className="mt-8 rounded-xl border border-blue-950/40 bg-blue-950/10 p-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Your Arkiv DB-Chain RFPs</h2>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px]">
                  {userArkivJobs.length} Live on Rabdi
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                Open decentralized milestone RFPs indexed on Arkiv. Freelancers can view and submit proposals.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-neutral-800 self-start sm:self-auto">
              <Link href="/arkiv">
                Manage on Arkiv Board <ArrowRight size={13} />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userArkivJobs.map((item) => (
              <div
                key={item.key}
                className="rounded-lg border border-neutral-800/80 bg-neutral-900/60 p-4 space-y-2.5 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-white line-clamp-1">{item.title}</h4>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Open for bids
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {item.description || "Milestone deliverable requirements on Arkiv DB-Chain."}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-[11px]">
                  <span className="font-mono text-emerald-300 font-semibold">
                    {item.budgetEth} ETH / USDC
                  </span>
                  <Link
                    href={`/arkiv/${encodeURIComponent(item.key)}`}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    View agreement <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="mt-9">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">
              {view === "payments"
                ? "Released payments"
                : isClient && userArkivJobs.length > 0
                  ? "Job agreements & RFPs"
                  : "Job agreements"}{" "}
              <span className="ml-2 text-muted-foreground">
                {records.length + (view !== "payments" ? userArkivJobs.length : 0)}
              </span>
            </h2>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Account records sync live. Refresh verifies payment statuses
              onchain.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
        <div className="mb-4 flex flex-wrap justify-between gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {(view === "payments"
                ? ["All"]
                : [
                    "All",
                    "Draft",
                    "Funded",
                    "Submitted",
                    "Paid",
                    ...(userArkivJobs.length > 0 ? ["Open RFP"] : []),
                  ]
              ).map((status) => (
                <TabsTrigger key={status} value={status} className="text-xs">
                  {status === "Draft"
                    ? "Agreement"
                    : status === "Submitted"
                      ? "In review"
                      : status === "Open RFP"
                        ? "Arkiv RFPs"
                        : status}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative min-w-45">
            <Search
              className="absolute top-2.5 left-3 text-muted-foreground"
              size={14}
            />
            <Input
              className="h-9 pl-9 text-xs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your jobs"
              aria-label="Search jobs"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>{isClient ? "Freelancer" : "Client"}</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Created</th>
                <th>
                  <span className="sr-only">Open job</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link
                      className="font-medium hover:text-blue-300"
                      href={jobUrl(job)}
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">
                    {isClient ? job.freelancerName : job.clientName}
                  </td>
                  <td className="whitespace-nowrap">
                    {job.amount}{" "}
                    <span className="text-muted-foreground">
                      {paymentNetwork(job.chainId).symbol}
                    </span>
                  </td>
                  <td>
                    <StatusBadge
                      status={job.status}
                      acceptedAt={job.acceptedAt}
                    />
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td>
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link href={jobUrl(job)} aria-label={`Open ${job.title}`}>
                        <ArrowUpRight size={15} />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredArkiv.map((item) => (
                <tr
                  key={item.key || item.title}
                  className="bg-blue-950/5 hover:bg-blue-950/15 transition-colors"
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <Database size={13} className="text-blue-400 shrink-0" />
                      <Link
                        className="font-medium hover:text-blue-300"
                        href={`/arkiv/${encodeURIComponent(item.key)}`}
                      >
                        {item.title}
                      </Link>
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px] py-0 px-1.5"
                      >
                        Arkiv RFP
                      </Badge>
                    </div>
                  </td>
                  <td className="text-muted-foreground italic text-xs">
                    Open for bids
                  </td>
                  <td className="whitespace-nowrap font-medium text-emerald-400">
                    {item.budgetEth}{" "}
                    <span className="text-muted-foreground font-normal">
                      ETH
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-blue-500/30 bg-blue-500/10 text-blue-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      Open RFP
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={item.txHash ? `https://rabdi.explorer.arkiv.network/tx/${item.txHash}` : `https://rabdi.explorer.arkiv.network/entity/${item.key}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-7 px-2 rounded border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white text-[10px] gap-1 transition-colors"
                        title="View onchain log in Arkiv Explorer"
                      >
                        <span>Log</span>
                        <ArrowUpRight size={12} />
                      </a>
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link
                          href={`/arkiv/${encodeURIComponent(item.key)}`}
                          aria-label={`Open Arkiv RFP ${item.title}`}
                        >
                          <ArrowRight size={14} />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!ready || (!filtered.length && !filteredArkiv.length)) && (
            <div className="px-5 py-14 text-center">
              <BriefcaseBusiness
                className="mx-auto mb-4 text-muted-foreground"
                size={25}
              />
              <h3 className="text-sm font-medium">
                {!ready
                  ? "Loading your jobs…"
                  : search
                    ? "No jobs match your search"
                    : view === "payments"
                      ? "Your completed payments will appear here"
                      : isClient
                        ? "Create your first job"
                        : "Your next project starts here"}
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-xs leading-6 text-muted-foreground">
                {isClient
                  ? "Choose a registered freelancer, describe the work, and fund the agreement."
                  : "A client can assign a job to your registered wallet. It will appear here automatically."}
              </p>
              {ready && isClient && (
                <Button asChild size="sm" className="mt-5">
                  <Link href="/jobs/new">
                    <Plus size={14} /> Create job
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

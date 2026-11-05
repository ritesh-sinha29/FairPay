"use client";
import Link from "next/link";
import { useState } from "react";
import { formatUnits } from "ethers";
import { paymentNetwork } from "@/lib/payments";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleCheck,
  Clock3,
  Download,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "./workspace-provider";
import { StatusBadge } from "./status-badge";
import { jobUrl } from "@/lib/jobs";

export function Dashboard({
  view,
}: {
  view: "overview" | "escrows" | "payments";
}) {
  const { user, jobs, ready, refresh, refreshing } = useWorkspace();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const isClient = user.role === "client";
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
      value: String(jobs.length).padStart(2, "0"),
      detail: isClient ? "Created by you" : "Assigned to you",
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
      <section className="mt-9">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">
              {view === "payments" ? "Released payments" : "Job agreements"}{" "}
              <span className="ml-2 text-muted-foreground">
                {records.length}
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
            onClick={() => void refresh()}
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
                : ["All", "Draft", "Funded", "Submitted", "Paid"]
              ).map((status) => (
                <TabsTrigger key={status} value={status} className="text-xs">
                  {status === "Draft"
                    ? "Agreement"
                    : status === "Submitted"
                      ? "In review"
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
            </tbody>
          </table>
          {(!ready || !filtered.length) && (
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

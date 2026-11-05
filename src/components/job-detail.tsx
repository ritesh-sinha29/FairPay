"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useWorkspace } from "./workspace-provider";
import {
  advanceJob,
  fundJob,
  readableError,
  switchToPaymentNetwork,
} from "@/lib/ethereum";
import { STATUS_ORDER } from "@/lib/jobs";
import { ARC_TESTNET, paymentNetwork } from "@/lib/payments";
import { agreementHash } from "@/lib/agreement";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function JobDetail({ jobId }: { jobId: string }) {
  const { user, jobs, ready, account, chainId, connect, notify } =
    useWorkspace();
  const job = jobs.find((item) => item.id === jobId);
  const reserve = useMutation(api.jobs.reserveFunding);
  const acceptAgreement = useMutation(api.jobs.accept);
  const recordFunding = useMutation(api.jobs.recordFunding);
  const releaseReservation = useMutation(api.jobs.releaseReservation);
  const saveDelivery = useMutation(api.jobs.submitDelivery);
  const synchronize = useAction(api.escrow.sync);
  const resetFailedFunding = useAction(api.escrow.resetFailedFunding);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [recoveryHash, setRecoveryHash] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [now, setNow] = useState(Date.now());
  const lock = useRef(false);
  useEffect(() => {
    setNote(job?.submissionNote ?? "");
    setUrl(job?.deliverableUrl ?? "");
  }, [job?.submissionNote, job?.deliverableUrl]);
  useEffect(() => {
    if (!job?.reservationExpiresAt) return;
    const timeout = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, job.reservationExpiresAt - Date.now()) + 100,
    );
    return () => clearTimeout(timeout);
  }, [job?.reservationExpiresAt]);

  async function accept() {
    if (!job || lock.current) return;
    lock.current = true;
    setStage("Confirming your agreement…");
    setError("");
    try {
      await acceptAgreement({ jobId: job.id });
      notify("Deal agreed. The client can now lock the payment in escrow.");
    } catch (error) {
      setError(readableError(error));
    } finally {
      lock.current = false;
      setStage("");
    }
  }

  async function sync() {
    if (!job || lock.current) return;
    lock.current = true;
    setStage("Verifying the contract…");
    setError("");
    try {
      await synchronize({
        jobId: job.id,
        ...(job.status === "Draft" && (recoveryHash || transactionHash)
          ? { fundingHash: recoveryHash || transactionHash }
          : {}),
      });
      notify("Job status verified against its payment network.");
    } catch (error) {
      setError(readableError(error));
    } finally {
      lock.current = false;
      setStage("");
    }
  }

  async function resetFunding() {
    if (!job || lock.current) return;
    lock.current = true;
    setStage("Checking the failed funding attempt…");
    setError("");
    try {
      await resetFailedFunding({ jobId: job.id });
      setTransactionHash("");
      setRecoveryHash("");
      notify("Failed funding attempt cleared. You can fund this job again.");
    } catch (error) {
      setError(readableError(error));
    } finally {
      lock.current = false;
      setStage("");
    }
  }

  async function fund() {
    if (!job || lock.current) return;
    lock.current = true;
    setError("");
    setStage("Preparing the funding request…");
    const token = crypto.randomUUID();
    let sent = false;
    try {
      if (!job.contractAddress) await reserve({ jobId: job.id, token });
      setStage("Confirm the deposit in your wallet…");
      const hash = await fundJob(
        job,
        async (hash) => {
          sent = true;
          setTransactionHash(hash);
          setStage("Waiting for the deposit to confirm…");
          await recordFunding({ jobId: job.id, token, hash });
        },
        (message, hash) => {
          setStage(message);
          if (hash) setTransactionHash(hash);
        },
      );
      setStage("Verifying funding with the backend…");
      await synchronize({ jobId: job.id, fundingHash: hash });
      notify("Your job is funded. The freelancer can begin work.");
    } catch (error) {
      setError(readableError(error));
      // Persist a deployed but unfunded escrow so the same contract can be resumed.
      if (sent || job.contractAddress)
        await synchronize({ jobId: job.id }).catch(() => undefined);
      if (!sent)
        await releaseReservation({ jobId: job.id, token }).catch(
          () => undefined,
        );
    } finally {
      lock.current = false;
      setStage("");
    }
  }

  async function advance() {
    if (!job || lock.current) return;
    lock.current = true;
    setError("");
    try {
      if (job.status === "Funded") {
        setStage("Saving your delivery…");
        await saveDelivery({ jobId: job.id, note, url });
      }
      setStage(
        job.status === "Funded"
          ? "Confirm the submission in your wallet…"
          : "Confirm work verification in your wallet…",
      );
      await advanceJob(job, (hash) => {
        setTransactionHash(hash);
        setStage("Waiting for confirmation…");
      });
      setStage("Verifying the updated contract…");
      await synchronize({ jobId: job.id });
      notify(
        job.status === "Funded"
          ? "Work submitted for client review."
          : "Work verified. Payment released to the freelancer.",
      );
    } catch (error) {
      setError(readableError(error));
    } finally {
      lock.current = false;
      setStage("");
    }
  }

  if (!ready)
    return (
      <div className="page-wrap py-20 text-center">
        <LoaderCircle className="mx-auto animate-spin" size={24} />
        <p className="mt-4 text-xs text-muted-foreground">Loading your job…</p>
      </div>
    );
  if (!job)
    return (
      <div className="page-wrap">
        <Alert>
          <AlertDescription>
            This job is unavailable for your account. Sign in with the assigned
            client or freelancer wallet.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/jobs">Your jobs</Link>
        </Button>
      </div>
    );
  const client = user.role === "client";
  const busy = !!stage;
  const matchingWallet = account.toLowerCase() === user.walletAddress;
  const network = paymentNetwork(job.chainId);
  const correctNetwork = chainId === job.chainId;
  const canTransact = matchingWallet && correctNetwork && !busy;
  const pendingFunding =
    job.status === "Draft" &&
    !job.contractAddress &&
    (job.fundingHash || transactionHash);
  const reserved =
    !pendingFunding &&
    job.fundingReservation &&
    (job.reservationExpiresAt ?? 0) > now;
  const step =
    job.status === "Draft"
      ? job.acceptedAt
        ? 1
        : 0
      : STATUS_ORDER.indexOf(job.status) + 1;

  return (
    <div className="page-wrap">
      <Link
        href="/jobs"
        className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={13} /> All jobs
      </Link>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">JOB AGREEMENT</p>
          <h1>{job.title}</h1>
          <StatusBadge status={job.status} acceptedAt={job.acceptedAt} />
        </div>
        <Button
          variant="outline"
          onClick={() =>
            void navigator.clipboard
              .writeText(location.href)
              .then(() =>
                notify(
                  "Job link copied. The assigned freelancer or client can open it after signing in.",
                ),
              )
              .catch(() =>
                notify("Copy the job URL from your browser’s address bar."),
              )
          }
        >
          <Copy size={14} /> Share job
        </Button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agreement progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8 grid grid-cols-5 gap-2">
                {["Proposed", "Agreed", "Funded", "In review", "Paid"].map(
                  (label, index) => (
                    <div key={label} className="text-center">
                      <span
                        className={`mx-auto grid size-8 place-items-center rounded-full border text-xs ${index <= step ? "border-blue-800 bg-blue-950 text-blue-200" : "border-border text-muted-foreground"}`}
                      >
                        {index <= step ? <Check size={13} /> : index + 1}
                      </span>
                      <p className="mt-3 text-[10px] text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ),
                )}
              </div>
              <h3 className="mb-3 text-xs font-medium">
                Scope and expected delivery
              </h3>
              <p className="job-description">{job.description}</p>
              <div className="mt-7 grid gap-6 border-t pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Client
                  </p>
                  <p className="mt-2 text-xs">{job.clientName}</p>
                  <p className="address-text mt-2 text-muted-foreground">
                    {job.client}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Freelancer
                  </p>
                  <p className="mt-2 text-xs">{job.freelancerName}</p>
                  <p className="address-text mt-2 text-muted-foreground">
                    {job.freelancer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {job.submissionNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Freelancer’s delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="job-description">{job.submissionNote}</p>
                {job.deliverableUrl && (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <a
                      href={job.deliverableUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open deliverable <ExternalLink size={13} />
                    </a>
                  </Button>
                )}
                <p className="mt-4 text-[10px] leading-6 text-muted-foreground">
                  Delivery notes are stored in Convex. The job status changes
                  after the submission transaction is confirmed and verified.
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {job.status === "Paid" ? "Job completed" : "Your next step"}
              </CardTitle>
              {job.contractAddress && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void sync()}
                  disabled={busy}
                  aria-label="Verify current job status"
                >
                  <RefreshCw size={14} />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {job.status === "Paid" ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-500/10 p-2 text-emerald-300">
                      <Check size={21} />
                    </span>
                    <div>
                      <h3 className="text-base font-medium">
                        Payment released
                      </h3>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        The agreed {job.amount} {network.symbol} has been
                        released to {job.freelancerName}.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {!account ? (
                    <Button variant="outline" onClick={() => void connect()}>
                      <Wallet size={14} /> Connect your wallet
                    </Button>
                  ) : !matchingWallet ? (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">
                        Switch to the wallet linked to this account.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    !correctNetwork && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          void switchToPaymentNetwork(job.chainId).catch(
                            (error) => setError(readableError(error)),
                          )
                        }
                      >
                        Switch wallet to {network.name} <ArrowRight size={14} />
                      </Button>
                    )
                  )}
                  {job.status === "Draft" && (
                    <>
                      <p className="text-xs leading-7 text-muted-foreground">
                        {job.acceptedAt
                          ? client
                            ? "The deal is agreed. Lock the agreed payment in escrow before the freelancer starts work."
                            : "You agreed to this job. The client will now lock the payment in escrow before work begins."
                          : client
                            ? "Your proposal is waiting for the freelancer to agree on the scope and payment. You can fund the escrow once they accept."
                            : "Review the scope, client, and payment above. Agree to the job to close the deal. The client will then lock the payment in escrow."}
                      </p>
                      {client &&
                        job.acceptedAt &&
                        job.chainId === ARC_TESTNET.chainId && (
                          <Alert>
                            <AlertDescription className="text-xs leading-6">
                              {job.contractAddress
                                ? "Your escrow is created, but payment is not locked yet. Continue funding on this same contract."
                                : `Funding uses wallet transactions: create the escrow, allow the exact ${job.paymentAsset ?? "token"} amount, then lock the deposit. Work begins only after the deposit confirms.`}
                            </AlertDescription>
                          </Alert>
                        )}
                      {!client && !job.acceptedAt && (
                        <Button onClick={() => void accept()} disabled={busy}>
                          <Check size={14} /> Agree to job
                        </Button>
                      )}
                      {client &&
                        job.acceptedAt &&
                        !pendingFunding &&
                        !reserved && (
                          <Button
                            onClick={() => void fund()}
                            disabled={!canTransact}
                          >
                            <LockKeyhole size={14} />{" "}
                            {job.contractAddress
                              ? "Continue funding"
                              : "Fund job with"}{" "}
                            {job.amount} {network.symbol}
                          </Button>
                        )}
                      {reserved && (
                        <Alert>
                          <AlertDescription className="text-xs leading-6">
                            A funding request is open. Finish it in the original
                            tab. An unsigned request expires at{" "}
                            {new Date(
                              job.reservationExpiresAt!,
                            ).toLocaleTimeString()}
                            .
                          </AlertDescription>
                        </Alert>
                      )}
                      {client &&
                        !job.contractAddress &&
                        (job.acceptedAt || pendingFunding) && (
                          <div className="rounded-lg border p-4">
                            <h3 className="text-xs font-medium">
                              {pendingFunding
                                ? "Check your funding transaction"
                                : "Already sent a deposit?"}
                            </h3>
                            <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                              Paste the confirmed contract-creation transaction
                              hash to recover funding. Check an existing deposit
                              before sending another.
                            </p>
                            <Input
                              className="mt-3 text-xs"
                              aria-label="Funding transaction hash"
                              placeholder={
                                job.fundingHash || transactionHash || "0x…"
                              }
                              value={recoveryHash}
                              onChange={(event) =>
                                setRecoveryHash(event.target.value)
                              }
                              disabled={busy}
                            />
                            <Button
                              variant="outline"
                              className="mt-3"
                              size="sm"
                              onClick={() => void sync()}
                              disabled={
                                busy || !(recoveryHash || pendingFunding)
                              }
                            >
                              Verify funding
                            </Button>
                            {job.fundingHash && (
                              <Button
                                variant="ghost"
                                className="mt-3 ml-2"
                                size="sm"
                                onClick={() => void resetFunding()}
                                disabled={busy}
                              >
                                Reset failed attempt
                              </Button>
                            )}
                          </div>
                        )}
                    </>
                  )}
                  {job.status === "Funded" &&
                    (client ? (
                      <p className="text-xs leading-7 text-muted-foreground">
                        The deposit is funded. {job.freelancerName} can now work
                        on the job and submit their delivery.
                      </p>
                    ) : (
                      <form
                        className="space-y-4"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void advance();
                        }}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="delivery-url">Deliverable link</Label>
                          <Input
                            id="delivery-url"
                            type="url"
                            pattern="https://.*"
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            placeholder="https://…"
                            required
                            disabled={busy}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delivery-note">
                            What did you deliver?
                          </Label>
                          <Textarea
                            id="delivery-note"
                            minLength={10}
                            maxLength={4000}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={4}
                            placeholder="Explain the delivery and how the client can review it."
                            required
                            disabled={busy}
                          />
                        </div>
                        <Button disabled={!canTransact}>
                          <FileCheck2 size={14} /> Submit work for review
                        </Button>
                      </form>
                    ))}
                  {job.status === "Submitted" &&
                    (client ? (
                      <>
                        <p className="text-xs leading-7 text-muted-foreground">
                          Verify the freelancer’s delivery above. This action
                          releases the full {job.amount} {network.symbol}{" "}
                          deposit to {job.freelancerName}.
                        </p>
                        <Button
                          onClick={() => void advance()}
                          disabled={!canTransact}
                        >
                          <FileCheck2 size={14} /> Verify work & release payment
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs leading-7 text-muted-foreground">
                        Your work is submitted. The client can review the
                        delivery. Payment is released when the client verifies
                        the work.
                      </p>
                    ))}
                </>
              )}
              {busy && (
                <div
                  className="flex items-center gap-2 text-xs text-blue-300"
                  role="status"
                >
                  <LoaderCircle className="animate-spin" size={15} />
                  {stage}
                </div>
              )}
              {job.chainId === ARC_TESTNET.chainId && (
                <div className="mt-6 border-t pt-5">
                  <p className="text-xs font-medium">
                    Agreed terms fingerprint
                  </p>
                  <p className="address-text mt-2 text-muted-foreground">
                    {agreementHash(job)}
                  </p>
                  <p className="mt-2 text-[10px] leading-6 text-muted-foreground">
                    The escrow commits to this job’s scope, parties, payment,
                    and network.
                  </p>
                  {job.paymentAsset === "USDC" && (
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-xs text-blue-300"
                      href="https://faucet.circle.com"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get test USDC <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs leading-6">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              {transactionHash && (
                <a
                  className="inline-flex items-center gap-2 text-xs text-blue-300"
                  href={`${network.explorerUrl}/tx/${transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View latest transaction <ExternalLink size={12} />
                </a>
              )}
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-5">
          <Card>
            <CardContent>
              <LockKeyhole size={25} className="mb-6 text-blue-300" />
              <p className="eyebrow">
                {job.status === "Draft"
                  ? job.acceptedAt
                    ? "AGREED PAYMENT"
                    : "PROPOSED PAYMENT"
                  : job.status === "Paid"
                    ? "PAYMENT RELEASED"
                    : "SECURED DEPOSIT"}
              </p>
              <p className="text-3xl font-medium tracking-tight">
                {job.amount}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {network.symbol}
                </span>
              </p>
              <div className="mt-7 space-y-4 border-t pt-5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span>{network.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your role</span>
                  <span className="capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span>0 {network.symbol}</span>
                </div>
              </div>
              {job.contractAddress && (
                <div className="mt-6 border-t pt-5">
                  <p className="mb-2 text-[10px] text-muted-foreground">
                    Escrow contract
                  </p>
                  <a
                    href={`${network.explorerUrl}/address/${job.contractAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-text text-blue-300"
                  >
                    {job.contractAddress}
                  </a>
                  <p className="mt-3 text-[10px] leading-6 text-muted-foreground">
                    Last verified{" "}
                    {job.verifiedAt
                      ? new Date(job.verifiedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Alert>
            <AlertDescription className="text-[11px] leading-7">
              Client verification releases the escrow payment to the freelancer.
              Use {network.name} test {network.symbol}. Refund and dispute
              actions are outside the current contract.
            </AlertDescription>
          </Alert>
        </aside>
      </div>
    </div>
  );
}

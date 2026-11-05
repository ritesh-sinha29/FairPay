"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { parseUnits } from "ethers";
import { ARC_TESTNET } from "@/lib/payments";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useWorkspace } from "@/components/workspace-provider";
import { readableError } from "@/lib/ethereum";
import { shortAddress } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewJobPage() {
  const { user, notify } = useWorkspace();
  const freelancers = useQuery(
    api.users.freelancers,
    user.role === "client" ? {} : "skip",
  );
  const create = useMutation(api.jobs.create);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [freelancerId, setFreelancerId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (!freelancerId) throw new Error("Choose a freelancer for this job.");
      if (
        !/^\d+(\.\d{1,6})?$/.test(amount) ||
        parseUnits(amount, ARC_TESTNET.decimals) <= 0n
      )
        throw new Error(
          "Enter a positive USDC payment with up to 6 decimal places.",
        );
      const id = await create({
        title,
        description,
        freelancerId: freelancerId as Id<"users">,
        amountWei: parseUnits(amount, ARC_TESTNET.decimals).toString(),
      });
      router.push(`/jobs/${id}`);
    } catch (error) {
      setError(readableError(error));
      setBusy(false);
    }
  }

  if (user.role !== "client")
    return (
      <div className="page-wrap">
        <Alert>
          <AlertDescription>
            Client accounts create jobs. Your freelancer workspace shows jobs
            assigned to you.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/jobs">Your jobs</Link>
        </Button>
      </div>
    );
  return (
    <div className="page-wrap max-w-5xl">
      <Link
        href="/jobs"
        className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={13} /> All jobs
      </Link>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">START AN AGREEMENT</p>
          <h1>
            Create a job<span className="text-blue-400">.</span>
          </h1>
          <p className="page-description">
            Propose the scope and payment to your freelancer. Fund the escrow
            after they agree.
          </p>
        </div>
      </div>
      <div className="grid gap-7 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Job details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job title</Label>
                <Input
                  id="job-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={160}
                  placeholder="e.g. Design a brand identity"
                  required
                  disabled={busy}
                />
                <p className="text-[11px] text-muted-foreground">
                  The title will be public on the blockchain after funding.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-description">
                  Scope and expected delivery
                </Label>
                <Textarea
                  id="job-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  minLength={20}
                  maxLength={6000}
                  rows={5}
                  placeholder="Describe the deliverables, acceptance criteria, and anything the freelancer should know."
                  required
                  disabled={busy}
                />
                <p className="text-[11px] text-muted-foreground">
                  The brief is visible to you and the assigned freelancer.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freelancer-select">Freelancer</Label>
                <Select
                  value={freelancerId}
                  onValueChange={setFreelancerId}
                  disabled={busy || !freelancers?.length}
                >
                  <SelectTrigger id="freelancer-select" className="w-full">
                    <SelectValue
                      placeholder={
                        freelancers === undefined
                          ? "Loading freelancers…"
                          : "Choose a registered freelancer"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {freelancers?.map((freelancer) => (
                      <SelectItem value={freelancer._id} key={freelancer._id}>
                        {freelancer.name} ·{" "}
                        {shortAddress(freelancer.walletAddress)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {freelancers?.length === 0 && (
                  <Alert>
                    <AlertDescription className="text-xs leading-6">
                      Ask your freelancer to create an account first.
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() =>
                          void navigator.clipboard
                            .writeText(`${location.origin}/sign-up/freelancer`)
                            .then(() =>
                              notify("Freelancer signup link copied."),
                            )
                            .catch(() =>
                              notify(
                                `Share ${location.origin}/sign-up/freelancer`,
                              ),
                            )
                        }
                      >
                        <Copy size={12} /> Copy signup link
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-amount">Agreed payment in USDC</Label>
                <Input
                  id="job-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="25.00"
                  required
                  disabled={busy}
                />
                <p className="text-[11px] text-muted-foreground">
                  Use test USDC on Arc Testnet. Keep additional USDC for network
                  gas.
                </p>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <p className="text-[11px] leading-6 text-muted-foreground">
                Sending this proposal confirms the scope and payment from your
                side. The assigned freelancer must agree before you lock the
                deposit.
              </p>
              <Button
                className="w-full"
                disabled={busy || !freelancers?.length}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={15} />
                ) : (
                  <ArrowRight size={15} />
                )}
                {busy ? "Sending your proposal…" : "Send job proposal"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6 py-3">
          <ShieldCheck size={32} className="text-blue-300" />
          <h2 className="text-2xl font-medium leading-9 tracking-tight">
            Clear scope.
            <br />A payment set aside.
          </h2>
          <p className="text-xs leading-7 text-muted-foreground">
            Your proposal is saved in Convex. Once the freelancer agrees, you
            lock the full payment in escrow. Work begins after funding is
            confirmed. When you verify the delivery, the contract releases
            payment.
          </p>
          <Alert>
            <AlertDescription className="text-xs leading-7">
              Verifying the work releases payment to the freelancer. The current
              contract has no refund, deadline, or dispute process. Agree on the
              work before depositing funds.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { isAddress, parseUnits } from "ethers";
import {
  ARC_TESTNET,
  SEPOLIA,
  SUPPORTED_PAYMENT_TOKENS,
  type TokenPreset,
} from "@/lib/payments";
import {
  ArrowLeft,
  ArrowRight,
  Coins,
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
  const [selectedAssetId, setSelectedAssetId] = useState("arc-usdc");
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customTokenSymbol, setCustomTokenSymbol] = useState("SHARP");
  const [customTokenDecimals, setCustomTokenDecimals] = useState("18");
  const [customNetwork, setCustomNetwork] = useState<"5042002" | "11155111">(
    "5042002",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedPreset: TokenPreset | undefined = SUPPORTED_PAYMENT_TOKENS.find(
    (item) => item.id === selectedAssetId,
  );
  const isCustom = selectedAssetId === "custom-erc20";

  const activeSymbol = isCustom
    ? customTokenSymbol.trim().toUpperCase() || "TOKEN"
    : selectedPreset?.symbol ?? "USDC";

  const activeDecimals = isCustom
    ? Number(customTokenDecimals) || 18
    : selectedPreset?.decimals ?? 6;

  const activeChainId = isCustom
    ? Number(customNetwork)
    : selectedPreset?.chainId ?? ARC_TESTNET.chainId;

  const activeTokenAddress = isCustom
    ? customTokenAddress.trim()
    : selectedPreset?.isNative
      ? undefined
      : selectedPreset?.tokenAddress;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (!freelancerId) throw new Error("Choose a freelancer for this job.");

      if (isCustom) {
        if (!isAddress(customTokenAddress))
          throw new Error("Enter a valid ERC-20 token contract address.");
        if (!customTokenSymbol.trim())
          throw new Error("Enter a token symbol (e.g. SHARP, DAI).");
        if (
          !customTokenDecimals ||
          isNaN(Number(customTokenDecimals)) ||
          Number(customTokenDecimals) < 0 ||
          Number(customTokenDecimals) > 36
        )
          throw new Error("Enter token decimals between 0 and 36.");
      }

      if (!/^\d+(\.\d+)?$/.test(amount))
        throw new Error(
          `Enter a positive ${activeSymbol} payment amount (e.g. 25.00).`,
        );

      const parsedWei = parseUnits(amount, activeDecimals);
      if (parsedWei <= 0n)
        throw new Error(`Enter a positive payment amount.`);

      const id = await create({
        title,
        description,
        freelancerId: freelancerId as Id<"users">,
        amountWei: parsedWei.toString(),
        paymentAsset: activeSymbol,
        paymentTokenAddress: activeTokenAddress,
        tokenDecimals: activeDecimals,
        chainId: activeChainId,
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
            Propose the scope and payment terms. You can pay in USDC, ETH, SHARP,
            or any custom ERC-20 token. Fund escrow once your freelancer agrees.
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
                  placeholder="e.g. Full-Stack Web3 DApp Development"
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
                  placeholder="Describe the deliverables, milestone acceptance criteria, and specific requirements."
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

              {/* Payment Currency Selector */}
              <div className="space-y-2">
                <Label htmlFor="asset-select">Payment Currency / Asset</Label>
                <Select
                  value={selectedAssetId}
                  onValueChange={setSelectedAssetId}
                  disabled={busy}
                >
                  <SelectTrigger id="asset-select" className="w-full">
                    <SelectValue placeholder="Choose payment asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_PAYMENT_TOKENS.map((token) => (
                      <SelectItem value={token.id} key={token.id}>
                        {token.name} ({token.symbol}) · {token.networkName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Select a pre-configured token or enter any ERC-20 smart contract.
                </p>
              </div>

              {/* Custom Token Configuration */}
              {isCustom && (
                <div className="space-y-4 rounded-lg border border-border/80 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Coins size={14} className="text-blue-400" /> Custom ERC-20
                    Token Settings
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-network">Blockchain Network</Label>
                    <Select
                      value={customNetwork}
                      onValueChange={(val) =>
                        setCustomNetwork(val as "5042002" | "11155111")
                      }
                      disabled={busy}
                    >
                      <SelectTrigger id="custom-network" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5042002">
                          Arc Testnet (Chain ID 5042002)
                        </SelectItem>
                        <SelectItem value="11155111">
                          Ethereum Sepolia (Chain ID 11155111)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-token-address">
                      ERC-20 Token Contract Address
                    </Label>
                    <Input
                      id="custom-token-address"
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      placeholder="0x..."
                      required={isCustom}
                      disabled={busy}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-token-symbol">Token Symbol</Label>
                      <Input
                        id="custom-token-symbol"
                        value={customTokenSymbol}
                        onChange={(e) => setCustomTokenSymbol(e.target.value)}
                        placeholder="e.g. SHARP, DAI"
                        required={isCustom}
                        disabled={busy}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-token-decimals">Decimals</Label>
                      <Input
                        id="custom-token-decimals"
                        type="number"
                        min="0"
                        max="36"
                        value={customTokenDecimals}
                        onChange={(e) =>
                          setCustomTokenDecimals(e.target.value)
                        }
                        placeholder="18"
                        required={isCustom}
                        disabled={busy}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="job-amount">
                  Agreed payment amount in {activeSymbol}
                </Label>
                <Input
                  id="job-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={activeDecimals === 6 ? "25.00" : "1.5"}
                  required
                  disabled={busy}
                />
                <p className="text-[11px] text-muted-foreground">
                  Escrow holds exactly {amount || "0"} {activeSymbol} on{" "}
                  {activeChainId === ARC_TESTNET.chainId
                    ? "Arc Testnet"
                    : "Sepolia"}
                  . Make sure your wallet holds native gas to fund the transaction.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-[11px] leading-6 text-muted-foreground">
                Sending this proposal confirms the scope and {activeSymbol}{" "}
                payment from your side. The assigned freelancer must agree
                before you lock the deposit into escrow.
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
                {busy ? "Sending your proposal…" : `Send ${activeSymbol} Proposal`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Info Column */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Universal Escrow Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-6 text-muted-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 text-emerald-400" size={16} />
                <p>
                  <strong>Multi-Token Support:</strong> Supports native ETH,
                  USDC, SHARP, and any standard ERC-20 token on Arc Testnet or
                  Ethereum Sepolia.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 text-blue-400" size={16} />
                <p>
                  <strong>Single-Transaction Verification:</strong> When the client
                  verifies the freelancer’s deliverable, the smart contract
                  automatically pays out the tokens in the same transaction.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 text-purple-400" size={16} />
                <p>
                  <strong>Immutable Terms:</strong> A canonical agreement
                  fingerprint commits to the scope, tokens, and parties so no
                  terms can be altered after agreement.
                </p>
              </div>
            </CardContent>
          </Card>
          <Alert>
            <AlertDescription className="text-xs leading-7">
              Verifying the work releases payment to the freelancer. Ensure
              both parties agree on deliverables and currency before depositing funds.
            </AlertDescription>
          </Alert>
        </aside>
      </div>
    </div>
  );
}

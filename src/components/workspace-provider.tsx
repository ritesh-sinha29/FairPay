"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAction, useQuery } from "convex/react";
import { formatUnits } from "ethers";
import { paymentNetwork } from "@/lib/payments";
import { api } from "../../convex/_generated/api";
import { connectWallet, readableError } from "@/lib/ethereum";
import type { Job, Profile } from "@/lib/jobs";
interface Workspace {
  user: Profile;
  jobs: Job[];
  ready: boolean;
  account: string;
  chainId: number | null;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshing: boolean;
  notice: string;
  notify: (message: string) => void;
}
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({
  user,
  children,
}: {
  user: Profile;
  children: ReactNode;
}) {
  const records = useQuery(api.jobs.list);
  const synchronize = useAction(api.escrow.sync);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [notice, notify] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const wallet = window.ethereum;
    if (!wallet) return;
    let active = true;
    async function update() {
      try {
        const [accounts, chain] = await Promise.all([
          wallet!.request({ method: "eth_accounts" }),
          wallet!.request({ method: "eth_chainId" }),
        ]);
        if (active) {
          setAccount((accounts as string[])[0] || "");
          const parsedChain = chain
            ? typeof chain === "string" && chain.startsWith("0x")
              ? parseInt(chain, 16)
              : Number(chain)
            : null;
          setChainId(parsedChain && Number.isFinite(parsedChain) ? parsedChain : null);
        }
      } catch {
        if (active) {
          setAccount("");
          setChainId(null);
        }
      }
    }
    void update();
    wallet.on?.("accountsChanged", update);
    wallet.on?.("chainChanged", update);
    return () => {
      active = false;
      wallet.removeListener?.("accountsChanged", update);
      wallet.removeListener?.("chainChanged", update);
    };
  }, []);
  const jobs: Job[] = (records ?? []).map((record) => ({
    id: record._id,
    title: record.title,
    description: record.description,
    client: record.clientAddress,
    freelancer: record.freelancerAddress,
    clientName: record.clientName,
    freelancerName: record.freelancerName,
    amount: formatUnits(
      record.amountWei,
      record.tokenDecimals ?? paymentNetwork(record.chainId).decimals,
    ),
    amountWei: record.amountWei,
    paymentAsset: record.paymentAsset,
    paymentTokenAddress: record.paymentTokenAddress,
    tokenDecimals: record.tokenDecimals,
    status: record.status,
    acceptedAt: record.acceptedAt,
    arkivEntityKey: record.arkivEntityKey,
    arkivProposalKey: record.arkivProposalKey,
    createdAt: new Date(record._creationTime).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
    chainId: record.chainId,
    contractAddress: record.contractAddress,
    fundingHash: record.fundingHash,
    fundingReservation: record.fundingReservation,
    reservationExpiresAt: record.reservationExpiresAt,
    deliverableUrl: record.deliverableUrl,
    submissionNote: record.submissionNote,
    verifiedAt: record.verifiedAt,
  }));
  async function connect() {
    try {
      const signer = await connectWallet();
      setAccount(await signer.getAddress());
      setChainId(Number((await signer.provider.getNetwork()).chainId));
    } catch (error) {
      notify(readableError(error));
    }
  }
  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const syncJobs = jobs.filter(
        (job) => job.contractAddress || job.fundingHash,
      );
      const batchSize = 4;
      let failed = 0;
      for (let i = 0; i < syncJobs.length; i += batchSize) {
        const batch = syncJobs.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((job) => synchronize({ jobId: job.id })),
        );
        failed += results.filter((res) => res.status === "rejected").length;
      }
      notify(
        failed
          ? `${failed} job(s) could not be refreshed. Open a job to check its transaction.`
          : "Job statuses verified against their payment networks.",
      );
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        jobs,
        ready: records !== undefined,
        account,
        chainId,
        connect,
        refresh,
        refreshing,
        notice,
        notify,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useOptionalWorkspace() {
  return useContext(Context);
}
export function useWorkspace() {
  const context = useOptionalWorkspace();
  if (!context) throw new Error("An authenticated workspace is required.");
  return context;
}

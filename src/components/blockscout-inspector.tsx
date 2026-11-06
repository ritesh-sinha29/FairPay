"use client";

import { useState } from "react";
import { ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getBlockscoutTxUrl, getBlockscoutAddressUrl, BlockscoutContractInfo, BlockscoutTxInfo } from "@/lib/blockscout";

interface BlockscoutInspectorProps {
  chainId: number;
  contractAddress?: string;
  txHash?: string;
  className?: string;
}

export function BlockscoutInspector({
  chainId,
  contractAddress,
  txHash,
  className = "",
}: BlockscoutInspectorProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ contract?: BlockscoutContractInfo; tx?: BlockscoutTxInfo } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const blockscoutUrl = txHash
    ? getBlockscoutTxUrl(chainId, txHash)
    : contractAddress
    ? getBlockscoutAddressUrl(chainId, contractAddress)
    : "#";

  async function handleInspect() {
    if (data) {
      setIsOpen(!isOpen);
      return;
    }

    setLoading(true);
    try {
      const param = txHash ? `txHash=${txHash}` : `address=${contractAddress}`;
      const res = await fetch(`/api/blockscout?chainId=${chainId}&${param}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(txHash ? { tx: json.data } : { contract: json.data });
          setIsOpen(true);
        }
      }
    } catch (err) {
      console.warn("Failed to inspect via Blockscout:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <a
          href={blockscoutUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
          title="Verify on Blockscout Explorer"
        >
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Blockscout</span>
          <ExternalLink size={10} className="opacity-70" />
        </a>

        {(txHash || contractAddress) && (
          <button
            type="button"
            onClick={handleInspect}
            disabled={loading}
            className="text-[11px] text-muted-foreground underline decoration-dotted transition-colors hover:text-foreground"
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Querying...
              </span>
            ) : isOpen ? (
              "Hide audit"
            ) : (
              "Quick Audit"
            )}
          </button>
        )}
      </div>

      {isOpen && data && (
        <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-border/80 bg-background/95 p-3 text-xs shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> Blockscout Live Verification
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              Live API
            </span>
          </div>

          <div className="mt-2 space-y-1.5 text-muted-foreground text-[11px]">
            {data.tx && (
              <>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-400">
                    <CheckCircle2 size={12} /> {data.tx.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Block Height:</span>
                  <span className="font-mono text-foreground">{data.tx.blockNumber || "Confirmed"}</span>
                </div>
                {data.tx.fee && (
                  <div className="flex justify-between">
                    <span>Tx Fee:</span>
                    <span className="font-mono text-foreground">{data.tx.fee}</span>
                  </div>
                )}
              </>
            )}

            {data.contract && (
              <>
                <div className="flex justify-between">
                  <span>Contract Verified:</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-400">
                    <CheckCircle2 size={12} /> {data.contract.isVerified ? "Verified (OpenZeppelin)" : "Bytecode Matched"}
                  </span>
                </div>
                {data.contract.txCount !== undefined && (
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-mono text-foreground">{data.contract.txCount}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


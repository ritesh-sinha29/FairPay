import { ARC_TESTNET, paymentNetwork } from "./payments";

export interface WalletErrorContext {
  chainId?: number;
  operation?: "fund" | "submit" | "verify";
}

function cleanMessage(message: string) {
  return message
    .replace(/\[CONVEX[^\]]*\]\s*/g, "")
    .replace(/\[Request ID:[^\]]*\]\s*/g, "")
    .replace(/Server Error\s*Uncaught (?:ConvexError|Error):\s*/, "")
    .replace(/https?:\/\/[^\s"'<>),]+/g, value => {
      try { const url = new URL(value); return `${url.origin}${url.pathname !== "/" || url.search ? "/…" : ""}`; } catch { return "[RPC URL]"; }
    })
    .replace(/\b(?:ark_live_|proapi_)[\w-]+/g, "[redacted API key]")
    .split("\n")[0].slice(0, 500).trim();
}

function errorDetails(error: unknown) {
  const codes = new Set<string>();
  const messages: string[] = [];
  const methods = new Set<string>();
  const seen = new Set<object>();
  // MetaMask wraps RPC errors in data.originalError; ethers adds error/info.
  // Read only error fields, never transaction payloads or request bodies.
  function visit(value: unknown, depth = 0) {
    if (depth > 8) return;
    if (typeof value === "string") {
      if (value.length < 20000 && value.trim().startsWith("{")) {
        try { visit(JSON.parse(value), depth + 1); return; } catch { /* Treat as text. */ }
      }
      if (value.trim() && !/^0x[\da-f]*$/i.test(value.trim())) messages.push(value);
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    const record = value as Record<string, unknown>;
    // Read only a known request name, never its parameters or transaction data.
    const method = record.method ?? (record.payload as Record<string, unknown> | undefined)?.method;
    if (typeof method === "string" && /^(?:eth_(?:requestAccounts|accounts|chainId|estimateGas|sendTransaction)|wallet_(?:requestPermissions|switchEthereumChain))$/.test(method)) methods.add(method);
    if (typeof record.code === "number" || typeof record.code === "string") codes.add(String(record.code));
    for (const key of ["originalError", "error", "cause", "data", "info"]) visit(record[key], depth + 1);
    for (const key of ["reason", "shortMessage", "message", "details"]) {
      if (typeof record[key] === "string") messages.push(record[key] as string);
    }
  }
  visit(error);
  return { codes, messages, methods };
}

function rateLimited(codes: Set<string>, text: string) {
  return codes.has("429") || codes.has("-32005") || /rate.?limit|too many requests|request limit exceeded/i.test(text);
}

export function isRpcRateLimit(error: unknown) {
  const { codes, messages } = errorDetails(error);
  return rateLimited(codes, messages.join(" "));
}

export function isWalletAuthorizationError(error: unknown) {
  const { codes, messages } = errorDetails(error);
  return codes.has("4100") || /account and\/or method has not been authorized/i.test(messages.join(" "));
}

export function walletErrorMessage(error: unknown, context: WalletErrorContext = {}): string {
  const { codes, messages, methods } = errorDetails(error);
  const text = messages.join(" ");
  let network: ReturnType<typeof paymentNetwork> | undefined;
  try { if (context.chainId) network = paymentNetwork(context.chainId); } catch { /* Unknown network. */ }
  const networkName = network?.name || "the selected network";
  const rpcHint = network ? ` Check the RPC URL in MetaMask's ${network.name} network settings: ${network.rpcUrl}.` : " Check the selected network's RPC settings in MetaMask.";

  if (codes.has("4001") || codes.has("ACTION_REJECTED")) return "Request cancelled in your wallet. You can try again.";
  if (codes.has("4100") || /account and\/or method has not been authorized/i.test(text)) return `MetaMask has not authorized this account for FairPay. Use Reconnect wallet to review account and network permissions in MetaMask.${methods.size ? ` Denied request: ${[...methods].join(", ")}.` : ""}`;
  if (codes.has("-32002")) return "A request is already open in MetaMask. Open the wallet and complete or cancel it first.";
  if (rateLimited(codes, text)) {
    return `The network RPC is rate-limiting requests. Wait briefly, then check the job status before retrying. If MetaMask shows a pending transaction, wait for it to finish.${methods.size ? ` Failed request: ${[...methods].join(", ")}.` : ""}`;
  }
  if (codes.has("INSUFFICIENT_FUNDS") || /insufficient funds|not enough funds|balance.*too low/i.test(text)) {
    if (context.chainId === ARC_TESTNET.chainId && context.operation !== "fund") return "This wallet needs Arc Testnet USDC for transaction gas. Claim test USDC for the wallet sending this transaction.";
    return "Your wallet does not have enough funds for this transaction and its network fee.";
  }
  if (codes.has("NONCE_EXPIRED") || /nonce.*too low|nonce.*already.*used/i.test(text)) return "MetaMask used an outdated transaction nonce. Check wallet activity and the job status, then reconnect the correct wallet before retrying.";
  if (codes.has("REPLACEMENT_UNDERPRICED") || /replacement transaction underpriced/i.test(text)) return "A transaction with this nonce is already pending. Manage it in MetaMask Activity rather than sending another job action.";
  if (codes.has("NETWORK_ERROR") || /failed to fetch|fetch failed|network error|could not detect network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|disconnected from chain/i.test(text)) {
    return `MetaMask could not reach ${networkName}.${rpcHint}`;
  }
  const useful = messages.find(message => !/could not coalesce error|^internal json.?rpc error\.?$|^unknown error\.?$|^json.?rpc error\.?$/i.test(message.trim()));
  if (useful) return cleanMessage(useful);
  if (codes.has("UNKNOWN_ERROR") || messages.some(message => /could not coalesce|internal json.?rpc/i.test(message))) {
    return `MetaMask could not broadcast the transaction.${rpcHint} Check MetaMask Activity for the underlying error, then check the job status before retrying.`;
  }
  return "The request failed. Please try again.";
}

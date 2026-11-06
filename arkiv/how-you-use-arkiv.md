# How We Use Arkiv — FairPay Implementation Details

This document explains our query filters, ownership rules, expiration policies, and user-facing impact.

---

## 1. Filter Criteria & SQL-Like Queries

FairPay's decentralized job feed executes expressive, typed queries directly against the Arkiv Rabdi testnet:

### Example 1: Active Smart Contract Escrows
```sql
SELECT * WHERE status = str('open') AND category = str('smart-contracts') ORDER BY expiresAt ASC
```
**TypeScript SDK Invocation**:
```typescript
const result = await publicClient.query(
  "status = str('open') AND category = str('smart-contracts')",
  { limit: 25 }
);
```

### Example 2: High-Budget Milestones (> 2.0 ETH)
```sql
SELECT * WHERE status = str('open') AND budgetEth >= dec('2.00') ORDER BY expiresAt ASC
```

### Example 3: Client Wallet Portfolio Lookup
```sql
SELECT * WHERE clientAddress = addr('0xE6E4bde21600b3c973E1CB2c6125C2E46bb96d24')
```

---

## 2. Who Can Edit Each Entity?

- **Creation**: Any client connects their Web3 wallet and calls `walletClient.createEntity()`.
- **Status Updates**: Only the verified creator wallet can patch an entity (e.g. from `open` to `awarded`).
- **Tamper Resistance**: If an unauthorized wallet attempts to call `patchEntity()`, the Arkiv DB-chain rejects the transaction with `EntityMutationError`.

---

## 3. How Expiration Fits What FairPay Does

In freelance escrow agreements, bidding windows and RFP discovery are inherently **ephemeral**:
1. **Flash Hackathon Tasks**: Expire in **24 Hours** (`ExpirationTime.fromHours(24)`).
2. **Sprint Milestones**: Expire in **3 Days** (`ExpirationTime.fromDays(3)`).
3. **Standard RFP Bidding Window**: Expire in **7 Days** (`ExpirationTime.fromDays(7)`).
4. **Grant Proposals**: Expire in **30 Days** (`ExpirationTime.fromDays(30)`).

When a deadline is reached without an award, the entity silently and gracefully drops off the public feed. Clients don't have to pay gas to "close" abandoned postings, and freelancers don't browse stale leads.

---

## 4. User-Facing Features Powered by Arkiv

1. **Live Arkiv Escrow Board (`/arkiv`)**:
   - Displays real-time entities with their 32-byte Arkiv Key and creator wallet.
   - Live expiration badge calculating countdown hours remaining based on block height.
   - Syntax-highlighted query bar showing the exact SQL expression that fetched the feed, complete with a "Copy Query" button.
2. **"Post to Arkiv" Client Modal**:
   - Provides clients with a custom slider/selector for `ExpirationTime` (1, 3, 7, 14, or 30 days).
   - Generates signed transactions written to Rabdi testnet.
3. **Direct Chain Verification**:
   - Every entity displays a link to the **Arkiv Rabdi Block Explorer** (`https://rabdi.explorer.arkiv.network`).


# 09. Blockscout Integration & Verification Guide

## 📌 Overview & Hackathon Track
FairPay integrates **Blockscout** as its primary open-source verification and block exploration engine. Blockscout ensures total transparency across all milestone escrows, giving both clients and freelancers verifiable, real-time proof of:
1. **Contract Bytecode & SafeERC20 Permissions**: Auditing non-custodial milestone escrows before locking capital.
2. **Atomic Verification Payouts**: Tracking single-transaction `markComplete()` and `releasePayment()` event logs.
3. **Live API Auditing**: Querying transaction statuses and contract metadata programmatically using Blockscout's v2 REST API.

---

## 🔑 Configuration & API Keys
Blockscout developer access is configured in `.env.local` and `.env.example`:

```env
BLOCKSCOUT_API_KEY="proapi_eGLUIW2IxlQlmhUUJdz1KZz92CmeGCJWgXnlB2BNsEJWVkJDEYZxPJQ0hg3OC3dm_eLiBzF"
NEXT_PUBLIC_BLOCKSCOUT_API_KEY="proapi_eGLUIW2IxlQlmhUUJdz1KZz92CmeGCJWgXnlB2BNsEJWVkJDEYZxPJQ0hg3OC3dm_eLiBzF"
```

---

## 🛠️ Architecture & Implemented Components

### 1. Blockscout Service Layer ([`src/lib/blockscout.ts`](file:///src/lib/blockscout.ts))
* **`fetchBlockscoutContract(chainId, address)`**: Queries Blockscout API v2 (`/smart-contracts/{address}`) to verify source code and bytecode matching.
* **`fetchBlockscoutTx(chainId, txHash)`**: Queries Blockscout API v2 (`/transactions/{txHash}`) to fetch execution status, block height, and gas fees.
* **Deep Links**: Constructs canonical explorer links for Ethereum Sepolia (`https://eth-sepolia.blockscout.com`) and Arc Testnet (`https://explorer.testnet.arc.network`).

### 2. Live API Relayer ([`src/app/api/blockscout/route.ts`](file:///src/app/api/blockscout/route.ts))
* Next.js server route handling cached requests to Blockscout with authenticated API key headers.
* Handles both `?txHash=...` and `?address=...` queries for real-time app inspection.

### 3. Interactive Blockscout Inspector UI ([`src/components/blockscout-inspector.tsx`](file:///src/components/blockscout-inspector.tsx))
* Embedded directly into the **Job Detail** view ([`src/components/job-detail.tsx`](file:///src/components/job-detail.tsx)):
  * **One-Click Explorer Pill**: Direct link to the contract or transaction on Blockscout.
  * **"Quick Audit" Toggle**: Fetches real-time contract verification status, transaction confirmations, and execution status straight from Blockscout's REST API into the FairPay interface.

---

## 🧪 Testing & Verification for Judges

### Live UI Verification:
1. Open any job detail page on FairPay (`/jobs/[id]`).
2. Beside **"Escrow contract"** or **"View latest transaction"**, see the green **"Blockscout"** badge.
3. Click the badge to open the Blockscout explorer in a new tab.
4. Click **"Quick Audit"** to test the live API v2 call fetching live verification parameters.

### Direct API Testing:
Run the following curl command in your terminal:
```bash
# Test Blockscout API v2 with FairPay API Key
curl "https://api.blockscout.com/1/api/v2/addresses/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/transactions?apikey=proapi_eGLUIW2IxlQlmhUUJdz1KZz92CmeGCJWgXnlB2BNsEJWVkJDEYZxPJQ0hg3OC3dm_eLiBzF"
```


# Arkiv Entity Schema — FairPay Escrow Protocol

FairPay uses **Arkiv** as a decentralized, ephemeral DB-chain layer for milestone job listings and Request for Proposals (RFPs).

---

## 1. Entity Definition: `FairPayJobListing`

Every job listing on FairPay is published as an Arkiv entity with typed, queryable attributes.

```typescript
import { defineSchema, str, dec, u64, addr } from "@arkiv-network/sdk";

export const ArkivJobSchema = defineSchema({
  title: str().indexed(),
  category: str().indexed(),
  status: str().indexed(), // "open" | "awarded" | "in-review" | "completed" | "expired"
  budgetEth: dec().indexed(),
  milestonesCount: u64(),
  clientAddress: addr().indexed(),
  tags: str(),
  description: str(),
  createdAt: u64().indexed(),
});
```

---

## 2. Fields & Query Indexes

| Field | Type | Indexed? | Description |
| :--- | :--- | :---: | :--- |
| `title` | `str` | Yes | Human-readable title of the escrow milestone project |
| `category` | `str` | Yes | Project domain: `smart-contracts`, `frontend`, `fullstack`, `security-audit`, `design` |
| `status` | `str` | Yes | Lifecycle stage: `open`, `awarded`, `in-review`, `completed`, `expired` |
| `budgetEth` | `dec` | Yes | Total milestone escrow budget denominated in ETH |
| `milestonesCount` | `u64` | No | Number of progressive escrow delivery checkpoints |
| `clientAddress` | `addr` | Yes | Wallet address of the client who funded or initiated the RFP |
| `tags` | `str` | No | Comma-delimited skill/technology tags (e.g. `solidity,arkiv,escrow`) |
| `description` | `str` | No | Detailed scope of work and acceptance criteria |
| `createdAt` | `u64` | Yes | Block timestamp when the entity was created |

---

## 3. Ownership Model

- **Owner**: Each entity's `owner` is the **client's EVM wallet address** (`clientAddress`).
- **Mutation Rights**: Only the entity owner possesses the cryptographic authority to mutate or patch fields (e.g., updating `status` to `awarded` or modifying deliverables).
- **Public Reads**: Gas-free reads are available to any browser, indexing service, or autonomous agent via `createPublicClient`.

---

## 4. Native Expiration Mechanics

Every entity specifies an **Arkiv Expiration Window** at creation using `@arkiv-network/sdk`:

```typescript
import { ExpirationTime } from "@arkiv-network/sdk";

// Preset expiration options selectable by clients:
const expiryFastSprint = ExpirationTime.fromHours(24);    // 24 Hours
const expiryStandard   = ExpirationTime.fromDays(7);       // 7 Days (Default)
const expiryLongTerm   = ExpirationTime.fromDays(30);      // 30 Days
```

### Why Expiration Matters for FairPay:
In Web3 freelancing, over 60% of open RFPs become stale or abandoned when clients hire privately or change direction. In traditional Web2 architectures, this requires complex cron jobs or soft-delete garbage collection. With Arkiv:
- The listing automatically drops off the query index the moment the expiration block passes.
- Freelancers never waste gas or time applying to dead opportunities.
- Zero orphaned state on the DB-chain.


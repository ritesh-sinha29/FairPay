# Why Arkiv — FairPay Architectural Rationale

This document addresses the core judging criterion:
*If you swapped Arkiv for Postgres or any other database, what would your users lose? What did you keep off Arkiv, and why?*

---

## 1. What Users Would Lose If We Swapped Arkiv for Postgres

If FairPay replaced Arkiv with PostgreSQL or Supabase:

### A. Loss of Cryptographic Wallet Ownership
- **On Postgres**: The database administrator or backend server owns every row. A compromised API key, rogue employee, or infrastructure outage can arbitrarily censor, alter, or forge job requirements and milestone terms.
- **On Arkiv**: Every job entity is cryptographically signed and owned by the creator's wallet (`owner: 0x...`). Only the client’s private key can execute `patchEntity()` or mutate status. No backend intermediary can falsify escrow terms.

### B. Loss of Native Protocol-Level Expiration
- **On Postgres**: Managing expiring bidding windows requires server cron jobs (`pg_cron`, Celery, BullMQ), scheduled lambdas, or complex soft-delete sweeps. When workers fail or queues back up, ghost listings linger indefinitely.
- **On Arkiv**: Expiration is an immutable first-class protocol primitive (`ExpirationTime.fromDays(d)`). Once the target block is reached, the network natively prunes the entity from active queries without human intervention.

### C. Loss of Permissionless, Gas-Free Ecosystem Composability
- **On Postgres**: External developers, third-party portfolio trackers, and autonomous AI agents must register for proprietary API keys, adhere to rate limits, or endure scraping blockers.
- **On Arkiv**: Any client application or smart agent can query the global state with SQL-like semantics via `@arkiv-network/sdk` gas-free.

---

## 2. What We Kept OFF Arkiv (And Why)

To maintain optimal decentralization and performance, we carefully partitioned FairPay's stack:

### A. Escrow Funds & Financial Collateral (Kept on EVM Smart Contracts)
- **Why**: Arkiv is a DB-chain optimized for ephemeral, structured data storage and querying—not an execution environment for asset custody.
- **Implementation**: Real funds (USDC and ETH) are locked in audited EVM smart contracts (`FairPayStableEscrow.sol` and `FairPayEscrow.sol`). Arkiv stores the job metadata, milestone breakdown, and attestation references.

### B. Heavy Deliverable Binaries (Kept on Decentralized Storage)
- **Why**: Large files (e.g. 50 MB design ZIPs, video assets, compiled binaries) exceed Arkiv’s optimal entity byte limit (`MAX_ENTITY_BYTES`).
- **Implementation**: Work deliverables are uploaded to IPFS / Swarm, and only the lightweight cryptographic hash (CID) is referenced inside the Arkiv entity.


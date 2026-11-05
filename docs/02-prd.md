# FairPay product requirements

The problem, intended users, scope, requirements, and acceptance criteria.

Working draft · 5 November 2026 · Product and judges

## Product decision

We are building a focused escrow workflow for small freelance jobs. The hackathon version demonstrates a client funding a job, a freelancer submitting it, and the client releasing payment. The product uses Next.js and TypeScript with a Solidity contract on an Ethereum-compatible testnet.

This document describes the implemented prototype and the requirements for a credible live demonstration. Proposed production features are identified separately. ETHGlobal Mumbai is the event context supplied by the project owner. Arc is the selected integration target. New jobs settle in USDC on Arc Testnet. Sponsor eligibility and the appropriate entry category still need confirmation.

## Problem and initial users

Our starting hypothesis is that independent freelancers want evidence that an agreed payment has been set aside before they begin. Clients want to review the deliverable before releasing that payment. A shared funded agreement can make these expectations visible to both parties.

The initial users are a client commissioning a small digital task and a freelancer delivering it. Examples include logo design, a landing page, and a contract review. The prototype assumes that both parties agree on scope outside the app and can use browser wallets. User demand and willingness to pay remain research questions.

| User | Need | Current FairPay response |
| --- | --- | --- |
| Client | Know which job is funded and what needs verification | Job details, saved agreements, and review actions |
| Freelancer | Verify a deposit and request payment after completion | Shared job link and freelancer-only submission |
| Judge | Understand and verify the Web3 mechanism | Role-based demo and a live transaction link when available |

## Value proposition and Web3 rationale

FairPay makes the deposit, assigned parties, and payment status inspectable on a shared blockchain. The escrow contract enforces the caller and status checks. An independent freelancer can open the contract address and verify the funded agreement.

The contract can enforce its programmed permissions and state transitions. Work quality still requires human review. The present client verification model creates a dependency on the client, so automatic payment assurance would be an inaccurate promise.

## Experience principles

- Use job language in primary navigation and explain escrow when the user needs to understand where the payment goes.
- Give each role one clear next action and show who is responsible for moving the job forward.
- Explain the client and freelancer roles before requesting a signup signature.
- Label the payment network and test currency clearly throughout the experience.
- Show a submitted transaction as pending until confirmation arrives.
- Keep wallet addresses and payment consequences readable before work verification.
- Preserve Wekraft’s global styling while adapting the layout for desktop and mobile.

## Functional requirements

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| FR01 | Both parties agree before the client funds escrow | Client sends a proposal, assigned freelancer accepts, and only then can the client lock the payment |
| FR02 | Validate title, freelancer, and deposit | Reject empty or oversized titles, zero deposits, zero freelancer address, and self-assignment |
| FR03 | Only the assigned freelancer can submit | Client and unrelated account calls revert, freelancer call sets Submitted |
| FR04 | Client verification releases payment after submission | Early or unauthorized calls revert; valid client verification transfers the recorded amount in the same transaction |
| FR05 | Prevent a second payout | Repeated verification cannot transfer funds again |
| FR06 | Share and open a live agreement | The assigned participant can open its job link after signing in from another browser |
| FR07 | Show transaction progress and errors | Wallet rejection, wrong network, pending confirmation, and RPC failure produce actionable feedback |
| FR08 | Show persistent jobs and payment history | Search, status filtering, refresh, and CSV export operate on authenticated Convex records |
| FR09 | Provide separate client and freelancer signup | A fresh wallet signature creates the selected account type, and sign-in preserves its saved role |
| FR10 | Provide step-by-step help | Each role sees the appropriate next action and can read the short payment walkthrough |

The PRD, TRD, roadmap, and pitch guide are preparation material for the project owner in the repository docs folder.

## User journey

1. The client proposes a job and price in FairPay; the assigned freelancer accepts.
2. The client creates the dedicated escrow, grants the exact USDC allowance, then locks the payment.
3. The client shares the live job link with the freelancer.
4. The freelancer verifies the amount and assigned address, then completes the work outside FairPay.
5. The freelancer submits the job through FairPay.
6. The client verifies the deliverable, triggering payment in the same wallet transaction.
7. Both people can inspect the confirmed result and transaction history available through the explorer.

## Data and privacy requirements

A live job exposes its title, wallet addresses, amount, and contract state on a public testnet. The form should prompt the user to keep its title short and public. Confidential work should be exchanged through an agreed external channel.

Convex stores the job brief, assignment, delivery link and note, contract reference, and verification metadata. Queries restrict each job to its client and freelancer. Account records persist across devices when the user signs in with the same wallet. The name, professional headline, and verified wallet of a freelancer are available to authenticated clients for assignment. Third-party RPC providers can observe blockchain verification reads.

## Current scope and proposed expansion

| Available in the prototype | Proposed next | Decision needed |
| --- | --- | --- |
| USDC escrow on Arc Testnet; legacy Sepolia ETH jobs | Additional assets | Supported token addresses, precision, transfer behavior, and gas experience |
| One funded contract per job | Milestone payments | Milestone acceptance, partial release, and cancellation rules |
| Client verification triggers payout | Timeout and dispute handling | Who decides, what evidence is accepted, and how funds move |
| Deliverable link and note | Private file uploads and milestones | Storage, privacy, permanence, and access policy |
| Convex account dashboards | External contract discovery | Factory or indexer design and migration plan |

## Success measurements

These are proposed evaluation targets. No production users, revenue, market size, or measured usability results are claimed.

| Measure | Initial target | How to evaluate |
| --- | --- | --- |
| First demo completion | At least 4 of 5 new testers finish without verbal help | Observe a short usability session and record failures |
| Role understanding | Each tester identifies who must act next | Ask after funding and after submission |
| Live technical demonstration | One confirmed job across two independent wallets | Save contract address, chain ID, and transaction evidence |
| Payment correctness | Recorded deposit reaches the assigned freelancer once | Local contract tests and a live explorer check |
| Pitch clarity | Audience can explain the deposit and verification mechanism | Ask listeners to repeat the flow after rehearsal |

## Risks that affect the product promise

- Client inactivity can lock the deposit indefinitely under the current contract rules.
- A wrong freelancer address can assign the job to the wrong account. There is no correction path after deployment.
- Public transaction fees and confirmation delays affect the experience.
- A public RPC outage can prevent the interface from showing fresh data even when the contract remains available.
- Unaudited contract code and locally passing tests are insufficient evidence for production use with valuable funds.
- Backend availability and RPC access affect the ability to display fresh verified status. Signing keys and deployment credentials need appropriate operational protection.

## Release acceptance

- The production build and TypeScript checks pass.
- The contract tests pass for permissions, invalid funding, a single payout, and payout failure rollback.
- The account flow works from signup through job creation, assignment, delivery, and payment.
- The interface identifies Arc Testnet USDC for new jobs and preserves the currency/network labels of legacy Sepolia ETH jobs.
- A live rehearsal with two funded test wallets is completed and recorded before claiming an onchain demo.
- The final sponsor network and submission requirements are checked against the event’s official materials.

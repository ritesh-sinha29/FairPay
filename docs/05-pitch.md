# FairPay pitch and demonstration guide

A three-minute script, slide outline, demonstration plan, and judge questions.

Working draft · 5 November 2026 · Pitch rehearsal

## The one sentence explanation

FairPay lets a client fund a freelance job upfront in an escrow contract and automatically release payment to the freelancer when the client verifies the submitted work.

Use the script as a draft for the actual speaking slot. It assumes roughly three minutes including a short demonstration. Shorten it to the event’s confirmed time limit. Complete a public testnet rehearsal before presenting a confirmed payout as verified evidence.

## Opening for the first thirty seconds

Imagine you’re a designer taking a small job from a new client. Before you start, you want to know the payment is ready. The client wants to see the finished work before paying. We built FairPay so both people can see a funded agreement and understand what happens next.

The client deposits the agreed amount into a smart contract. The freelancer can inspect that deposit, complete the work, and submit the job. The client then verifies the work. That verification triggers the contract to release the funds to the assigned freelancer in the same transaction.

## Explain Web3 in the next thirty seconds

The contract stores the client, freelancer, deposit, and status on a shared blockchain. It checks the wallet behind each action. Only the freelancer can submit this job, and only the client can release its payment after submission. A successful release advances the state so the same job cannot be paid twice.

We built the interface in Next.js and TypeScript with shadcn components. Convex stores authenticated client and freelancer accounts, job briefs, and delivery records. ethers connects the wallet to the Solidity contract, and the backend verifies confirmed payment state before updating the job. 

Jobs are settled in Circle USDC on Arc Testnet via `FairPayStableEscrow.sol`. The client creates an escrow, permits the exact token amount, and locks funds before work begins. 

Additionally, FairPay integrates **Arkiv DB-Chain** (Chain ID 7794095) for decentralized, auto-expiring milestone RFPs with native TTL expiration—completely eliminating stale listings without server cron jobs. For transparent verification, **Blockscout API v2** is integrated for live contract auditing and in-app inspector badges.

## Demonstrate the job flow for about seventy seconds

1. Show the client and freelancer accounts and identify Arc Testnet and test USDC as the payment network and currency.
2. Send a job proposal with its scope, freelancer, and payment. Show the freelancer accepting it to close the deal, then the client funding the agreed escrow.
3. Show the funded job. Point to the amount, freelancer address, and Funded status.
4. Open the separate freelancer account, add the deliverable link and note, and choose Submit work for review. Confirm the submission transaction.
5. Return to the client, show In review, and open the deliverable. Select Verify work & release payment. Explain that verification releases the full agreed deposit.
6. Confirm the verification transaction in the client wallet. Show Paid after confirmation and backend verification. Open the contract and payment evidence in the explorer.

## Explain the limitation and next step for about thirty seconds

The current version requires the client to verify the work, which means an inactive client can leave the funds locked. Our next product decision is how cancellation, deadlines, and disputes should work. Those rules need to be agreed before we expand the contract.

We have tested the contract's permissions, payment correctness, duplicate prevention, and failed-transfer rollback. We also exercised real Convex signup and sign-in, replay rejection, role permissions, and persistence across sessions. A public testnet payment rehearsal is still needed before claiming the complete onchain flow as verified.

## Close in about twenty seconds

FairPay gives a small job a visible deposit and a clear work verification process. We’re looking for feedback from freelancers, clients, and technical reviewers on the payment rules and the steps that make the experience easier to use. Our next milestone is a verified two-wallet testnet job followed by usability testing with new users.

## Suggested six slide outline

| Slide | Show | Message to speak |
| --- | --- | --- |
| 1 | FairPay and a one sentence description | A client funds a job; verifying submitted work triggers payment |
| 2 | Client and freelancer with their two concerns | Freelancer wants funding evidence, client wants review before payment |
| 3 | Funded to In review to Paid | Show the three actions and which wallet performs each |
| 4 | App screenshot or live demonstration | Point to the funded amount and next action |
| 5 | Next.js, wallet, RPC, and Solidity diagram | Explain where permissions and payment are enforced |
| 6 | Evidence, current limitation, and next milestone | Present verified work and the concrete next decision |

## Answers to likely judge questions

| Question | Answer grounded in the prototype |
| --- | --- |
| Why use a blockchain? | Both parties can inspect a shared funded agreement and its coded release rules. The contract enforces role and status checks. |
| How do you know the work is good? | The client assesses the delivery. Their verification transaction releases payment; the contract cannot judge work quality itself. |
| What if the client never verifies the work? | The deposit stays locked today. Timeout and dispute rules are a proposed next step. |
| Can you refund or cancel? | The current contract has no refund or cancellation action. We need agreed rules before adding one. |
| What is actually built? | Next.js and shadcn UI, high-conversion landing page (`/web`), separate gasless EIP-191 wallet signup, deployed Convex accounts and reactive jobs, delivery records, Solidity escrow on Arc Testnet, Arkiv DB-Chain board with native TTL auto-pruning, and Blockscout API v2 verification. |
| Why Arkiv DB-Chain? | Centralized freelance boards suffer from 38%+ 'ghost jobs' where abandoned listings pollute search results. Arkiv stores RFPs on-chain with native ExpirationTime TTLs, auto-pruning expired bids at the consensus level with zero server cron overhead. |
| How does Blockscout help? | Blockscout provides open-source, trustless auditability. Every escrow contract features one-click Blockscout badges, and the in-app `<BlockscoutInspector />` drawer verifies contract bytecode and execution traces in real time. |
| What is verified live? | A public transaction proof is pending the two-wallet rehearsal. Only claim it after saving confirmed evidence. |
| How do you earn revenue? | The current platform fee is zero. Pricing and willingness to pay are future research questions. |
| What makes this different? | Our design focus is a small, understandable job workflow with visible funding and role-specific next steps. Competitive advantage still needs validation. |
| Is it secure? | Local tests cover specific payment and permission properties. Independent review and broader testing are still required. |
| Why one contract per job? | It provides a dedicated address and a simple demonstration. Deployment cost is a tradeoff to assess before scaling. |
| Why USDC? | A fixed USDC price makes the agreed payment readable. New jobs use the official Arc Testnet USDC interface, exact allowances, and a six-decimal amount. |
| How does it fit the sponsor track? | We need to select the track, verify its official requirements, and show a working integration on its required network. |

## Prepare before presenting

- Open the app, the guide, and the relevant explorer tabs before the session.
- Prepare a funded job and a completed job as recovery examples.
- Use different wallet profiles for a live client and freelancer. Confirm the selected network in both.
- Keep the contract address and transaction hashes in a short rehearsal note.
- Rehearse wallet prompts and confirmation delays. Transaction speed depends on the network.
- If the network fails, show the prepared confirmed job and state which step is unavailable.
- Support any claim about users, revenue, security review, or sponsor eligibility with actual evidence before adding it to the pitch.

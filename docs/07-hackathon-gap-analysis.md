# FairPay hackathon gap analysis

Assessment against the ETHGlobal Mumbai prize material supplied by the project owner and the official prize page checked on 5 November 2026.

## What we need to finish first

FairPay now has a Solidity escrow, a Next.js interface built with shadcn components, a deployed Convex backend, and separate wallet-based client and freelancer signup. Authentication and job permissions have been checked against the development backend, and the client signup/sign-in flow has been exercised in the browser. A public testnet payment rehearsal remains pending funded wallets.

| Gap | Why it matters | What to add or verify |
| --- | --- | --- |
| Account and permission usability | Signup and private jobs are implemented, with backend checks passing | Test the full two-person browser workflow with new users |
| Job delivery usability | Brief, assignment, amount, delivery link, and note are implemented | Test how clearly the client can evaluate and verify a delivery |
| Wallet ownership | Expiring single-use signature verification is implemented and tested | Broaden wallet compatibility and account recovery design |
| Payment synchronization | Backend deployment and status verification are implemented | Exercise recovery and updates with real public testnet transactions |
| Public testnet evidence | Local tests prove only part of the integration | A real client deposit, freelancer submission, and payout across two independently controlled test wallets |
| Client inactivity | The existing contract can leave the deposit locked | Design cancellation, review periods, and a dispute process before adding release without client verification |
| Sponsor eligibility | A generic escrow does not establish a sponsor integration | Pick a primary track and meet its asset, tooling, network, and evidence requirements |
| Submission evidence | Judges need a reproducible product | Working app link, public source repository, setup instructions, contract addresses, transaction hashes, and a timed demo video |
| Open-source license | Several supplied sponsor criteria require one | ✅ Resolved: Root MIT `LICENSE` added |

## The closest sponsor fit

My recommendation is to investigate Arc's advanced programmable-contract track first. The supplied requirements explicitly list conditional escrow with onchain disputes and automatic release. This aligns with FairPay's payment mechanism. Eligibility still depends on satisfying the complete requirements and the correct entry category.

That path calls for USDC or EURC settlement and Arc Studio as the starting point for the qualifying work. It also requires a shareable Studio project, a working frontend and backend, an architecture diagram, repository access, and a video showing how the tools are used. Arc USDC escrow is now implemented locally, with exact allowance/deposit handling, client-verification payout, and backend validation. The Studio project has been created; public settlement evidence and eligibility confirmation remain pending.

## Other tracks worth considering

| Track | Fit for FairPay | Extra work and qualification evidence |
| --- | --- | --- |
| Whitechain business payments | Conditional fit for an invoicing or payment-link product. Its criteria explicitly exclude escrow on its own | A reusable checkout, widget, SDK, payment link API, or plugin demonstrated in a separate app, both merchant and customer views, verified Whitechain Sepolia contracts, and a real main-flow payment using the required USDT token |
| World IDKit | Useful if a human verification event protects a meaningful account or payment action | A validated proof on the server or onchain and both success and failure paths. A verification badge alone does not establish the required product event |
| ENSv2 | Useful if identity and subnames become part of assigning or managing jobs | Central use of ENSv2 features, functional resolution, a live demo, and open source code. Replacing an address label alone is insufficient for the stated track |
| Chainlink CRE | A possible later fit for evidence or payment orchestration | A meaningful workflow connecting a blockchain to an external system, with the required successful CLI simulation or deployment |
| Chainlink CCIP | Fits a cross-chain payment product only if cross-chain settlement is actually needed | A CCIP-driven blockchain state change and CCIP inside the smart contracts |
| Arkiv | Possible for portable job evidence or records | Meaningful Arkiv reads and writes, required schema and feedback files, and the correct new-project or continuity category. Convex persistence alone does not satisfy it |
| Ethereum Foundation CROPS | Possible if user independence or privacy becomes a central product property | Demonstrate the chosen property end to end, including operation when the relevant infrastructure disappears, and document the tradeoffs. The Convex-backed app needs careful analysis of that dependency |

The AI-compute, social-trading, AMM, and agent-payment tracks require substantially different core behavior. Enter them when that behavior is part of the product you intend to build.

## Additions in the order I recommend

1. Rehearse the implemented real account flow, Convex authorization, and shadcn interface with two people.
2. Test the implemented job brief and deliverable submission so client work verification has clear context.
3. Exercise the implemented backend payment verification and recovery flows with confirmed testnet transactions.
4. Complete a two-wallet public testnet rehearsal and save the evidence.
5. Choose one primary sponsor track. For Arc, plan stablecoin escrow and the required Studio workflow together.
6. If expanding the payment model, consider client-verified milestone releases. Preserve the agreed rule that client work verification itself triggers payment. Cancellation and dispute handling need a separate product decision.
7. Add one justified identity integration if time permits and it strengthens the chosen workflow.
8. Prepare the final video, setup guide, architecture diagram, integration notes, and the exact sponsor checklist.

## Product claims to keep precise

We can explain that a contract holds a funded deposit and enforces the permissions written into it. We should demonstrate public transactions before claiming a live payment flow is verified.

The current client verification flow cannot promise payment when a client refuses to act. Human verification does not prove work quality. A backend-only gate does not prevent someone from directly calling a public smart contract, so an onchain restriction must be enforced by that contract if the feature depends on it.

Sponsor requirements distinguish new projects from Continuity Track entries in several places. Confirm the category with the organizers before choosing those prizes. Preserve meaningful commit history and identify the work completed during the event.

## Source and next decision

The pasted prize material is the basis for the detailed comparison. The official page was checked for consistency. Confirm the chosen track's exact requirements with its sponsor before implementation.

[Official ETHGlobal Mumbai prize requirements](https://ethglobal.com/events/mumbai/prizes)

Arc is now the selected integration target. New jobs use Arc Testnet USDC; existing Sepolia ETH jobs preserve their original behavior. Track Studio evidence, public transaction proof, and unconfirmed eligibility in 08-arc-integration.md.

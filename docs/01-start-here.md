# FairPay step by step

Read this first to understand the product and use the live account flow.

Working draft · 5 November 2026

## What FairPay does

A client creates a job and deposits its payment into an escrow contract. The assigned freelancer can see the funded amount before starting. After delivery, client verification of the work triggers payment to the freelancer's wallet.

Convex stores the accounts, private job brief, assignment, delivery link, and verification results. The Solidity contract holds the deposit and enforces submission and payout permissions.

## Prepare two accounts

Use two browser profiles with separate wallets. One represents the client and the other the freelancer. Both need test USDC on Arc Testnet for transaction gas. Request it from https://faucet.circle.com. The client also needs the agreed deposit.

1. Open FairPay and choose Create an account.
2. Choose I'm a freelancer. Enter a name and optional professional headline.
3. Choose Create freelancer account and approve the wallet sign-in message. This signature proves wallet ownership and costs no gas.
4. In the other browser profile, choose I'm a client and create the client account with a different wallet.
5. Sign in with the same wallet whenever you return. Your role and jobs are saved in Convex.

## Create and fund the job

1. In the client workspace, choose Create job.
2. Enter a short public title, the job scope and acceptance criteria, a registered freelancer, and a USDC amount with up to six decimal places.
3. Choose Send job proposal. This confirms the scope and payment from the client's side.
4. The assigned freelancer opens the proposal, reviews its scope and payment, and chooses Agree to job. Both parties have now agreed on the deal.
5. The client opens the agreed job, confirms the amount and freelancer, and connects the account's wallet.
6. Switch the wallet to Arc Testnet if requested.
7. Choose Fund job. Confirm escrow creation, permission for the exact USDC amount, and the deposit in the wallet. The token permission allows this job escrow to pull only the agreed amount.
8. Wait for confirmation and backend verification. The status becomes Funded.

Funding locks the deposit under the current contract rules. Client verification releases the payment, and this version has no refund or dispute action.

## Deliver and review

1. Open the freelancer workspace. The assigned job appears automatically.
2. Read the scope, verify Funded status, and complete the work.
3. Add an HTTPS deliverable link and a delivery note.
4. Choose Submit work for review and approve the submission transaction in the freelancer wallet.
5. Wait until the backend verifies the contract state and the app shows In review.
6. In the client workspace, open the delivery link and review the work.
7. Choose Verify work & release payment and confirm the transaction in the client wallet. Verification and payout happen together in this transaction, with no separate payment step.
8. Wait for Paid status and inspect the contract through its explorer link.

## Understand each status

| Status | Meaning | Next action |
| --- | --- | --- |
| Awaiting agreement | The client has proposed the scope and payment | Assigned freelancer agrees |
| Deal agreed | Both parties have accepted the job | Client locks the payment in escrow |
| Funded | The contract holds the agreed deposit | Freelancer delivers and submits |
| In review | The freelancer confirmed submission onchain | Client verifies the work, triggering payment |
| Paid | The contract released the deposit | Both parties can inspect the completed job |

## Recover an interrupted action

If the wallet rejected a request before broadcasting it, correct the issue and retry. If a transaction was broadcast, preserve its hash and check its receipt before sending another deposit.

For funding, open the job and choose Verify funding with the confirmed deployment hash. A created escrow can still be unfunded. Choose Continue funding to resume token permission and deposit on that same contract. For a failed or cancelled recorded transaction, use Reset failed attempt. The backend checks its receipt before clearing the attempt. For submission or payout, refresh the job to read the confirmed contract status. Existing Sepolia ETH jobs keep their original network and amounts; do not fund those jobs with USDC.

If the app shows the wrong wallet, switch to the address shown in your account. A client account creates jobs, and a freelancer account receives assignments. Signing in cannot change the role saved for a wallet.

## Prepare the pitch

Read the PRD for the product requirements, then the TRD for implementation details. Use the roadmap to prioritize remaining work. Rehearse with the pitch guide, and consult the glossary and hackathon gap analysis when choosing a sponsor track.

Treat the public testnet payment flow as unverified until the two-wallet rehearsal produces confirmed transaction evidence.

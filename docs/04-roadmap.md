# FairPay delivery roadmap

What works now, what to verify next, and what to build after feedback.

Working draft · 5 November 2026 · Build and rehearsal

## Current delivery position

The agreed core flow is that both parties close the deal, the client locks the payment, and the freelancer delivers. The client verifies the work, which automatically releases payment in the same wallet transaction. Any change to these release conditions requires a separate product decision.

The app includes the Solidity escrow, Next.js interface with shadcn components, separate client and freelancer wallet signup, a deployed Convex backend, persistent private job records, delivery links, and Arc USDC wallet integration with legacy Sepolia support. Contract tests, a production build, and deployed-backend authentication and authorization checks have passed. Public testnet payment completion is pending funded wallets and a live rehearsal.

The sequence below is a proposed work order. It does not assume the event schedule, a team size, or sponsor acceptance. Complete the live payment proof before adding another payment feature.

## Before the hackathon demonstration

| Order | Work | Done when |
| --- | --- | --- |
| 1 | Walk through signup and a real job as a first-time user | A new tester registers the two roles, creates a job, and understands the funding and review actions |
| 2 | Choose the sponsor track and network | Official eligibility, deployment requirements, and submission evidence are recorded |
| 3 | Fund two test wallets | Client has deposit plus gas and freelancer has submission gas |
| 4 | Complete one live job | Funding, submission, and payout confirm on the chosen testnet |
| 5 | Prepare evidence | Save addresses and hashes, and check explorer links |
| 6 | Rehearse the pitch | The explanation and demo fit the actual allotted time |
| 7 | Prepare a recovery path | A completed job is ready to show if the network or faucet is unavailable |

## Use the rehearsal to find product gaps

- Observe where a new tester pauses or asks what escrow means.
- Ask the freelancer to find the funded amount without coaching.
- Ask the client to explain that verifying work releases payment before they click it.
- Check that both people understand they are using Arc Testnet USDC.
- Record errors, time to completion, and any confusion about which wallet acts next.
- Use the observations to revise labels and steps. Keep proposed targets separate from measured results.

## After the first working demonstration

| Priority | Candidate work | Dependency |
| --- | --- | --- |
| First | Agree on cancellation, inactivity, and dispute rules | Product decisions and a concrete threat model |
| First | Independent security review and broader contract tests | Stable contract rules and reproducible deployment |
| Implemented locally | Arc USDC escrow | Complete public testnet evidence and Studio integration |
| Next | Deliverable evidence and milestones | Privacy rules, evidence format, and partial payment model |
| Later | Account recovery, gas sponsorship, and more wallets | Validated user needs and a budget for infrastructure |
| Later | Factory deployment and indexed job discovery | Measured need for multiple jobs and cross-device access |

## Commercial questions to validate

A future fee per completed agreement or a team subscription is a business hypothesis. The prototype charges zero platform fee and has no pricing validation. Network gas still applies to live testnet transactions.

Interview freelancers and clients about their current payment process, the size of jobs they would fund, their tolerance for wallet setup, and how they expect disputes to be resolved. Record what they actually do and would pay for before presenting revenue projections.

## Decisions still open

- Which Arc bounty/entry category accepts the existing project and the new Studio integration?
- Which task type is the first intended use case?
- What happens when the client disappears after submission?
- Who can cancel a funded job before work starts?
- Who resolves a disputed delivery, and which evidence is accepted?
- Which payment asset and fee model should be tested with users?
- What evidence and review are required before handling valuable funds?

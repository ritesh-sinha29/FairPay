# FairPay

Next.js and TypeScript freelance job agreements with a Convex backend, wallet authentication, shadcn/ui, and Solidity escrow. Client and freelancer accounts use separate signup paths and a signed wallet challenge. Job records persist in Convex and synchronize across sessions.

## Start the app

Requires Node.js 20.9 or newer and a Convex account. The current workspace is connected to the FairPay development deployment.

```sh
npm install
npm run contracts:compile
npm run backend:dev
```

In a second terminal, run `npm run dev` and open http://127.0.0.1:3000.

For a fresh checkout, run `npx convex dev --configure new` to configure a deployment, then `npm run backend:auth` to configure its signing keys. The setup script sends secrets through stdin and preserves an existing complete key pair. Push the backend with `npm run backend:push`.

Convex writes the deployment URLs into `.env.local`. Keep that file out of version control. Configure `SITE_URL` on the Convex deployment for the browser origin used in wallet authentication messages. The setup defaults to `http://127.0.0.1:3000`. For hosted use, update it to the app's actual origin.

## Use FairPay

1. A freelancer signs up at `/sign-up/freelancer` with their name, optional professional headline, and wallet signature.
2. A client signs up at `/sign-up/client` with a different wallet.
3. The client creates a job with its title, scope, registered freelancer, and USDC amount. Convex saves a draft.
4. The assigned freelancer reviews and accepts the proposal. This closes the deal between both parties.
5. The client then opens the agreed job and locks its payment in a dedicated USDC escrow on Arc Testnet. Funding creates the escrow, allows the exact token amount, then locks the deposit.
6. The backend verifies the deployment code, constructor parameters, sender, deposit, and contract state before recording Funded.
7. The freelancer submits a delivery link and note, then signs the contract submission transaction.
8. The client reviews the delivery and selects Verify work & release payment. After the wallet confirms this transaction, the contract releases the deposit to the freelancer automatically. No separate payment step follows verification.

Both wallets need Arc Testnet USDC for gas, and the client also needs the agreed USDC deposit. Get test USDC from https://faucet.circle.com. Wallet signup and sign-in use message signatures and cost no gas. Job access is restricted to its registered client and freelancer.

Awaiting agreement, Deal agreed, Funded, In review, and Paid are the displayed stages. Awaiting agreement and Deal agreed are stored as Draft with an optional acceptedAt timestamp in Convex. Submitted is the Solidity state displayed as In review.

## Payment recovery

Funding requests are reserved to prevent concurrent tabs from initiating the same job's deposit. A broadcast hash is saved before waiting for confirmation. If synchronization fails, open the job and use Verify funding with the confirmed deployment hash. A replaced funding transaction can be recovered with its new hash. Reset failed attempt checks the recorded receipt before clearing a failed or cancelled attempt.

The dashboard subscribes to Convex. Refresh checks contract status through a backend action. Only internally verified updates can change a recorded payment status.

## Configuration

The Convex environment variable `SEPOLIA_RPC_URL` overrides the default public RPC used for verification. This server-side value can include a provider credential. Browser wallets use their own configured RPC for signing and broadcasting.

Authentication keys `JWT_PRIVATE_KEY` and `JWKS` live in the Convex deployment. The app never needs a user's wallet private key.

## Checks

```sh
npm run typecheck
npm run test:contract
npm run backend:push
npm run build
```

The contract tests use an in-memory Ganache chain. Authentication and authorization have also been exercised against the real development backend with temporary QA accounts, including invalid signatures, replay rejection, role restrictions, account isolation, concurrent funding reservations, and persistence across sessions.

## Project documents

Read `docs/README.md` for the walkthrough, PRD, TRD, roadmap, pitch guide, glossary, and hackathon gap analysis. These Markdown files are preparation material for the project owner.

## Current payment scope

New jobs use USDC on Arc Testnet, with release triggered by client work verification. Existing Sepolia ETH jobs retain their original contract and currency. Cancellation, refunds, deadlines, arbitration, and milestone payouts require further product and contract work. An inactive client can leave the deposit locked. The contract has not been independently audited.

A public Arc deposit, submission, and payout rehearsal still requires funded client and freelancer wallets. Arc Studio work and sponsor evidence are tracked in docs/08-arc-integration.md; eligibility and the entry category remain unconfirmed.

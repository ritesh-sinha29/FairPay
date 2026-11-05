# FairPay Web3 glossary

The terms you need to understand the build and answer technical questions.

Working draft · 5 November 2026 · Learning reference

## Payment and identity

| Term | Plain meaning | Where it appears |
| --- | --- | --- |
| Escrow | An arrangement that holds payment until agreed release conditions are met | The job deposit |
| Smart contract | Code and stored data executed on a blockchain | FairPayEscrow.sol |
| Wallet | Software that manages account keys and asks you to approve actions | MetaMask connection and signing prompts |
| Wallet address | The public identifier of an account | The assigned client and freelancer |
| Private key | Secret used to authorize account actions | Managed by the wallet |
| Contract address | The identifier of a deployed contract on a particular network | The live job link |
| ETH | The native currency used only by legacy Sepolia jobs | Deposit and wallet fees |
| USDC | The stablecoin used for new job payments on Arc; test tokens have no monetary value | Six-decimal payment amounts |
| Wei | The smallest ETH unit, with 10 to the power of 18 wei per ETH | Integer contract amounts |

## Network and transactions

| Term | Plain meaning | Where it appears |
| --- | --- | --- |
| Testnet | A blockchain used to test applications with test assets | Arc Testnet and legacy Sepolia |
| Chain ID | A numeric network identifier | 5042002 for Arc Testnet; 11155111 for legacy Sepolia |
| Gas | The computation measured for a blockchain transaction | Wallet fee estimates |
| Transaction | A signed request that can change blockchain state | Funding, submission, and payment |
| Transaction hash | An identifier used to look up a submitted transaction | The explorer link |
| Confirmation | Inclusion of a transaction in the chain, followed by additional confidence as the chain progresses | The point at which the UI updates after waiting |
| Revert | A failed contract execution that rolls back its state changes | Unauthorized action or failed payout |
| Block explorer | A website for inspecting contracts, transactions, and accounts | The job’s Arc or Sepolia transaction page |

## Application development

| Term | Plain meaning | Where it appears |
| --- | --- | --- |
| Solidity | The language used to write the escrow contract | Contract source |
| EVM | The execution environment used by Ethereum-compatible chains | Running Solidity bytecode |
| ABI | A description of a contract’s callable functions and data formats | ethers contract calls |
| Bytecode | Compiled instructions deployed as a contract | Create and fund |
| RPC | The request interface an app uses to talk to a blockchain node | Reading job state |
| Provider | The connection used to read chain data and submit requests | ethers BrowserProvider and JsonRpcProvider |
| Signer | The ethers interface that requests authorized transactions from a wallet | Client and freelancer actions |
| Onchain | Stored or executed through the blockchain | Deposit, role checks, and job status |
| Offchain | Stored or performed outside the blockchain | UI, browser snapshots, and work delivery |
| Event | A contract log that applications and explorers can inspect | WorkSubmitted and PaymentReleased |
| PRD | Product requirements document | What we are building, for whom, and how success is judged |
| TRD | Technical requirements document | How the system behaves and how the implementation is checked |

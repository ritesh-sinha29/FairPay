import fs from "node:fs";
import solc from "solc";

const source = fs.readFileSync(
  new URL("../contracts/FairPayEscrow.sol", import.meta.url),
  "utf8",
);
const input = {
  language: "Solidity",
  sources: { "FairPayEscrow.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
      },
    },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors =
  output.errors?.filter((error) => error.severity === "error") ?? [];
if (errors.length)
  throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
const contract = output.contracts["FairPayEscrow.sol"].FairPayEscrow;
const artifact = {
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
};
fs.mkdirSync(new URL("../src/lib/", import.meta.url), { recursive: true });
// Legacy deployments must keep their original bytecode, including metadata.
// Recompiling CRLF source on an LF checkout changes metadata and breaks recovery.
const legacyArtifactPath = new URL(
  "../src/lib/escrow-artifact.json",
  import.meta.url,
);
if (!fs.existsSync(legacyArtifactPath))
  throw new Error(
    "Restore the pinned legacy escrow artifact from version control.",
  );
const pinnedLegacyArtifact = JSON.parse(
  fs.readFileSync(legacyArtifactPath, "utf8"),
);
if (JSON.stringify(pinnedLegacyArtifact.abi) !== JSON.stringify(artifact.abi))
  throw new Error(
    "Legacy contract ABI changed. Create a versioned contract instead of replacing a deployed contract.",
  );
console.log(
  "Checked legacy escrow ABI; preserved its pinned deployment artifact.",
);

const stableSource = fs.readFileSync(
  new URL("../contracts/FairPayStableEscrow.sol", import.meta.url),
  "utf8",
);
const stableInput = {
  ...input,
  sources: { "FairPayStableEscrow.sol": { content: stableSource } },
};
const stableOutput = JSON.parse(
  solc.compile(JSON.stringify(stableInput), {
    import: (path) => {
      if (!path.startsWith("@openzeppelin/contracts/") || path.includes(".."))
        return { error: "Unsupported import" };
      return {
        contents: fs.readFileSync(
          new URL(`../node_modules/${path}`, import.meta.url),
          "utf8",
        ),
      };
    },
  }),
);
const stableErrors =
  stableOutput.errors?.filter((error) => error.severity === "error") ?? [];
if (stableErrors.length)
  throw new Error(
    stableErrors.map((error) => error.formattedMessage).join("\n"),
  );
const stable =
  stableOutput.contracts["FairPayStableEscrow.sol"].FairPayStableEscrow;
fs.writeFileSync(
  new URL("../src/lib/stable-escrow-artifact.json", import.meta.url),
  JSON.stringify(
    {
      abi: stable.abi,
      bytecode: `0x${stable.evm.bytecode.object}`,
      deployedBytecode: `0x${stable.evm.deployedBytecode.object}`,
    },
    null,
    2,
  ) + "\n",
);
console.log("Compiled FairPayStableEscrow with OpenZeppelin SafeERC20");

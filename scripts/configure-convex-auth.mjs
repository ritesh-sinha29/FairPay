import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";

const cli = "node_modules/convex/bin/main.js";
function get(name) {
  const result = spawnSync(process.execPath, [cli, "env", "get", name], {
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0 ? result.stdout.trim() : "";
}
function set(name, value) {
  const result = spawnSync(process.execPath, [cli, "env", "set", name], {
    input: value,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error(
      `Could not configure ${name}. Check Convex project access.`,
    );
  console.log(`Configured ${name}.`);
}

const existingPrivate = get("JWT_PRIVATE_KEY");
const existingPublic = get("JWKS");
if (!!existingPrivate !== !!existingPublic)
  throw new Error(
    "The deployment has incomplete signing keys. Repair its auth configuration before running this setup.",
  );
if (!existingPrivate) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  set(
    "JWT_PRIVATE_KEY",
    privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
  );
  set(
    "JWKS",
    JSON.stringify({
      keys: [
        { ...publicKey.export({ format: "jwk" }), use: "sig", alg: "RS256" },
      ],
    }),
  );
} else console.log("Preserved existing authentication keys.");
if (!get("SITE_URL"))
  set("SITE_URL", process.env.FAIRPAY_SITE_URL || "http://127.0.0.1:3000");
console.log(
  "Convex wallet authentication configured. Signing keys were kept out of files and command arguments.",
);

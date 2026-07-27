import { execSync } from "node:child_process";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

export function loadActiveKeypair(privateKey?: string): Ed25519Keypair {
  if (privateKey) {
    if (privateKey.startsWith("suiprivkey")) {
      const decoded = decodeSuiPrivateKey(privateKey);
      return Ed25519Keypair.fromSecretKey(decoded.secretKey);
    }
    const normalized = privateKey.replace(/^0x/, "");
    return Ed25519Keypair.fromSecretKey(Buffer.from(normalized, "hex"));
  }

  const addresses = JSON.parse(
    execSync("sui client addresses --json", { encoding: "utf8" }),
  ) as {
    activeAddress: string;
    addresses: Array<[string, string]>;
  };

  const alias =
    addresses.addresses.find(([, address]) => address === addresses.activeAddress)?.[0] ??
    addresses.activeAddress;

  const exported = JSON.parse(
    execSync(`sui keytool export --key-identity ${alias} --json`, { encoding: "utf8" }),
  ) as { exportedPrivateKey: string };

  const decoded = decodeSuiPrivateKey(exported.exportedPrivateKey);
  return Ed25519Keypair.fromSecretKey(decoded.secretKey);
}

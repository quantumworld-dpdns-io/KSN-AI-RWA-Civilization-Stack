import { execFileSync } from "node:child_process";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const GQL = "https://graphql.testnet.sui.io/graphql";
async function gql(query, variables) {
  const r = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors?.length) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const exported = JSON.parse(
  execFileSync(
    "sui",
    ["keytool", "export", "--key-identity", "0x82b4c1171c247f47c42b43acb3fe743465819743e6fae05c81ba6b9396221103", "--json"],
    { encoding: "utf8" },
  ),
).exportedPrivateKey;
const kp = Ed25519Keypair.fromSecretKey(exported);
const sender = kp.getPublicKey().toSuiAddress();

const PKG = "0x0ac3b62c02b2b492b965268fe641b000d0dadafad0af028c3f9d5595c176efac";
const GRID = "0x449e995995d499f18217d02a4c32670010945527519f6a72f8d9929b5acca182";
const CAP = "0xbfad9341ec22c05c1a721b4a0b655725fecf615e46c1e24a6927fbe1aa0a082e";

const { SuiGrpcClient } = await import("@mysten/sui/grpc");
const grpc = new SuiGrpcClient({ network: "testnet", baseUrl: "https://fullnode.testnet.sui.io:443" });

const cap = (await grpc.core.getObject({ objectId: CAP })).object;
const coins = (await grpc.core.getCoins({ address: sender, coinType: "0x2::sui::SUI" })).objects;
const gasPrice = (await grpc.core.getReferenceGasPrice()).referenceGasPrice;
const gas = coins.sort((a, b) => Number(BigInt(b.balance) - BigInt(a.balance)))[0];
console.log("cap:", cap.id, cap.version, "gas:", gas.id, gas.balance, "price:", gasPrice);

const tx = new Transaction();
tx.setSender(sender);
tx.setGasBudget(50_000_000);
tx.setGasPrice(gasPrice);
tx.setGasPayment([{ objectId: gas.id, version: gas.version, digest: gas.digest }]);
tx.moveCall({
  target: `${PKG}::microgrid::distribute_planetary_dividend_auto`,
  arguments: [
    tx.sharedObjectRef({ objectId: GRID, initialSharedVersion: 349181895, mutable: true }),
    tx.objectRef({ objectId: cap.id, version: cap.version, digest: cap.digest }),
    tx.pure.u64(1n),
  ],
});

const bytes = await tx.build();
console.log("built bytes:", bytes.length);
const { signature } = await kp.signTransaction(bytes);
const b64 = Buffer.from(bytes).toString("base64");

const exec = await gql(
  "mutation($tx:Base64!,$sigs:[String!]!){executeTransaction(transactionDataBcs:$tx,signatures:$sigs){effects{status digest executionError}}}",
  { tx: b64, sigs: [signature] },
);
console.log("exec:", JSON.stringify(exec));

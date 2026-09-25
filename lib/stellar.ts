import {
  Asset,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "./env";

export const horizon = new Horizon.Server(env.HORIZON_URL, {
  allowHttp: env.HORIZON_URL.startsWith("http://"),
});

export const NETWORK_PASSPHRASE =
  env.STELLAR_NETWORK === "TESTNET"
    ? Networks.TESTNET
    : Networks.PUBLIC;

export function tmxnAsset() {
  return new Asset(env.ASSET_CODE, env.ISSUER_PUBLIC_KEY);
}

export async function sendTmxn(
  destination: string,
  amount: string,
  memo?: string
): Promise<string> {
  const distKeypair = Keypair.fromSecret(env.DISTRIBUTION_SECRET_KEY);
  const distAccount = await horizon.loadAccount(env.DISTRIBUTION_PUBLIC_KEY);
  const asset = tmxnAsset();

  let txBuilder = new TransactionBuilder(distAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({ destination, asset, amount })
  );

  if (memo) {
    const { Memo } = await import("@stellar/stellar-sdk");
    txBuilder = txBuilder.addMemo(Memo.text(memo));
  }

  const tx = txBuilder.setTimeout(30).build();
  tx.sign(distKeypair);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

export async function friendbot(account: string) {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(account)}`
  );
  if (!res.ok) throw new Error(`Friendbot failed: ${res.status}`);
  return res.json();
}

export async function ensureTrustline(
  account: string,
  secretKey: string
): Promise<void> {
  const kp = Keypair.fromSecret(secretKey);
  const acc = await horizon.loadAccount(account);
  const asset = tmxnAsset();
  const hasTrustline = acc.balances.some(
    (b: { asset_type: string; asset_code?: string; asset_issuer?: string }) =>
      b.asset_type !== "native" &&
      b.asset_code === asset.getCode() &&
      b.asset_issuer === asset.getIssuer()
  );
  if (hasTrustline) return;
  const tx = new TransactionBuilder(acc, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(30)
    .build();
  tx.sign(kp);
  await horizon.submitTransaction(tx);
}

/** Busca el último pago recibido por `destination` desde `source` con `memo` */
export async function findIncomingPayment(
  destination: string,
  source: string,
  memo: string,
  assetCode: string
): Promise<{ txHash: string; amount: string } | null> {
  const payments = await horizon
    .payments()
    .forAccount(destination)
    .order("desc")
    .limit(50)
    .call();

  for (const p of payments.records) {
    if (
      p.type !== "payment" ||
      (p as { asset_code?: string }).asset_code !== assetCode
    )
      continue;
    if ((p as { from: string }).from !== source) continue;
    // Check memo on the parent transaction
    const txResp = await fetch(
      `${env.HORIZON_URL}/transactions/${p.transaction_hash}`
    );
    if (!txResp.ok) continue;
    const txData = await txResp.json();
    if (txData.memo === memo || txData.memo_type === "none") {
      return {
        txHash: p.transaction_hash,
        amount: (p as { amount: string }).amount,
      };
    }
  }
  return null;
}

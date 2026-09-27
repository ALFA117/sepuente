// Crea un depósito SEP-24 y verifica que su more_info_url responda HTML 200.
// Uso: node scripts/check-more-info.mjs [baseUrl]
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";

const BASE = (process.argv[2] ?? "https://sepuente.vercel.app").replace(/\/$/, "");
const kp = Keypair.random();
const ch = await (await fetch(`${BASE}/auth?account=${kp.publicKey()}`)).json();
const tx = TransactionBuilder.fromXDR(ch.transaction, ch.network_passphrase);
tx.sign(kp);
const { token } = await (await fetch(`${BASE}/auth`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: `transaction=${encodeURIComponent(tx.toEnvelope().toXDR("base64"))}`,
})).json();
const fd = new FormData();
fd.append("asset_code", "TMXN");
const dep = await (await fetch(`${BASE}/sep24/transactions/deposit/interactive`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd })).json();
const { transaction } = await (await fetch(`${BASE}/sep24/transaction?id=${dep.id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
console.log("transaction:", JSON.stringify(transaction));
const t0 = Date.now();
const res = await fetch(transaction.more_info_url, { redirect: "manual" });
const body = await res.text();
console.log("more_info:", res.status, res.headers.get("content-type"), `${body.length} bytes`, `${Date.now() - t0} ms`, res.headers.get("location") ?? "");

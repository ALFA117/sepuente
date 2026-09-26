// Recorre depósito y retiro completos contra una instancia de SEPuente en Stellar testnet.
// Uso: node scripts/e2e-testnet.mjs [baseUrl]   (por defecto http://localhost:3000)
import { Keypair, TransactionBuilder, Networks, Operation, Asset, Memo, Horizon } from "@stellar/stellar-sdk";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

async function call(path, init) {
  const res = await fetch(BASE + path, init);
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 200) }; }
  if (!res.ok || data.error) throw new Error(`${path} → ${res.status} ${JSON.stringify(data)}`);
  return data;
}
const post = (path, body, headers = {}) =>
  call(path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("•", ...a);

const toml = await (await fetch(BASE + "/.well-known/stellar.toml")).text();
const issuer = toml.match(/code = "TMXN"\s*\nissuer = "(G[A-Z0-9]{55})"/)?.[1];
log("issuer", issuer);
const asset = new Asset("TMXN", issuer);

const kp = Keypair.random();
log("wallet", kp.publicKey());
await post("/api/faucet", { account: kp.publicKey() });
log("faucet ok");

let acc = await horizon.loadAccount(kp.publicKey());
let tx = new TransactionBuilder(acc, { fee: "100000", networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.changeTrust({ asset })).setTimeout(60).build();
tx.sign(kp);
await horizon.submitTransaction(tx);
log("trustline ok");

const ch = await call(`/auth?account=${kp.publicKey()}`);
const chTx = TransactionBuilder.fromXDR(ch.transaction, ch.network_passphrase);
chTx.sign(kp);
const { token: jwt } = await post("/auth", { transaction: chTx.toEnvelope().toXDR("base64"), network_passphrase: ch.network_passphrase });
log("sep10 ok");
const auth = { Authorization: `Bearer ${jwt}` };

// ── Depósito
const dep = await post("/sep24/transactions/deposit/interactive", { asset_code: "TMXN", amount: "150" }, auth);
const depToken = new URL(dep.url).searchParams.get("token");
const q = await post("/api/sep24", { action: "quote", sell_amount: "150" });
log("quote", q.buy_amount, "sandbox", q.sandbox);
const instr = await post("/api/sep24", { action: "start_deposit", amount: "150", token: depToken });
const instr2 = await post("/api/sep24", { action: "start_deposit", amount: "150", token: depToken });
if (instr.reference !== instr2.reference) throw new Error("start_deposit no es idempotente");
log("deposit instructions", instr.clabe, instr.reference);
const [s1, s2] = await Promise.allSettled([
  post("/api/sep24", { action: "simulate", token: depToken }),
  post("/api/sep24", { action: "simulate", token: depToken }),
]);
log("simulate x2 →", s1.status, s2.status, s2.reason?.message ?? s1.reason?.message ?? "");
if ([s1, s2].filter((s) => s.status === "fulfilled").length !== 1) throw new Error("simulate debe tener éxito exactamente una vez");
const depTx = await call(`/sep24/transaction?id=${dep.id}`, { headers: auth });
log("deposit status", depTx.transaction.status, depTx.transaction.stellar_transaction_url);
acc = await horizon.loadAccount(kp.publicKey());
const bal = acc.balances.find((b) => b.asset_code === "TMXN")?.balance;
log("TMXN balance", bal);

// ── Retiro
const wd = await post("/sep24/transactions/withdraw/interactive", { asset_code: "TMXN", amount: "50" }, auth);
const wdToken = new URL(wd.url).searchParams.get("token");
const wi = await post("/api/sep24", { action: "start_withdraw", amount: "50", clabe: "646180157000000004", token: wdToken });
log("withdraw instructions", wi.anchor_account, wi.anchor_memo);
const wdInfo = await call(`/sep24/transaction?id=${wd.id}`, { headers: auth });
if (wdInfo.transaction.withdraw_anchor_account !== wi.anchor_account) throw new Error("withdraw_anchor_account faltante");
acc = await horizon.loadAccount(kp.publicKey());
tx = new TransactionBuilder(acc, { fee: "100000", networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.payment({ destination: wi.anchor_account, asset, amount: "50" }))
  .addMemo(Memo.text(wi.anchor_memo)).setTimeout(60).build();
tx.sign(kp);
const paid = await horizon.submitTransaction(tx);
log("withdraw payment", paid.hash);
let status = "";
for (let i = 0; i < 10 && status !== "completed"; i++) {
  await sleep(3000);
  status = (await post("/api/sep24", { action: "status", token: wdToken })).transaction.status;
}
log("withdraw status", status);
if (status !== "completed") throw new Error("el retiro no se completó");
const list = await call("/sep24/transactions", { headers: auth });
log("history", list.transactions.map((t) => `${t.kind}:${t.status}:${t.amount_in}->${t.amount_out}`).join(" | "));
console.log("\nE2E OK");

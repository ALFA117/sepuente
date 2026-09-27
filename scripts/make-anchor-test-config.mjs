// Prepara una cuenta de testnet con transacciones SEP-24 en cada estado y escribe el
// archivo --sep-config para @stellar/anchor-tests.
// Uso: node scripts/make-anchor-test-config.mjs <baseUrl> <salida.json>
// La llave generada es de una cuenta desechable de testnet: no guardes el archivo en el repo.
import { writeFileSync } from "fs";
import { Keypair, TransactionBuilder, Networks, Operation, Asset, Memo, Horizon } from "@stellar/stellar-sdk";

const BASE = (process.argv[2] ?? "https://sepuente.vercel.app").replace(/\/$/, "");
const OUT = process.argv[3];
if (!OUT) throw new Error("Falta la ruta de salida");
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(path, init) {
  const res = await fetch(BASE + path, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok || data.error) throw new Error(`${path} → ${res.status} ${text}`);
  return data;
}
const post = (path, body, headers = {}) =>
  call(path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

const toml = await (await fetch(`${BASE}/.well-known/stellar.toml`)).text();
const issuer = toml.match(/code = "TMXN"\s*\nissuer = "(G[A-Z0-9]{55})"/)[1];
const asset = new Asset("TMXN", issuer);
const kp = Keypair.random();

await post("/api/faucet", { account: kp.publicKey() });
let acc = await horizon.loadAccount(kp.publicKey());
let tx = new TransactionBuilder(acc, { fee: "100000", networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.changeTrust({ asset })).setTimeout(60).build();
tx.sign(kp);
await horizon.submitTransaction(tx);

const ch = await call(`/auth?account=${kp.publicKey()}`);
const chTx = TransactionBuilder.fromXDR(ch.transaction, ch.network_passphrase);
chTx.sign(kp);
const { token } = await post("/auth", { transaction: chTx.toEnvelope().toXDR("base64") });
const auth = { Authorization: `Bearer ${token}` };
const getTx = async (id) => (await call(`/sep24/transaction?id=${id}`, { headers: auth })).transaction;

async function start(kind, amount, extra = {}) {
  const r = await post(`/sep24/transactions/${kind}/interactive`, { asset_code: "TMXN", amount }, auth);
  const session = new URL(r.url).searchParams.get("token");
  const data = await post("/api/sep24", { action: kind === "deposit" ? "start_deposit" : "start_withdraw", amount, token: session, ...extra });
  return { id: r.id, session, data };
}

// 1) Depósito pendiente (esperando el SPEI)
const depPending = await start("deposit", "120");
// 2) Depósito completado
const depDone = await start("deposit", "300");
await post("/api/sep24", { action: "simulate", token: depDone.session });
// 3) Retiro esperando el pago en Stellar
const wdPending = await start("withdraw", "50", { clabe: "646180157000000004" });
// 4) Retiro completado: la wallet paga al anchor con el memo
const wdDone = await start("withdraw", "60", { clabe: "646180157000000004" });
acc = await horizon.loadAccount(kp.publicKey());
tx = new TransactionBuilder(acc, { fee: "100000", networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.payment({ destination: wdDone.data.anchor_account, asset, amount: "60" }))
  .addMemo(Memo.text(wdDone.data.anchor_memo)).setTimeout(60).build();
tx.sign(kp);
await horizon.submitTransaction(tx);
let wdDoneTx;
for (let i = 0; i < 15; i++) {
  await sleep(3000);
  wdDoneTx = await getTx(wdDone.id);
  if (wdDoneTx.status === "completed") break;
}

const [a, b, c] = await Promise.all([getTx(depPending.id), getTx(depDone.id), getTx(wdPending.id)]);
const config = {
  "24": {
    account: { publicKey: kp.publicKey(), secretKey: kp.secret() },
    depositPendingTransaction: { id: a.id, status: a.status },
    depositCompletedTransaction: { id: b.id, status: b.status, stellar_transaction_id: b.stellar_transaction_id },
    withdrawPendingUserTransferStartTransaction: {
      id: c.id, status: c.status, amount_in: c.amount_in, amount_in_asset: c.amount_in_asset,
      withdraw_anchor_account: c.withdraw_anchor_account, withdraw_memo: c.withdraw_memo, withdraw_memo_type: c.withdraw_memo_type,
    },
    withdrawCompletedTransaction: { id: wdDoneTx.id, status: wdDoneTx.status, stellar_transaction_id: wdDoneTx.stellar_transaction_id },
  },
  "38": { contexts: ["sep6"] },
};
writeFileSync(OUT, JSON.stringify(config, null, 2));
console.log("estados:", a.status, "|", b.status, "|", c.status, "|", wdDoneTx.status);
console.log("config escrita en", OUT);

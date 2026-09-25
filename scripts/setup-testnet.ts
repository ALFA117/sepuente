#!/usr/bin/env tsx
/**
 * setup-testnet.ts
 * Genera cuentas Stellar para SEPuente en testnet y las configura.
 * Uso: npm run setup-testnet
 * Las variables impresas al final deben copiarse a .env.local
 */

import {
  Keypair,
  Networks,
  Asset,
  TransactionBuilder,
  Operation,
  Horizon,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const ASSET_CODE = "TMXN";
const INITIAL_SUPPLY = "1000000"; // 1M TMXN para testnet
const HOME_DOMAIN = process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") ?? "sepuente.vercel.app";

const server = new Horizon.Server(HORIZON_URL);

async function friendbot(account: string): Promise<void> {
  console.log(`  ⏳ Fondeando ${account.slice(0, 8)}… con Friendbot…`);
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(account)}`
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Friendbot falló para ${account}: ${body}`);
  }
  console.log(`  ✓ Fondeado`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("\n🌉 SEPuente – Setup Testnet\n");

  // ── Genera keypairs ──────────────────────────────────────────────────
  const signingKp = Keypair.random();
  const issuerKp = Keypair.random();
  const distKp = Keypair.random();

  console.log("Keypairs generados:");
  console.log(`  SIGNING:      ${signingKp.publicKey()}`);
  console.log(`  ISSUER:       ${issuerKp.publicKey()}`);
  console.log(`  DISTRIBUTION: ${distKp.publicKey()}\n`);

  // ── Fondea ISSUER y DISTRIBUTION con Friendbot ───────────────────────
  await friendbot(issuerKp.publicKey());
  await sleep(2000);
  await friendbot(distKp.publicKey());
  await sleep(2000);

  // ── Crea trustline de DISTRIBUTION → activo TMXN ────────────────────
  const asset = new Asset(ASSET_CODE, issuerKp.publicKey());
  const distAccount = await server.loadAccount(distKp.publicKey());

  console.log("  ⏳ Creando trustline DISTRIBUTION → TMXN…");
  const trustTx = new TransactionBuilder(distAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset, limit: "100000000" }))
    .setTimeout(30)
    .build();
  trustTx.sign(distKp);
  await server.submitTransaction(trustTx);
  console.log("  ✓ Trustline creada\n");

  await sleep(2000);

  // ── Emite suministro inicial desde ISSUER → DISTRIBUTION ─────────────
  const issuerAccount = await server.loadAccount(issuerKp.publicKey());

  console.log(`  ⏳ Emitiendo ${INITIAL_SUPPLY} ${ASSET_CODE} desde ISSUER…`);
  const issueTx = new TransactionBuilder(issuerAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: distKp.publicKey(),
        asset,
        amount: INITIAL_SUPPLY,
      })
    )
    .setTimeout(30)
    .build();
  issueTx.sign(issuerKp);
  await server.submitTransaction(issueTx);
  console.log(`  ✓ ${INITIAL_SUPPLY} ${ASSET_CODE} emitidos a DISTRIBUTION\n`);

  await sleep(2000);

  // ── Fija home_domain del ISSUER ──────────────────────────────────────
  const issuerAccount2 = await server.loadAccount(issuerKp.publicKey());
  console.log(`  ⏳ Fijando home_domain="${HOME_DOMAIN}" en cuenta ISSUER…`);
  const domainTx = new TransactionBuilder(issuerAccount2, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.setOptions({ homeDomain: HOME_DOMAIN })
    )
    .setTimeout(30)
    .build();
  domainTx.sign(issuerKp);
  await server.submitTransaction(domainTx);
  console.log("  ✓ home_domain fijado\n");

  // ── Imprime variables de entorno ─────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Copia estas variables a .env.local (NO las compartas):\n");
  console.log(`SIGNING_PUBLIC_KEY=${signingKp.publicKey()}`);
  console.log(`SIGNING_SECRET_KEY=${signingKp.secret()}`);
  console.log(`ISSUER_PUBLIC_KEY=${issuerKp.publicKey()}`);
  console.log(`ISSUER_SECRET_KEY=${issuerKp.secret()}`);
  console.log(`DISTRIBUTION_PUBLIC_KEY=${distKp.publicKey()}`);
  console.log(`DISTRIBUTION_SECRET_KEY=${distKp.secret()}`);
  console.log(`ASSET_CODE=${ASSET_CODE}`);
  console.log(`STELLAR_NETWORK=TESTNET`);
  console.log(`NETWORK_PASSPHRASE="Test SDF Network ; September 2015"`);
  console.log(`HORIZON_URL=https://horizon-testnet.stellar.org`);
  console.log(`NEXT_PUBLIC_ISSUER_PUBLIC_KEY=${issuerKp.publicKey()}`);
  console.log(`NEXT_PUBLIC_ASSET_CODE=${ASSET_CODE}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("✅ Setup completo. Verifica en:");
  console.log(`   https://stellar.expert/explorer/testnet/account/${distKp.publicKey()}\n`);
}

main().catch((e) => {
  console.error("Error en setup:", e);
  process.exit(1);
});

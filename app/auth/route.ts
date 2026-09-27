import { NextRequest } from "next/server";
import {
  Account,
  BASE_FEE,
  Keypair,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder,
  WebAuth,
} from "@stellar/stellar-sdk";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { signSep10 } from "@/lib/jwt";
import { env } from "@/lib/env";
import { horizon, NETWORK_PASSPHRASE } from "@/lib/stellar";

export const dynamic = "force-dynamic";

const HOME_DOMAIN = env.APP_URL.replace(/^https?:\/\//, "");
const WEB_AUTH_DOMAIN = HOME_DOMAIN;
const CHALLENGE_TTL = 900; // 15 min

export async function OPTIONS() {
  return optionsResponse();
}

/** Lee SIGNING_KEY del stellar.toml del dominio de la wallet (para `client_domain`). */
async function clientDomainSigningKey(clientDomain: string): Promise<string> {
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(clientDomain)) throw new Error("Invalid client_domain");
  const res = await fetch(`https://${clientDomain}/.well-known/stellar.toml`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Could not fetch stellar.toml from client_domain (${res.status})`);
  const toml = await res.text();
  const key = toml.match(/^\s*SIGNING_KEY\s*=\s*"(G[A-Z2-7]{55})"/m)?.[1];
  if (!key || !StrKey.isValidEd25519PublicKey(key)) throw new Error("client_domain stellar.toml has no valid SIGNING_KEY");
  return key;
}

/** GET /auth — genera el challenge transaction (SEP-10). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const account = q.get("account");
  const memo = q.get("memo");
  const homeDomain = q.get("home_domain");
  const clientDomain = q.get("client_domain");

  if (!account) return jsonCors({ error: "Missing 'account' query param" }, 400);
  if (!StrKey.isValidEd25519PublicKey(account)) return jsonCors({ error: "Invalid 'account': must be a G... public key" }, 400);
  if (homeDomain && homeDomain !== HOME_DOMAIN) return jsonCors({ error: `Unsupported 'home_domain'. Use ${HOME_DOMAIN}` }, 400);
  if (memo && !/^\d{1,20}$/.test(memo)) return jsonCors({ error: "Invalid 'memo': must be a positive integer (ID memo)" }, 400);

  try {
    const signingKp = Keypair.fromSecret(env.SIGNING_SECRET_KEY);
    const now = Math.floor(Date.now() / 1000);
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64");

    let builder = new TransactionBuilder(new Account(signingKp.publicKey(), "-1"), {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      // SEP-10: minTime es el momento en que se emite el reto (reloj del servidor, sincronizado por NTP).
      timebounds: { minTime: now, maxTime: now + CHALLENGE_TTL },
    })
      .addOperation(Operation.manageData({ name: `${HOME_DOMAIN} auth`, value: nonce, source: account }))
      .addOperation(Operation.manageData({ name: "web_auth_domain", value: WEB_AUTH_DOMAIN, source: signingKp.publicKey() }));

    if (clientDomain) {
      const clientKey = await clientDomainSigningKey(clientDomain);
      builder = builder.addOperation(Operation.manageData({ name: "client_domain", value: clientDomain, source: clientKey }));
    }
    if (memo) builder = builder.addMemo(Memo.id(memo));

    const tx = builder.build();
    tx.sign(signingKp);

    return jsonCors({
      transaction: tx.toEnvelope().toXDR("base64"),
      network_passphrase: NETWORK_PASSPHRASE,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({ error: msg }, clientDomain ? 400 : 500);
  }
}

/** Acepta el cuerpo como JSON, application/x-www-form-urlencoded o multipart (SEP-10 exige los dos primeros). */
async function readBody(req: NextRequest): Promise<Record<string, string> | null> {
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const data = await req.json();
      return data && typeof data === "object" ? data : null;
    }
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const out: Record<string, string> = {};
      fd.forEach((v, k) => { out[k] = String(v); });
      return out;
    }
    const text = await req.text();
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) return JSON.parse(trimmed);
    return Object.fromEntries(new URLSearchParams(text));
  } catch {
    return null;
  }
}

/** POST /auth — verifica el challenge firmado y emite el JWT (SEP-10). */
export async function POST(req: NextRequest) {
  const body = await readBody(req);
  if (!body) return jsonCors({ error: "Invalid request body" }, 400);

  const { transaction, network_passphrase } = body;
  if (!transaction) return jsonCors({ error: "Missing 'transaction'" }, 400);
  if (network_passphrase && network_passphrase !== NETWORK_PASSPHRASE) {
    return jsonCors({ error: "Wrong network_passphrase" }, 400);
  }

  try {
    const serverKey = Keypair.fromSecret(env.SIGNING_SECRET_KEY).publicKey();
    const { tx, clientAccountID, memo } = WebAuth.readChallengeTx(
      transaction,
      serverKey,
      NETWORK_PASSPHRASE,
      HOME_DOMAIN,
      WEB_AUTH_DOMAIN
    );

    const clientDomainOp = tx.operations.find((op) => op.type === "manageData" && op.name === "client_domain");
    const clientDomain = clientDomainOp && "value" in clientDomainOp && clientDomainOp.value ? clientDomainOp.value.toString() : undefined;

    // Cuenta existente: se valida contra sus firmantes reales y el umbral medio (multisig).
    // Cuenta inexistente: solo la llave maestra puede firmar.
    const account = await horizon.loadAccount(clientAccountID).catch((e: { response?: { status?: number } }) => {
      if (e?.response?.status === 404) return null;
      throw e;
    });

    if (account) {
      const signers = account.signers;
      WebAuth.verifyChallengeTxThreshold(
        transaction,
        serverKey,
        NETWORK_PASSPHRASE,
        account.thresholds.med_threshold,
        signers,
        HOME_DOMAIN,
        WEB_AUTH_DOMAIN
      );
    } else {
      WebAuth.verifyChallengeTxSigners(transaction, serverKey, NETWORK_PASSPHRASE, [clientAccountID], HOME_DOMAIN, WEB_AUTH_DOMAIN);
    }

    const token = await signSep10(memo ? `${clientAccountID}:${memo}` : clientAccountID, {
      clientDomain,
      jti: tx.hash().toString("hex"),
    });
    return jsonCors({ token });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({ error: msg }, 400);
  }
}

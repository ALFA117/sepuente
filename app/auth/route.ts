import { NextRequest } from "next/server";
import { WebAuth, Networks, Keypair } from "@stellar/stellar-sdk";
import { jsonCors, optionsResponse } from "@/lib/cors";

const { buildChallengeTx, verifyChallengeTxSigners } = WebAuth;
import { signSep10 } from "@/lib/jwt";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const domain = env.APP_URL.replace("https://", "").replace("http://", "");
const networkPassphrase =
  env.STELLAR_NETWORK === "TESTNET" ? Networks.TESTNET : Networks.PUBLIC;

export async function OPTIONS() {
  return optionsResponse();
}

/** GET /auth — genera el challenge transaction */
export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");
  const clientDomain = req.nextUrl.searchParams.get("client_domain") ?? undefined;

  if (!account) {
    return jsonCors({ error: "Missing 'account' query param" }, 400);
  }

  if (!account.startsWith("G") || account.length !== 56) {
    return jsonCors({ error: "Invalid Stellar account" }, 400);
  }

  try {
    const signingKp = Keypair.fromSecret(env.SIGNING_SECRET_KEY);
    const tx = buildChallengeTx(
      signingKp,
      account,
      domain,
      300, // 5 min
      networkPassphrase,
      domain,        // web_auth_domain
      undefined,
      undefined,
      clientDomain
    );

    return jsonCors({
      transaction: tx,
      network_passphrase: networkPassphrase,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({ error: msg }, 500);
  }
}

/** POST /auth — verifica la firma y emite JWT */
export async function POST(req: NextRequest) {
  let body: { transaction?: string; network_passphrase?: string };
  try {
    body = await req.json();
  } catch {
    return jsonCors({ error: "Invalid JSON body" }, 400);
  }

  const { transaction, network_passphrase } = body;
  if (!transaction) {
    return jsonCors({ error: "Missing 'transaction'" }, 400);
  }
  if (network_passphrase && network_passphrase !== networkPassphrase) {
    return jsonCors({ error: "Wrong network_passphrase" }, 400);
  }

  try {
    const signingKp = Keypair.fromSecret(env.SIGNING_SECRET_KEY);
    const result = verifyChallengeTxSigners(
      transaction,
      signingKp.publicKey(),
      networkPassphrase,
      [domain],       // signers (el cliente es el único signer esperado)
      domain,         // homeDomains
      domain          // webAuthDomain
    );
    const account = result[0];
    if (!account) {
      return jsonCors({ error: "No valid signer found" }, 400);
    }

    const clientDomain = req.nextUrl.searchParams.get("client_domain") ?? undefined;
    const token = await signSep10(account, clientDomain);
    return jsonCors({ token });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({ error: msg }, 400);
  }
}

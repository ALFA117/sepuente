import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const secret = () => new TextEncoder().encode(env.JWT_SECRET);

export interface Sep10Claims {
  sub: string; // Stellar account G...
  iss: string;
  iat: number;
  exp: number;
  jti: string;
  client_domain?: string;
}

export async function signSep10(account: string, clientDomain?: string): Promise<string> {
  const jti = crypto.randomUUID();
  let builder = new SignJWT({ jti, client_domain: clientDomain })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.APP_URL)
    .setSubject(account)
    .setExpirationTime(`${env.JWT_EXPIRY}s`);

  return builder.sign(secret());
}

export async function verifySep10(token: string): Promise<Sep10Claims> {
  const { payload } = await jwtVerify(token, secret(), {
    issuer: env.APP_URL,
  });
  return payload as unknown as Sep10Claims;
}

/** Token de sesión corto para la UI interactiva (no es el JWT SEP-10) */
export async function signSession(txId: string): Promise<string> {
  return new SignJWT({ txId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.APP_URL)
    .setExpirationTime("1h")
    .sign(secret());
}

export async function verifySession(token: string): Promise<{ txId: string }> {
  const { payload } = await jwtVerify(token, secret(), {
    issuer: env.APP_URL,
  });
  return { txId: payload.txId as string };
}

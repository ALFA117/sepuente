import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const secret = () => {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no está configurado");
  }
  return new TextEncoder().encode(env.JWT_SECRET);
};

export interface Sep10Claims {
  sub: string; // Stellar account G...
  iss: string;
  iat: number;
  exp: number;
  jti: string;
  client_domain?: string;
}

/** JWT SEP-10. `jti` es el hash del challenge (SEP-10 §Token). */
export async function signSep10(sub: string, opts: { clientDomain?: string; jti?: string } = {}): Promise<string> {
  return new SignJWT(opts.clientDomain ? { client_domain: opts.clientDomain } : {})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(`${env.APP_URL}/auth`)
    .setSubject(sub)
    .setJti(opts.jti ?? crypto.randomUUID())
    .setExpirationTime(`${env.JWT_EXPIRY}s`)
    .sign(secret());
}

export async function verifySep10(token: string): Promise<Sep10Claims> {
  const { payload } = await jwtVerify(token, secret(), {
    issuer: [`${env.APP_URL}/auth`, env.APP_URL],
  });
  // Un token de sesión de la UI interactiva no sirve como JWT SEP-10.
  if (typeof payload.sub !== "string" || "txId" in payload) throw new Error("Not a SEP-10 token");
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
  if (typeof payload.txId !== "string" || payload.sub) throw new Error("Not a session token");
  return { txId: payload.txId };
}

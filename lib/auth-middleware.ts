import { NextRequest } from "next/server";
import { verifySep10 } from "./jwt";
import type { Sep10Claims } from "./jwt";

export type AuthedClaims = Sep10Claims & {
  /** Cuenta Stellar G... del token (sin el memo SEP-10 si lo hay): a ella van los pagos. */
  account: string;
};

export async function requireSep10(
  req: NextRequest
): Promise<{ claims: AuthedClaims } | { error: string; status: number }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return { error: "Missing Authorization header (Bearer JWT from SEP-10)", status: 403 };
  }

  try {
    const claims = await verifySep10(token);
    return { claims: { ...claims, account: claims.sub.split(":")[0] } };
  } catch {
    return { error: "Invalid or expired JWT", status: 403 };
  }
}

import { NextRequest } from "next/server";
import { verifySep10 } from "./jwt";
import type { Sep10Claims } from "./jwt";

export async function requireSep10(
  req: NextRequest
): Promise<{ claims: Sep10Claims } | { error: string; status: number }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.nextUrl.searchParams.get("Authorization") ?? "";

  if (!token) {
    return { error: "Missing Authorization header", status: 403 };
  }

  try {
    const claims = await verifySep10(token);
    return { claims };
  } catch {
    return { error: "Invalid or expired JWT", status: 403 };
  }
}

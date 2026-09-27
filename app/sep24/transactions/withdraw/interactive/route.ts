import { NextRequest } from "next/server";
import { optionsResponse } from "@/lib/cors";
import { startInteractive } from "@/lib/sep24-interactive";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

export async function POST(req: NextRequest) {
  return startInteractive(req, "withdrawal");
}

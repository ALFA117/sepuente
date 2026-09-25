import { jsonCors, optionsResponse } from "@/lib/cors";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

export async function GET() {
  return jsonCors({
    assets: [
      { asset: "iso4217:MXN" },
      { asset: `stellar:${env.ASSET_CODE}:${env.ISSUER_PUBLIC_KEY}` },
    ],
  });
}

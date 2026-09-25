import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = env.APP_URL;
  const isEtherfuse = env.DRIVER === "etherfuse";

  // TMXN (activo de prueba SEPuente)
  let currencies = `
[[CURRENCIES]]
code = "${env.ASSET_CODE}"
issuer = "${env.ISSUER_PUBLIC_KEY}"
status = "test"
display_decimals = 7
name = "Test Mexican Peso"
desc = "Token de prueba SEPuente – 1 ${env.ASSET_CODE} = 1 MXN simulado"
is_asset_anchored = true
anchor_asset_type = "fiat"
anchor_asset = "MXN"
redemption_instructions = "Usa el flujo SEP-24 de este anchor."
`;

  // Si Etherfuse driver activo, agrega su activo
  if (isEtherfuse && env.ISSUER_PUBLIC_KEY) {
    currencies += `
[[CURRENCIES]]
code = "CETES"
issuer = "${env.ISSUER_PUBLIC_KEY}"
status = "test"
display_decimals = 7
name = "CETES Tokenizados (Etherfuse Sandbox)"
desc = "Representación sandbox de CETES via Etherfuse"
is_asset_anchored = true
anchor_asset_type = "other"
`;
  }

  const toml = `
# SEPuente – Gateway open source no custodial para rampas MXN/Stellar
# https://github.com/ALFA117/sepuente

NETWORK_PASSPHRASE = "${env.NETWORK_PASSPHRASE}"
HOME_DOMAIN = "${appUrl.replace("https://", "").replace("http://", "")}"
WEB_AUTH_ENDPOINT = "${appUrl}/auth"
TRANSFER_SERVER_SEP0024 = "${appUrl}/sep24"
ANCHOR_QUOTE_SERVER = "${appUrl}/sep38"
SIGNING_KEY = "${env.SIGNING_PUBLIC_KEY}"

[DOCUMENTATION]
ORG_NAME = "SEPuente"
ORG_URL = "${appUrl}"
ORG_DESCRIPTION = "Open-source non-custodial SEP-24 anchor adapter for Mexican peso on-ramps"
ORG_GITHUB = "https://github.com/ALFA117/sepuente"

${currencies}
`.trimStart();

  return new Response(toml, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

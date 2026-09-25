// Acceso centralizado a variables de entorno (solo servidor)
export const env = {
  SIGNING_PUBLIC_KEY: process.env.SIGNING_PUBLIC_KEY ?? "",
  SIGNING_SECRET_KEY: process.env.SIGNING_SECRET_KEY ?? "",
  ISSUER_PUBLIC_KEY: process.env.ISSUER_PUBLIC_KEY ?? "",
  ISSUER_SECRET_KEY: process.env.ISSUER_SECRET_KEY ?? "",
  DISTRIBUTION_PUBLIC_KEY: process.env.DISTRIBUTION_PUBLIC_KEY ?? "",
  DISTRIBUTION_SECRET_KEY: process.env.DISTRIBUTION_SECRET_KEY ?? "",

  STELLAR_NETWORK: process.env.STELLAR_NETWORK ?? "TESTNET",
  NETWORK_PASSPHRASE:
    process.env.NETWORK_PASSPHRASE ??
    "Test SDF Network ; September 2015",
  HORIZON_URL:
    process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org",

  ASSET_CODE: process.env.ASSET_CODE ?? "TMXN",

  JWT_SECRET: process.env.JWT_SECRET ?? "dev_secret_change_me",
  JWT_EXPIRY: Number(process.env.JWT_EXPIRY ?? 86400),

  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  DRIVER: (process.env.DRIVER ?? "mock") as "mock" | "etherfuse",
  ETHERFUSE_API_KEY: process.env.ETHERFUSE_API_KEY ?? "",
  ETHERFUSE_BASE_URL:
    process.env.ETHERFUSE_BASE_URL ?? "https://sandbox.etherfuse.com",

  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

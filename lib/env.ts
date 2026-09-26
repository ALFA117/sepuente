// Acceso centralizado a variables de entorno (solo servidor).
// Se recortan espacios y saltos de línea: un "mock\n" pegado en el dashboard rompía comparaciones.
const v = (name: string, fallback = "") => (process.env[name] ?? fallback).trim();

export const env = {
  SIGNING_PUBLIC_KEY: v("SIGNING_PUBLIC_KEY"),
  SIGNING_SECRET_KEY: v("SIGNING_SECRET_KEY"),
  ISSUER_PUBLIC_KEY: v("ISSUER_PUBLIC_KEY"),
  ISSUER_SECRET_KEY: v("ISSUER_SECRET_KEY"),
  DISTRIBUTION_PUBLIC_KEY: v("DISTRIBUTION_PUBLIC_KEY"),
  DISTRIBUTION_SECRET_KEY: v("DISTRIBUTION_SECRET_KEY"),

  STELLAR_NETWORK: v("STELLAR_NETWORK", "TESTNET"),
  NETWORK_PASSPHRASE: v("NETWORK_PASSPHRASE", "Test SDF Network ; September 2015"),
  HORIZON_URL: v("HORIZON_URL", "https://horizon-testnet.stellar.org").replace(/\/$/, ""),

  ASSET_CODE: v("ASSET_CODE", "TMXN"),

  JWT_SECRET: v("JWT_SECRET", "dev_secret_change_me"),
  JWT_EXPIRY: Number(v("JWT_EXPIRY", "86400")) || 86400,

  SUPABASE_URL: v("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: v("SUPABASE_SERVICE_ROLE_KEY"),

  DRIVER: (v("DRIVER", "mock").toLowerCase() === "etherfuse" ? "etherfuse" : "mock") as "mock" | "etherfuse",
  ETHERFUSE_API_KEY: v("ETHERFUSE_API_KEY"),
  ETHERFUSE_BASE_URL: v("ETHERFUSE_BASE_URL", "https://sandbox.etherfuse.com").replace(/\/$/, ""),

  APP_URL: v("NEXT_PUBLIC_APP_URL", "http://localhost:3000").replace(/\/$/, ""),
};

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEPuente – Documentación para devs",
};

export const dynamic = "force-dynamic";

export default function DevsPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://sepuente.vercel.app";
  const assetCode = process.env.NEXT_PUBLIC_ASSET_CODE ?? "TMXN";
  const issuer = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? "<ISSUER_PUBLIC_KEY>";

  const tomlUrl = `${appUrl}/.well-known/stellar.toml`;
  const demoWallet = `https://demo-wallet.stellar.org/?home_domain=${encodeURIComponent(appUrl.replace("https://", ""))}`;
  const anchorTests = `npx -p @stellar/anchor-tests stellar-anchor-tests --home-domain ${appUrl.replace("https://", "")} --seps 1 10 24 38`;

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 64px", color: "var(--text)" }}>
      <a href="/" style={{ color: "var(--muted)", fontSize: "0.82rem" }}>← Volver</a>
      <h1 style={{ marginTop: 16, marginBottom: 4, fontFamily: "Georgia, serif", color: "var(--gold)", fontSize: "1.6rem" }}>
        SEPuente — Documentación
      </h1>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 32 }}>
        Gateway open source y no custodial · SEP-1, SEP-10, SEP-24, SEP-38
      </p>

      <Section title="Endpoints">
        <Table rows={[
          ["SEP-1", `GET ${appUrl}/.well-known/stellar.toml`],
          ["SEP-10 challenge", `GET ${appUrl}/auth?account=G...`],
          ["SEP-10 verify", `POST ${appUrl}/auth`],
          ["SEP-24 info", `GET ${appUrl}/sep24/info`],
          ["SEP-24 depósito", `POST ${appUrl}/sep24/transactions/deposit/interactive`],
          ["SEP-24 retiro", `POST ${appUrl}/sep24/transactions/withdraw/interactive`],
          ["SEP-24 tx", `GET ${appUrl}/sep24/transaction?id=<id>`],
          ["SEP-24 historial", `GET ${appUrl}/sep24/transactions`],
          ["SEP-38 info", `GET ${appUrl}/sep38/info`],
          ["SEP-38 precios", `GET ${appUrl}/sep38/prices`],
          ["SEP-38 cotización", `POST ${appUrl}/sep38/quote`],
          ["Faucet (testnet)", `POST ${appUrl}/api/faucet`],
        ]} />
      </Section>

      <Section title="stellar.toml">
        <CodeBlock>{tomlUrl}</CodeBlock>
        <p>Content-Type: <code>text/plain</code> · CORS abierto</p>
      </Section>

      <Section title="Activo">
        <Table rows={[
          ["Código", assetCode],
          ["Emisor", issuer],
          ["Red", "Stellar Testnet"],
          ["Colateral", "1 TMXN = 1 MXN simulado (MockDriver)"],
        ]} />
      </Section>

      <Section title="Probar en 2 minutos con Demo Wallet">
        <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Abre <a href={demoWallet} target="_blank" rel="noreferrer">Demo Wallet SDF ↗</a></li>
          <li>Crea cuenta → Fondea con Friendbot</li>
          <li>Add Asset → <code>{assetCode}</code> del emisor <code>{issuer.slice(0,8)}…</code></li>
          <li>Go to Anchor → escribe <code>{appUrl.replace("https://", "")}</code></li>
          <li>Deposit o Withdraw → sigue el flujo interactivo</li>
        </ol>
      </Section>

      <Section title="anchor-tests (CI)">
        <CodeBlock>{anchorTests}</CodeBlock>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          Requiere Node 18+ y la variable de entorno <code>DRIVER=mock</code>.
        </p>
      </Section>

      <Section title="Diferenciación">
        <Table rows={[
          ["Ramp Kit (SDK)", "Librería que cada app integra directamente; no expone SEP-24 propio"],
          ["StellarMesh", "Mismo patrón SEP-24 pero para saldos de exchanges; no rampas SPEI"],
          ["Anchor Platform / Anchor in a Box", "Para convertirse en anchor propio; requiere infraestructura"],
          ["SEPuente ✓", "Adaptador ligero para rampas que ya existen sin cambiarlas; no custodial"],
        ]} />
      </Section>

      <Section title="Cómo conectar tu wallet">
        <p>Apunta el campo <code>home_domain</code> de tu wallet a:</p>
        <CodeBlock>{appUrl.replace("https://", "")}</CodeBlock>
        <p>
          La wallet leerá el <code>stellar.toml</code>, descubrirá los endpoints SEP-10 y SEP-24,
          y podrá ofrecer depósito/retiro de pesos MXN sin ninguna integración adicional.
        </p>
      </Section>

      <Section title="Variables de entorno necesarias">
        <Table rows={[
          ["NEXT_PUBLIC_APP_URL", `https://${appUrl.replace("https://", "")}`],
          ["DRIVER", "mock | etherfuse"],
          ["SIGNING_PUBLIC_KEY / SECRET_KEY", "Generados por setup-testnet.ts"],
          ["ISSUER_PUBLIC_KEY / SECRET_KEY", "Generados por setup-testnet.ts"],
          ["DISTRIBUTION_PUBLIC_KEY / SECRET_KEY", "Generados por setup-testnet.ts"],
          ["JWT_SECRET", "Secreto aleatorio largo"],
          ["NEXT_PUBLIC_SUPABASE_URL", "URL del proyecto Supabase"],
          ["SUPABASE_SERVICE_ROLE_KEY", "Service role key (solo servidor)"],
        ]} />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ color: "var(--gold)", fontSize: "1rem", fontWeight: 700, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
        {title}
      </h2>
      <div style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text)" }}>
        {children}
      </div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} style={{ borderBottom: "1px solid var(--border)" }}>
            <td style={{ padding: "6px 8px", color: "var(--muted)", width: "35%", verticalAlign: "top" }}>{k}</td>
            <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: "0.78rem", wordBreak: "break-all" }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: "12px 14px",
      fontSize: "0.78rem",
      overflowX: "auto",
      marginBottom: 10,
      color: "var(--cream)",
    }}>
      {children}
    </pre>
  );
}

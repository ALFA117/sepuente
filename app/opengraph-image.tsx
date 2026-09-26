import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SEPuente – Anchor SEP-24 para pesos mexicanos en Stellar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0A1A33",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient orbs */}
        <div style={{
          position: "absolute", top: -80, left: -60,
          width: 500, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,162,39,0.15) 0%, transparent 70%)",
        }}/>
        <div style={{
          position: "absolute", bottom: -100, right: -80,
          width: 450, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(125,186,255,0.1) 0%, transparent 70%)",
        }}/>

        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(139,155,181,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,155,181,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          display: "flex",
        }}/>

        {/* Content */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(201,162,39,0.1)",
            border: "1px solid rgba(201,162,39,0.25)",
            borderRadius: 10, padding: "6px 14px",
            marginBottom: 28, width: "fit-content",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#4CD68E",
            }}/>
            <span style={{
              fontSize: 14, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "rgba(201,162,39,0.85)",
            }}>
              Stellar Testnet · SEP-24
            </span>
          </div>

          {/* Symbol + Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: "rgba(201,162,39,0.08)",
              border: "1.5px solid rgba(201,162,39,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 44, color: "#C9A227",
            }}>⟴</div>
            <span style={{
              fontSize: 80, fontWeight: 900, letterSpacing: "-0.05em",
              color: "#F5F1E6", lineHeight: 1,
            }}>SEPuente</span>
          </div>

          {/* Tagline */}
          <p style={{
            fontSize: 28, color: "#8B9BB5", margin: 0,
            lineHeight: 1.4, maxWidth: 680,
          }}>
            Gateway open source y{" "}
            <span style={{ color: "#E8E2D5" }}>no custodial</span>
            {" "}para pesos mexicanos en Stellar.{" "}
            <span style={{ color: "#C9A227" }}>SEP-1 · SEP-10 · SEP-24 · SEP-38</span>
          </p>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 40, marginTop: 48,
          }}>
            {[
              { num: "4", label: "SEPs" },
              { num: "0", label: "Custodia" },
              { num: "MIT", label: "Licencia" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#C9A227" }}>{s.num}</span>
                <span style={{ fontSize: 14, color: "rgba(139,155,181,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: protocol diagram hint */}
        <div style={{
          position: "absolute", right: 80, top: "50%",
          transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {[
            { label: "Wallet", color: "#7DBAFF" },
            { label: "SEPuente ⟴", color: "#C9A227" },
            { label: "Stellar", color: "#4CD68E" },
            { label: "SPEI / MXN", color: "#8B9BB5" },
          ].map((n, i) => (
            <div key={n.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 20px", borderRadius: 10,
              background: "rgba(17,40,77,0.7)",
              border: `1px solid ${n.color}22`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color }}/>
              <span style={{ fontSize: 18, fontWeight: 600, color: n.color, fontFamily: "monospace" }}>{n.label}</span>
            </div>
          ))}
        </div>

        {/* URL watermark */}
        <div style={{
          position: "absolute", bottom: 40, right: 100,
          fontSize: 16, color: "rgba(139,155,181,0.3)",
          fontFamily: "monospace", letterSpacing: "0.04em",
        }}>
          sepuente.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}

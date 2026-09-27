import { ImageResponse } from "next/og";
import { MARK } from "./components/brand/paths";

export const runtime = "edge";
export const alt = "SEPuente – Anchor SEP-24 para pesos mexicanos en Stellar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori no resuelve variables CSS: espejo de los tokens de globals.css
const C = { bg: "#0A1A33", gold: "#C9A227", cream: "#F5F1E6", muted: "#B8C2D6", success: "#4FB280", info: "#8FB3E0" };

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: C.bg,
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
          background: "radial-gradient(circle, rgba(143,179,224,0.1) 0%, transparent 70%)",
        }}/>

        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(184,194,214,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(184,194,214,0.04) 1px, transparent 1px)",
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
            marginBottom: 28,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: C.success,
            }}/>
            <span style={{
              fontSize: 14, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "rgba(201,162,39,0.85)",
            }}>
              Stellar Testnet · SEP-24
            </span>
          </div>

          {/* Símbolo del puente (vector trazado del logo) */}
          <svg width={230} height={(230 * MARK.h) / MARK.w} viewBox={`0 0 ${MARK.w} ${MARK.h}`} style={{ marginBottom: 18 }}>
            <path fill={C.gold} fillRule="evenodd" d={MARK.d} />
          </svg>

          {/* Symbol + Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
            <span style={{
              fontSize: 88, fontWeight: 700, letterSpacing: "-0.02em",
              color: C.cream, lineHeight: 1, fontFamily: "Georgia, serif", display: "flex",
            }}><span style={{ color: C.gold }}>SEP</span>uente</span>
          </div>

          {/* Tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 26, color: C.muted, lineHeight: 1.4, maxWidth: 620 }}>
              Gateway open source y no custodial para pesos mexicanos en Stellar.
            </span>
            <span style={{ fontSize: 22, color: C.gold, fontWeight: 700, letterSpacing: "0.02em" }}>
              SEP-1 · SEP-10 · SEP-24 · SEP-38
            </span>
          </div>

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
                <span style={{ fontSize: 32, fontWeight: 800, color: C.gold }}>{s.num}</span>
                <span style={{ fontSize: 14, color: "rgba(184,194,214,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</span>
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
            { label: "Wallet", color: C.info },
            { label: "SEPuente Anchor", color: C.gold },
            { label: "Stellar", color: C.success },
            { label: "SPEI / MXN", color: C.muted },
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
          fontSize: 16, color: "rgba(184,194,214,0.3)",
          fontFamily: "monospace", letterSpacing: "0.04em",
        }}>
          sepuente.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}

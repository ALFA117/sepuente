import { ImageResponse } from "next/og";
import { MARK } from "./components/brand/paths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Satori no resuelve variables CSS: espejo de --bg y --gold.
const BG = "#0A1A33";
const GOLD = "#C9A227";

/** Ícono para "Agregar a pantalla de inicio" (iOS/Android): el símbolo del puente en oro sobre marino. */
export default function AppleIcon() {
  const w = 156;
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={w} height={(w * (MARK.h + 40)) / (MARK.w + 40)} viewBox={`-20 -20 ${MARK.w + 40} ${MARK.h + 40}`}>
          <path fill={GOLD} stroke={GOLD} strokeWidth={22} strokeLinejoin="round" fillRule="evenodd" d={MARK.d} />
        </svg>
      </div>
    ),
    { ...size }
  );
}

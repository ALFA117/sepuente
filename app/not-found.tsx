import Link from "next/link";
import styles from "./landing.module.css";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0A1A33",
      color: "#E8E2D5",
      fontFamily: "var(--font-inter, system-ui, sans-serif)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "0 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes driftA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }
        @keyframes driftB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,30px)} }
        @keyframes pulse404 { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .nf-a1{animation:driftA 14s ease-in-out infinite}
        .nf-a2{animation:driftB 18s ease-in-out infinite}
        .nf-content{animation:fadeUp .4s ease both}
      `}</style>

      {/* Background blobs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div className="nf-a1" style={{
          position:"absolute", width:400, height:320, top:-100, left:-80,
          borderRadius:"50%", filter:"blur(80px)",
          background:"radial-gradient(circle, rgba(201,162,39,.12) 0%, transparent 70%)"
        }}/>
        <div className="nf-a2" style={{
          position:"absolute", width:320, height:400, bottom:-100, right:-60,
          borderRadius:"50%", filter:"blur(80px)",
          background:"radial-gradient(circle, rgba(125,186,255,.09) 0%, transparent 70%)"
        }}/>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"linear-gradient(rgba(139,155,181,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,155,181,.03) 1px,transparent 1px)",
          backgroundSize:"40px 40px",
          maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 75%)",
        }}/>
      </div>

      <div className="nf-content" style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>

        {/* Brand */}
        <Link href="/" style={{
          display:"flex", alignItems:"center", gap:6, textDecoration:"none",
          fontFamily:"var(--font-syne, sans-serif)", fontSize:".9rem", fontWeight:800,
          color:"rgba(245,241,230,.5)", marginBottom:12,
        }}>
          <span style={{ color:"rgba(201,162,39,.5)" }}>⟴</span> SEPuente
        </Link>

        {/* 404 number */}
        <div style={{
          fontFamily:"var(--font-syne, sans-serif)", fontSize:"clamp(6rem,20vw,10rem)",
          fontWeight:800, letterSpacing:"-.06em", lineHeight:1,
          background:"linear-gradient(135deg, #C9A227 0%, rgba(201,162,39,.4) 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"pulse404 3s ease-in-out infinite",
        }}>404</div>

        {/* Icon */}
        <div style={{
          width:56, height:56, borderRadius:"50%",
          background:"rgba(201,162,39,.08)", border:"1px solid rgba(201,162,39,.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"rgba(201,162,39,.6)", fontSize:"1.5rem",
        }}>⟴</div>

        <div>
          <div style={{
            fontFamily:"var(--font-syne, sans-serif)", fontSize:"1.3rem", fontWeight:800,
            color:"#F5F1E6", letterSpacing:"-.03em", marginBottom:8,
          }}>
            Ruta no encontrada
          </div>
          <p style={{ fontSize:".85rem", color:"#8B9BB5", lineHeight:1.6, maxWidth:320 }}>
            Esta página no existe o fue movida. Regresa al inicio o prueba el demo del anchor.
          </p>
        </div>

        <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
          <Link href="/" style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"11px 22px", borderRadius:11,
            background:"#C9A227", color:"#0A1A33",
            fontWeight:700, fontSize:".88rem", textDecoration:"none",
            transition:"all .15s",
          }}>
            ← Inicio
          </Link>
          <Link href="/demo" style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"11px 22px", borderRadius:11,
            background:"rgba(139,155,181,.07)", border:"1px solid rgba(139,155,181,.15)",
            color:"#8B9BB5", fontWeight:600, fontSize:".88rem", textDecoration:"none",
          }}>
            Ver Demo
          </Link>
          <Link href="/devs" style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"11px 22px", borderRadius:11,
            background:"rgba(139,155,181,.07)", border:"1px solid rgba(139,155,181,.15)",
            color:"#8B9BB5", fontWeight:600, fontSize:".88rem", textDecoration:"none",
          }}>
            Docs
          </Link>
        </div>

        <div style={{
          marginTop:24, fontSize:".7rem", fontFamily:"var(--font-mono, monospace)",
          color:"rgba(139,155,181,.3)", letterSpacing:".06em",
        }}>
          SEPuente · Stellar Testnet · SEP-24
        </div>
      </div>
    </div>
  );
}

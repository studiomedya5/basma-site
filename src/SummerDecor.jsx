// Décor Été — reflets de lumière, soleil doux, branches végétales, motif géométrique
// Remplace l'ancien décor Ramadan. Palette dorée, style luxe minimaliste.

const GLINTS = [
  { top:"6%",  left:"5%",  size:14, delay:0,    dur:2.8 },
  { top:"4%",  left:"22%", size:8,  delay:0.4,  dur:3.2 },
  { top:"10%", left:"40%", size:10, delay:0.8,  dur:2.5 },
  { top:"3%",  left:"60%", size:6,  delay:1.2,  dur:3.6 },
  { top:"8%",  left:"75%", size:12, delay:0.2,  dur:2.9 },
  { top:"5%",  left:"88%", size:7,  delay:1.6,  dur:3.1 },
  { top:"15%", left:"92%", size:9,  delay:0.6,  dur:2.7 },
  { top:"18%", left:"12%", size:6,  delay:1.8,  dur:3.4 },
  { top:"25%", left:"2%",  size:8,  delay:0.9,  dur:2.6 },
  { top:"30%", left:"96%", size:7,  delay:1.1,  dur:3.0 },
  { top:"45%", left:"1%",  size:5,  delay:2.0,  dur:2.8 },
  { top:"55%", left:"97%", size:6,  delay:0.5,  dur:3.3 },
  { top:"68%", left:"3%",  size:8,  delay:1.4,  dur:2.9 },
  { top:"72%", left:"94%", size:7,  delay:0.7,  dur:3.1 },
  { top:"80%", left:"8%",  size:5,  delay:1.9,  dur:2.7 },
  { top:"85%", left:"90%", size:9,  delay:0.3,  dur:3.5 },
  { top:"90%", left:"50%", size:6,  delay:1.5,  dur:2.6 },
  { top:"93%", left:"30%", size:7,  delay:0.8,  dur:3.2 },
  { top:"95%", left:"70%", size:5,  delay:2.1,  dur:2.8 },
];

// Reflet de lumière (sparkle 4 branches) — évoque la lumière d'été
function Glint({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--gold)">
      <path d="M12 1C12 6.5 13 11 23 12C13 13 12 17.5 12 23C11 17.5 10 13 1 12C10 11 11 6.5 12 1Z" />
    </svg>
  );
}

// Soleil doux avec rayons
function Sun() {
  const rays = Array.from({ length: 12 });
  return (
    <svg width="62" height="62" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="12" fill="var(--gold)" opacity="0.82" />
      <circle cx="32" cy="32" r="17" stroke="var(--gold)" strokeWidth="1" opacity="0.35" />
      {rays.map((_, i) => {
        const a = (i / rays.length) * Math.PI * 2;
        const x1 = 32 + Math.cos(a) * 22;
        const y1 = 32 + Math.sin(a) * 22;
        const x2 = 32 + Math.cos(a) * 29;
        const y2 = 32 + Math.sin(a) * 29;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        );
      })}
    </svg>
  );
}

// Branche végétale délicate (sprig) — fraîcheur estivale
function LeafSprig({ side }) {
  const leaves = [
    { cy: 14, rot: 38 }, { cy: 26, rot: -34 }, { cy: 38, rot: 36 },
    { cy: 50, rot: -32 }, { cy: 62, rot: 34 }, { cy: 74, rot: -30 },
  ];
  return (
    <svg width="56" height="96" viewBox="0 0 56 96" fill="none"
      style={{ transform: side === "right" ? "scaleX(-1)" : "none" }}>
      {/* tige */}
      <path d="M28 94 C 28 70 28 36 30 6" stroke="var(--gold)" strokeWidth="1.4" opacity="0.6" fill="none" />
      {leaves.map((l, i) => (
        <ellipse key={i}
          cx={i % 2 === 0 ? 19 : 37} cy={l.cy} rx="9" ry="3.6"
          transform={`rotate(${l.rot} ${i % 2 === 0 ? 19 : 37} ${l.cy})`}
          fill="rgba(200,149,108,0.16)" stroke="var(--gold)" strokeWidth="1" opacity="0.75" />
      ))}
    </svg>
  );
}

export default function SummerDecor() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      zIndex: 0, overflow: "hidden",
    }}>

      {/* ── Motif géométrique subtil (texture de marque) ── */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='none' stroke='rgba(200,149,108,0.06)' strokeWidth='0.8'%3E%3Cpolygon points='30,2 58,16 58,44 30,58 2,44 2,16'/%3E%3Cpolygon points='30,10 50,20 50,40 30,50 10,40 10,20'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
        opacity: 1,
      }} />

      {/* ── Halo de lumière chaud en haut ── */}
      <div style={{
        position: "absolute", top: "-12%", right: "8%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
      }} />

      {/* ── Reflets de lumière ── */}
      {GLINTS.map((s, i) => (
        <div key={i} style={{
          position: "absolute", top: s.top, left: s.left,
          animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          opacity: 0.7,
        }}>
          <Glint size={s.size} />
        </div>
      ))}

      {/* ── Soleil en haut à droite ── */}
      <div style={{
        position: "absolute", top: 22, right: 60,
        animation: "floatY 6s ease-in-out infinite",
        opacity: 0.85,
      }}>
        <Sun />
      </div>

      {/* ── Branches végétales aux coins ── */}
      <div style={{
        position: "absolute", top: 0, left: 22,
        animation: "swingL 5s ease-in-out infinite",
        transformOrigin: "top center",
        opacity: 0.7,
      }}>
        <LeafSprig side="left" />
      </div>
      <div style={{
        position: "absolute", top: 0, right: 100,
        animation: "swingR 5.5s ease-in-out infinite",
        transformOrigin: "top center",
        opacity: 0.7,
      }}>
        <LeafSprig side="right" />
      </div>

      {/* ── Bande dorée en bas ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3,
        background: "linear-gradient(to right, transparent, rgba(200,149,108,0.3), rgba(200,149,108,0.5), rgba(200,149,108,0.3), transparent)",
      }} />
    </div>
  );
}

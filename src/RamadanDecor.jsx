// Décor Ramadan — étoiles scintillantes, croissant, lanternes, motif géométrique

const STARS = [
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

function StarIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--gold)">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  );
}

function CrescentMoon() {
  return (
    <svg width="54" height="64" viewBox="0 0 54 64" fill="none">
      <path
        d="M38 4C22 4 8 17 8 33c0 16 14 27 30 27 3 0 6-0.4 8.5-1.2C38 55 30 46 30 33S38 11 46.5 7.2C43.8 5 41 4 38 4z"
        fill="var(--gold)" opacity="0.85"
      />
    </svg>
  );
}

function Lantern({ side }) {
  return (
    <svg width="32" height="72" viewBox="0 0 32 72" fill="none"
      style={{ transform: side === "right" ? "scaleX(-1)" : "none" }}>
      {/* string */}
      <line x1="16" y1="0" x2="16" y2="10" stroke="var(--gold)" strokeWidth="1.5" opacity="0.6"/>
      {/* top cap */}
      <rect x="8" y="10" width="16" height="4" rx="2" fill="var(--gold)" opacity="0.7"/>
      {/* body */}
      <rect x="5" y="14" width="22" height="36" rx="4" fill="rgba(200,149,108,0.18)" stroke="var(--gold)" strokeWidth="1.2" opacity="0.8"/>
      {/* inner glow */}
      <rect x="9" y="18" width="14" height="28" rx="3" fill="rgba(255,200,80,0.15)"/>
      {/* ribs */}
      <line x1="5" y1="26" x2="27" y2="26" stroke="var(--gold)" strokeWidth="0.8" opacity="0.5"/>
      <line x1="5" y1="38" x2="27" y2="38" stroke="var(--gold)" strokeWidth="0.8" opacity="0.5"/>
      {/* bottom cap */}
      <rect x="8" y="50" width="16" height="4" rx="2" fill="var(--gold)" opacity="0.7"/>
      {/* tassel */}
      <line x1="14" y1="54" x2="12" y2="64" stroke="var(--gold)" strokeWidth="1" opacity="0.5"/>
      <line x1="16" y1="54" x2="16" y2="65" stroke="var(--gold)" strokeWidth="1" opacity="0.5"/>
      <line x1="18" y1="54" x2="20" y2="64" stroke="var(--gold)" strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

export default function RamadanDecor() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      zIndex: 0, overflow: "hidden",
    }}>

      {/* ── Subtle geometric bg pattern ── */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='none' stroke='rgba(200,149,108,0.07)' strokeWidth='0.8'%3E%3Cpolygon points='30,2 58,16 58,44 30,58 2,44 2,16'/%3E%3Cpolygon points='30,10 50,20 50,40 30,50 10,40 10,20'/%3E%3Cline x1='30' y1='2' x2='30' y2='10'/%3E%3Cline x1='58' y1='16' x2='50' y2='20'/%3E%3Cline x1='58' y1='44' x2='50' y2='40'/%3E%3Cline x1='30' y1='58' x2='30' y2='50'/%3E%3Cline x1='2' y1='44' x2='10' y2='40'/%3E%3Cline x1='2' y1='16' x2='10' y2='20'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
        opacity: 1,
      }} />

      {/* ── Stars ── */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: "absolute", top: s.top, left: s.left,
          animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          opacity: 0.7,
        }}>
          <StarIcon size={s.size} />
        </div>
      ))}

      {/* ── Crescent moon top-right ── */}
      <div style={{
        position: "absolute", top: 18, right: 60,
        animation: "floatY 6s ease-in-out infinite",
        opacity: 0.82,
      }}>
        <CrescentMoon />
      </div>

      {/* ── Lanterns top corners ── */}
      <div style={{
        position: "absolute", top: 0, left: 20,
        animation: "swingL 5s ease-in-out infinite",
        transformOrigin: "top center",
        opacity: 0.65,
      }}>
        <Lantern side="left" />
      </div>
      <div style={{
        position: "absolute", top: 0, right: 90,
        animation: "swingR 5.5s ease-in-out infinite",
        transformOrigin: "top center",
        opacity: 0.65,
      }}>
        <Lantern side="right" />
      </div>

      {/* ── Bottom decorative band ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3,
        background: "linear-gradient(to right, transparent, rgba(200,149,108,0.3), rgba(200,149,108,0.5), rgba(200,149,108,0.3), transparent)",
      }} />
    </div>
  );
}

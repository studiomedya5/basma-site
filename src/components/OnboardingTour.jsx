import { useState, useEffect } from "react";

const STORAGE_KEY = "basma_tour_done";

const STEPS = [
  {
    id: "sound",
    title: "🎵 Ambiance musicale",
    text: "Cliquez ici pour activer la musique d'ambiance de notre boutique",
    target: ".mute-btn",
    position: "top-right",
    pulseColor: "rgba(201,168,76,0.4)",
  },
  {
    id: "whatsapp",
    title: "💬 Contactez-nous",
    text: "Une question ? Écrivez-nous directement sur WhatsApp, nous répondons rapidement !",
    target: ".wa-btn",
    position: "top-left",
    pulseColor: "rgba(37,211,102,0.35)",
  },
  {
    id: "welcome",
    title: null,
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, []);

  // Trouver la position de l'élément ciblé
  useEffect(() => {
    if (!visible) return;
    const s = STEPS[step];
    if (!s.target) { setTargetRect(null); return; }
    const el = document.querySelector(s.target);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({ x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height });
    }
  }, [step, visible]);

  // Confettis pour l'étape finale
  useEffect(() => {
    if (STEPS[step]?.id === "welcome") {
      const items = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        dur: 2 + Math.random() * 2,
        size: 4 + Math.random() * 6,
        color: ["#C9A84C", "#D4AF37", "#E8C95A", "#F0D97A", "#C8956C"][Math.floor(Math.random() * 5)],
      }));
      setConfetti(items);
    }
  }, [step]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isWelcome = current.id === "welcome";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      animation: "fadeIn 0.3s ease",
    }}>
      {/* Overlay sombre */}
      <div onClick={close} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.75)",
      }} />

      {/* Spotlight autour de l'élément ciblé */}
      {targetRect && !isWelcome && (
        <>
          {/* Cercle lumineux */}
          <div style={{
            position: "fixed",
            left: targetRect.x - 32, top: targetRect.y - 32,
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(250,247,242,0.12)",
            border: "2px solid rgba(201,168,76,0.5)",
            boxShadow: `0 0 0 4000px rgba(0,0,0,0.75), 0 0 30px ${current.pulseColor}`,
            zIndex: 10001,
            animation: "pulse 1.5s ease infinite",
          }} />

          {/* Bulle tooltip */}
          <div style={{
            position: "fixed",
            zIndex: 10002,
            ...(current.position === "top-right" ? {
              left: targetRect.x + 40,
              bottom: window.innerHeight - targetRect.y + 10,
            } : {
              right: window.innerWidth - targetRect.x + 40,
              bottom: window.innerHeight - targetRect.y + 10,
            }),
            background: "white",
            borderRadius: 12,
            padding: "20px 22px",
            maxWidth: 280,
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            border: "1px solid rgba(201,168,76,0.3)",
            animation: "fadeUp 0.3s ease",
          }}>
            {/* Flèche */}
            <div style={{
              position: "absolute",
              bottom: -8,
              ...(current.position === "top-right" ? { left: 20 } : { right: 20 }),
              width: 16, height: 16,
              background: "white",
              border: "1px solid rgba(201,168,76,0.3)",
              borderTop: "none", borderLeft: "none",
              transform: "rotate(45deg)",
            }} />

            <h3 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 18, fontWeight: 600, color: "#2C2A20",
              marginBottom: 8,
            }}>{current.title}</h3>
            <p style={{
              fontFamily: "'Jost',sans-serif", fontSize: 13,
              color: "#666", lineHeight: 1.6, marginBottom: 16,
            }}>{current.text}</p>

            {/* Indicateur + boutons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                fontFamily: "'Jost',sans-serif", fontSize: 11,
                color: "#C9A84C", fontWeight: 600,
              }}>{step + 1} / {STEPS.length}</span>
              <button onClick={next} style={{
                background: "#C9A84C", color: "white", border: "none",
                padding: "8px 20px", borderRadius: 4, cursor: "pointer",
                fontFamily: "'Jost',sans-serif", fontSize: 11,
                letterSpacing: "1px", textTransform: "uppercase",
              }}>
                Suivant →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Étape finale — modal bienvenue */}
      {isWelcome && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10002,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          {/* Confettis dorés */}
          {confetti.map(c => (
            <div key={c.id} style={{
              position: "fixed",
              left: `${c.left}%`,
              top: -10,
              width: c.size, height: c.size,
              borderRadius: c.size > 7 ? "50%" : "1px",
              background: c.color,
              opacity: 0,
              animation: `confettiFall ${c.dur}s ease ${c.delay}s forwards`,
              zIndex: 10001,
            }} />
          ))}

          <div style={{
            background: "#FAF9F6", borderRadius: 16,
            padding: "36px 32px", maxWidth: 360, width: "100%",
            textAlign: "center", position: "relative",
            boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
            border: "1px solid rgba(201,168,76,0.2)",
            animation: "fadeUp 0.4s ease",
          }}>
            {/* Logo */}
            <img src="/images/logo.png" alt="Basma" style={{
              height: 56, margin: "0 auto 16px", display: "block",
            }} />

            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 24, fontWeight: 500, color: "#2C2A20",
              marginBottom: 12, lineHeight: 1.3,
            }}>
              Bienvenue chez<br />
              <span style={{ color: "#C9A84C" }}>Basma Only Shop</span> ✨
            </h2>

            <p style={{
              fontFamily: "'Jost',sans-serif", fontSize: 13,
              color: "#666", lineHeight: 1.7, marginBottom: 24,
            }}>
              Découvrez notre collection exclusive d'abayas et de mode modeste.
              Livraison partout en Tunisie !
            </p>

            <button onClick={close} style={{
              background: "#C9A84C", color: "white", border: "none",
              padding: "14px 32px", borderRadius: 4, cursor: "pointer",
              fontFamily: "'Jost',sans-serif", fontSize: 12,
              letterSpacing: "1.5px", textTransform: "uppercase",
              width: "100%", transition: "background 0.2s",
            }}>
              Découvrir la collection →
            </button>
          </div>
        </div>
      )}

      {/* Bouton "Passer le guide" */}
      <button onClick={close} style={{
        position: "fixed", bottom: 24, left: "50%",
        transform: "translateX(-50%)", zIndex: 10003,
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'Jost',sans-serif", fontSize: 12,
        color: "rgba(255,255,255,0.45)", letterSpacing: "1px",
        transition: "color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}>
        Passer le guide
      </button>
    </div>
  );
}

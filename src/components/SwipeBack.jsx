import { useEffect, useRef, useState } from "react";

export default function SwipeBack({ onBack, children }) {
  const touchStart = useRef(null);
  const touchY = useRef(null);
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Détecter seulement les swipes qui commencent près du bord gauche (< 40px)
      // ou n'importe où si c'est un geste horizontal clair
      touchStart.current = e.touches[0].clientX;
      touchY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (touchStart.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStart.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchY.current);

      // Swipe horizontal > 80px et pas trop vertical (pour ne pas interférer avec le scroll)
      if (dx > 80 && dy < 60) {
        setSliding(true);
        setTimeout(() => onBack(), 300);
      }
      touchStart.current = null;
      touchY.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onBack]);

  return (
    <div style={{
      transition: sliding ? "transform 0.3s ease, opacity 0.3s ease" : "none",
      transform: sliding ? "translateX(100%)" : "translateX(0)",
      opacity: sliding ? 0 : 1,
    }}>
      {/* Bouton retour fixe desktop */}
      <button
        onClick={onBack}
        className="back-btn-fixed"
        title="Retour"
        style={{
          position: "fixed", top: 80, left: 20, zIndex: 950,
          width: 42, height: 42, borderRadius: "50%",
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(201,168,76,0.25)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.25s",
          color: "#C9A84C",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "#C9A84C";
          e.currentTarget.style.color = "white";
          e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.95)";
          e.currentTarget.style.color = "#C9A84C";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {children}
    </div>
  );
}

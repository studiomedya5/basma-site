export default function SwipeBack({ onBack, children }) {
  return (
    <div>
      {/* Bouton retour fixe */}
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

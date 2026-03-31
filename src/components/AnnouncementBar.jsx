export const ANNOUNCE_H = 36;

const TICKER_TEXT = "🚚 Livraison gratuite pour toute commande supérieure à 100 DT  ✨ Paiement à la livraison partout en Tunisie  🌹 Nouvelle collection disponible maintenant  ";

export default function AnnouncementBar({ text }) {
  const ticker = text || TICKER_TEXT;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1001,
      height: ANNOUNCE_H, background: "#C9A84C", overflow: "hidden",
      display: "flex", alignItems: "center",
    }}>
      <div style={{ display: "flex", width: "200%", animation: "ticker 32s linear infinite" }}>
        {[0, 1].map((n) => (
          <span key={n} style={{
            width: "50%", display: "inline-block", whiteSpace: "nowrap",
            fontFamily: "'Jost',sans-serif", fontSize: 12, color: "white",
            letterSpacing: "0.5px", padding: "0 60px",
          }}>
            {ticker}
          </span>
        ))}
      </div>
    </div>
  );
}

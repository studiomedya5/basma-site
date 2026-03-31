import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import AdminProducts from "./AdminProducts";

// ─── Constantes ───────────────────────────────────────────────
const PASSWORD = "basma2024";
const STATUTS = ["en_attente", "confirmée", "livrée", "annulée"];
const STATUT_STYLE = {
  en_attente: { bg: "#FFF8E7", color: "#B8860B", border: "#F0C940", label: "En attente" },
  confirmée:  { bg: "#E8F5E9", color: "#2E7D32", border: "#81C784", label: "Confirmée"  },
  livrée:     { bg: "#E3F2FD", color: "#1565C0", border: "#64B5F6", label: "Livrée"     },
  annulée:    { bg: "#FEECEC", color: "#C62828", border: "#EF9A9A", label: "Annulée"    },
};

// ─── Breakpoints ──────────────────────────────────────────────
// mobile < 640  |  tablet 640–1024  |  desktop > 1024
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── Icônes ───────────────────────────────────────────────────
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PackageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Badge statut ─────────────────────────────────────────────
function StatutBadge({ statut }) {
  const s = STATUT_STYLE[statut] ?? STATUT_STYLE.en_attente;
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ─── Sélecteur statut ─────────────────────────────────────────
function StatutSelect({ orderId, current, onChange, fullWidth }) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newStatut = e.target.value;
    setLoading(true);
    const { error } = await supabase.from("orders").update({ status: newStatut }).eq("id", orderId);
    setLoading(false);
    if (!error) onChange(orderId, newStatut);
  };

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={loading}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6,
        fontFamily: "'Jost',sans-serif", fontSize: 13, background: "white",
        color: "#2C2A20", cursor: loading ? "wait" : "pointer", outline: "none",
        opacity: loading ? 0.6 : 1, boxSizing: "border-box",
      }}
    >
      {STATUTS.map((s) => (
        <option key={s} value={s}>{STATUT_STYLE[s].label}</option>
      ))}
    </select>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: "white", border: "1px solid #EDE8E0", borderRadius: 8,
      padding: "16px 18px", borderLeft: `4px solid ${color}`,
    }}>
      <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "#999", marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: "#2C2A20", lineHeight: 1, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

// ─── Carte commande (mobile) ──────────────────────────────────
function OrderCard({ order, onStatutChange }) {
  const photo = order.products?.images?.[0] ?? null;

  return (
    <div style={{
      background: "white", border: "1px solid #EDE8E0", borderRadius: 10,
      overflow: "hidden", boxShadow: "0 2px 8px rgba(44,42,32,0.05)",
    }}>
      {/* En-tête carte */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderBottom: "1px solid #F0EBE4",
        background: "#FDFCFA",
      }}>
        {/* Photo */}
        <div style={{
          width: 56, height: 70, borderRadius: 6, overflow: "hidden", flexShrink: 0,
          background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {photo
            ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "#C9A84C", opacity: 0.5 }}><PackageIcon /></span>
          }
        </div>
        {/* Produit + prix */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 600, color: "#2C2A20", margin: "0 0 4px", lineHeight: 1.2 }}>
            {order.product_name}
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, background: "#F0EBE4", padding: "2px 8px", borderRadius: 4, color: "#2C2A20" }}>
              {order.size}
            </span>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999" }}>
              × {order.quantity}
            </span>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 700, color: "#C9A84C" }}>
              {Number(order.total_price).toFixed(3)} ت.د
            </span>
          </div>
        </div>
        {/* Badge statut */}
        <div style={{ flexShrink: 0 }}>
          <StatutBadge statut={order.status} />
        </div>
      </div>

      {/* Corps carte */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Cliente */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 600, color: "#2C2A20", margin: "0 0 2px" }}>
              {order.customer_name}
            </p>
            <a href={`tel:${order.customer_phone}`} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#C9A84C", textDecoration: "none",
            }}>
              <PhoneIcon /> {order.customer_phone}
            </a>
          </div>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#bbb", textAlign: "right", lineHeight: 1.5 }}>
            {formatDate(order.created_at)}
          </span>
        </div>

        {/* Adresse */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <span style={{ color: "#C9A84C", marginTop: 1, flexShrink: 0 }}><MapPinIcon /></span>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#666", margin: 0, lineHeight: 1.5 }}>
            {order.address}
            <span style={{ color: "#999" }}> — {order.governorate}</span>
          </p>
        </div>

        {/* Changer statut */}
        <div>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: 6 }}>
            Changer le statut
          </p>
          <StatutSelect
            orderId={order.id}
            current={order.status}
            onChange={onStatutChange}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

// ─── Ligne tableau (tablette + desktop) ───────────────────────
const tdBase = { padding: "13px 14px", borderBottom: "1px solid #EDE8E0", fontSize: 13 };
const thBase = {
  padding: "11px 14px", fontFamily: "'Jost',sans-serif", fontSize: 10,
  letterSpacing: "1.5px", textTransform: "uppercase", color: "#999", fontWeight: 600,
  textAlign: "left", borderBottom: "2px solid #EDE8E0", whiteSpace: "nowrap", background: "#FAF9F6",
};

function OrderRow({ order, onStatutChange, index, isTablet }) {
  const photo = order.products?.images?.[0] ?? null;
  const isEven = index % 2 === 0;

  return (
    <tr style={{ background: isEven ? "white" : "#FDFCFA", verticalAlign: "middle" }}>
      {/* Photo — desktop seulement */}
      {!isTablet && (
        <td style={tdBase}>
          <div style={{
            width: 48, height: 60, borderRadius: 4, overflow: "hidden",
            background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {photo
              ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "#C9A84C", opacity: 0.5 }}><PackageIcon /></span>
            }
          </div>
        </td>
      )}

      {/* Produit */}
      <td style={tdBase}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 600, color: "#2C2A20" }}>
          {order.product_name}
        </span>
        {isTablet && (
          <span style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#C9A84C", marginTop: 2 }}>
            {Number(order.total_price).toFixed(3)} ت.د
          </span>
        )}
      </td>

      {/* Taille */}
      <td style={{ ...tdBase, textAlign: "center" }}>
        <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, background: "#F0EBE4", padding: "3px 10px", borderRadius: 4 }}>
          {order.size}
        </span>
      </td>

      {/* Qté */}
      <td style={{ ...tdBase, textAlign: "center" }}>
        <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 600 }}>{order.quantity}</span>
      </td>

      {/* Prix — desktop seulement */}
      {!isTablet && (
        <td style={tdBase}>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 700, color: "#C9A84C", whiteSpace: "nowrap" }}>
            {Number(order.total_price).toFixed(3)} ت.د
          </span>
        </td>
      )}

      {/* Cliente */}
      <td style={tdBase}>
        <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 600, color: "#2C2A20", display: "block" }}>
          {order.customer_name}
        </span>
        <a href={`tel:${order.customer_phone}`} style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#C9A84C", textDecoration: "none" }}>
          {order.customer_phone}
        </a>
      </td>

      {/* Adresse — desktop seulement */}
      {!isTablet && (
        <td style={tdBase}>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#666", display: "block" }}>
            {order.address}
          </span>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999" }}>
            {order.governorate}
          </span>
        </td>
      )}

      {/* Gouvernorat — tablette seulement */}
      {isTablet && (
        <td style={tdBase}>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#666" }}>
            {order.governorate}
          </span>
        </td>
      )}

      {/* Statut */}
      <td style={tdBase}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 120 }}>
          <StatutBadge statut={order.status} />
          <StatutSelect orderId={order.id} current={order.status} onChange={onStatutChange} />
        </div>
      </td>

      {/* Date */}
      <td style={{ ...tdBase, whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999" }}>
          {formatDate(order.created_at)}
        </span>
      </td>
    </tr>
  );
}

// ─── Écran login ──────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pwd === PASSWORD) { onLogin(); }
    else { setError(true); setPwd(""); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF9F6", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{
        background: "white", border: "1px solid #EDE8E0", borderRadius: 12,
        padding: "clamp(32px, 6vw, 48px) clamp(24px, 6vw, 40px)",
        width: "min(400px, 100%)", boxShadow: "0 8px 40px rgba(44,42,32,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 8 }}>
            Basma Only Shop
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 500, color: "#2C2A20", margin: 0 }}>
            Administration
          </h1>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 6 }}>
            Mot de passe
          </label>
          <input
            type="password" value={pwd} autoFocus
            onChange={(e) => { setPwd(e.target.value); setError(false); }}
            placeholder="••••••••"
            style={{
              width: "100%", padding: "12px 16px", boxSizing: "border-box",
              border: `1px solid ${error ? "#e57373" : "#ddd"}`, borderRadius: 4,
              fontFamily: "'Jost',sans-serif", fontSize: 14, outline: "none", marginBottom: 6,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.target.style.borderColor = error ? "#e57373" : "#ddd")}
          />
          {error && (
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#e57373", marginBottom: 12 }}>
              Mot de passe incorrect
            </p>
          )}
          <button
            type="submit"
            style={{
              width: "100%", padding: "14px", marginTop: error ? 0 : 16,
              background: "#C9A84C", color: "white", border: "none", borderRadius: 4,
              fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1.5px",
              textTransform: "uppercase", cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b8943e")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
          >
            Accéder
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Page Admin ───────────────────────────────────────────────
export default function AdminPage({ onBack }) {
  const width = useWindowWidth();
  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const [auth, setAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("commandes");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatut, setFilterStatut] = useState("tous");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, products(images)")
      .order("created_at", { ascending: false });
    if (err) setError("Impossible de charger les commandes. Vérifiez les politiques RLS Supabase.");
    else setOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (auth) fetchOrders(); }, [auth, fetchOrders]);

  const handleStatutChange = (id, statut) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: statut } : o)));

  if (!auth) return <LoginScreen onLogin={() => setAuth(true)} />;

  // Filtrage
  const filtered = orders.filter((o) => {
    const matchStatut = filterStatut === "tous" || o.status === filterStatut;
    const q = search.toLowerCase();
    const matchSearch = !q
      || o.customer_name.toLowerCase().includes(q)
      || o.product_name.toLowerCase().includes(q)
      || o.customer_phone.includes(q)
      || o.governorate.toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  // Stats
  const stats = {
    total:      orders.length,
    en_attente: orders.filter((o) => o.status === "en_attente").length,
    confirmée:  orders.filter((o) => o.status === "confirmée").length,
    livrée:     orders.filter((o) => o.status === "livrée").length,
    annulée:    orders.filter((o) => o.status === "annulée").length,
    ca: orders.filter((o) => o.status !== "annulée").reduce((s, o) => s + Number(o.total_price), 0),
  };

  // Colonnes du tableau selon la taille
  const tableHeaders = isTablet
    ? ["Produit", "Taille", "Qté", "Cliente", "Gouvernorat", "Statut", "Date"]
    : ["Photo", "Produit", "Taille", "Qté", "Prix", "Cliente", "Adresse", "Statut", "Date"];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF9F6" }}>

      {/* ── Header ── */}
      <header style={{
        background: "#2C2A20", position: "sticky", top: 0, zIndex: 100,
        padding: `0 ${isMobile ? "12px" : "clamp(16px, 4vw, 40px)"}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: isMobile ? 54 : 60, boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        gap: 8,
      }}>
        {/* Gauche */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, minWidth: 0 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 4, fontFamily: "'Jost',sans-serif", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            ←{!isMobile && " Retour au site"}
          </button>
          {!isMobile && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />}
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 17 : 20, fontWeight: 500, color: "white", margin: 0, whiteSpace: "nowrap" }}>
            Administration
          </h1>
        </div>

        {/* Droite */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexShrink: 0 }}>
          <button
            onClick={fetchOrders} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
              color: "#C9A84C", padding: isMobile ? "6px 10px" : "7px 14px", borderRadius: 4,
              fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "1px",
              textTransform: "uppercase", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshIcon />
            {!isMobile && "Actualiser"}
          </button>
          <button
            onClick={() => setAuth(false)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)", padding: isMobile ? "6px 10px" : "7px 14px", borderRadius: 4,
              fontFamily: "'Jost',sans-serif", fontSize: 11, cursor: "pointer",
            }}
          >
            <LogoutIcon />
            {!isMobile && "Déconnexion"}
          </button>
        </div>
      </header>

      {/* ── Barre d'onglets ── */}
      <div style={{
        background: "white", borderBottom: "1px solid #EDE8E0",
        padding: `0 ${isMobile ? "12px" : "clamp(16px, 4vw, 40px)"}`,
        display: "flex", gap: 0,
      }}>
        {[
          { key: "commandes", label: "Commandes" },
          { key: "produits",  label: "Produits"  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: isMobile ? "12px 16px" : "14px 24px",
              border: "none", borderBottom: activeTab === key ? "2px solid #C9A84C" : "2px solid transparent",
              background: "none", cursor: "pointer",
              fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? "#C9A84C" : "#999",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <main style={{ padding: `${isMobile ? "16px" : "28px"} ${isMobile ? "12px" : "clamp(16px, 4vw, 40px)"}`, maxWidth: 1600, margin: "0 auto" }}>

        {/* ── Onglet Produits ── */}
        {activeTab === "produits" && (
          <AdminProducts isMobile={isMobile} />
        )}

        {/* ── Onglet Commandes ── */}
        {activeTab === "commandes" && <>

        {/* ── Stats ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "1fr 1fr 1fr" : "repeat(6, 1fr)",
          gap: isMobile ? 10 : 14,
          marginBottom: isMobile ? 20 : 28,
        }}>
          <StatCard label="Total"      value={stats.total}      color="#C9A84C" />
          <StatCard label="En attente" value={stats.en_attente} color="#F0C940" />
          <StatCard label="Confirmées" value={stats.confirmée}  color="#81C784" />
          <StatCard label="Livrées"    value={stats.livrée}     color="#64B5F6" />
          <StatCard label="Annulées"   value={stats.annulée}    color="#EF9A9A" />
          <StatCard label="CA"         value={`${stats.ca.toFixed(3)} ت.د`}    color="#2C2A20" />
        </div>

        {/* ── Filtres ── */}
        <div style={{
          background: "white", border: "1px solid #EDE8E0", borderRadius: 8,
          padding: isMobile ? "12px" : "14px 18px", marginBottom: 14,
          display: "flex", flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 10 : 14, alignItems: isMobile ? "stretch" : "center",
        }}>
          <input
            type="text"
            placeholder={isMobile ? "Rechercher..." : "Rechercher cliente, produit, gouvernorat..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1 1 200px", padding: "10px 14px", border: "1px solid #ddd",
              borderRadius: 6, fontFamily: "'Jost',sans-serif", fontSize: 13,
              outline: "none", color: "#2C2A20", boxSizing: "border-box", width: "100%",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
          {/* Filtres statut — scroll horizontal sur mobile */}
          <div style={{
            display: "flex", gap: 8,
            overflowX: isMobile ? "auto" : "visible",
            flexWrap: isMobile ? "nowrap" : "wrap",
            paddingBottom: isMobile ? 4 : 0,
            WebkitOverflowScrolling: "touch",
          }}>
            {["tous", ...STATUTS].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                style={{
                  padding: "7px 14px", borderRadius: 20, cursor: "pointer", flexShrink: 0,
                  fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 500,
                  border: filterStatut === s ? "1.5px solid #C9A84C" : "1.5px solid #ddd",
                  background: filterStatut === s ? "#C9A84C" : "white",
                  color: filterStatut === s ? "white" : "#666",
                  transition: "all 0.2s", whiteSpace: "nowrap",
                }}
              >
                {s === "tous" ? `Tous (${orders.length})` : `${STATUT_STYLE[s].label} (${orders.filter((o) => o.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenu commandes ── */}
        {loading ? (
          <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#999" }}>Chargement des commandes...</p>
          </div>
        ) : error ? (
          <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#e57373", lineHeight: 1.8 }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#999" }}>
              {orders.length === 0 ? "Aucune commande pour l'instant." : "Aucun résultat pour ce filtre."}
            </p>
          </div>

        ) : isMobile ? (
          /* ── MOBILE : cartes empilées ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onStatutChange={handleStatutChange} />
            ))}
          </div>

        ) : (
          /* ── TABLETTE + DESKTOP : tableau ── */
          <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 12px rgba(44,42,32,0.04)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isTablet ? 640 : 1000 }}>
                <thead>
                  <tr>
                    {tableHeaders.map((h) => (
                      <th key={h} style={{ ...thBase, textAlign: h === "Taille" || h === "Qté" ? "center" : "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      index={i}
                      onStatutChange={handleStatutChange}
                      isTablet={isTablet}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compteur */}
        {filtered.length > 0 && (
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#bbb", textAlign: "right", marginTop: 10 }}>
            {filtered.length} commande{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          </p>
        )}

        </>}
      </main>
    </div>
  );
}

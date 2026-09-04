import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { photoUrl } from "../lib/images";
import AdminStats from "./AdminStats";
import AdminSante from "./AdminSante";
import AdminProducts from "./AdminProducts";
import AdminPromoCodes from "./AdminPromoCodes";

// ─── Constantes ───────────────────────────────────────────────
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

const GOUVERNORATS = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine",
  "Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine",
  "Tozeur","Tunis","Zaghouan",
];

// ─── Icônes édition / suppression ────────────────────────────
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon2 = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ─── Modal d'édition de commande ─────────────────────────────
function EditOrderModal({ order, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: order.status,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    address: order.address,
    governorate: order.governorate,
    size: order.size,
    quantity: order.quantity,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("orders").update(form).eq("id", order.id);
    setSaving(false);
    if (!error) onSaved(order.id, form);
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 4,
    fontFamily: "'Jost',sans-serif", fontSize: 13, outline: "none", background: "white",
    color: "#2C2A20", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11,
    color: "#666", marginBottom: 5, fontWeight: 500,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", WebkitBackdropFilter: "blur(3px)", backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "relative", background: "white", width: "min(500px, 94vw)", maxHeight: "90vh",
        borderRadius: 10, overflow: "auto", padding: "28px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "fadeUp 0.25s ease",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>
          Modifier la commande
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 500, color: "#2C2A20", marginBottom: 20 }}>
          {order.product_name}
        </h2>

        {/* Statut */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Statut</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}>
            {STATUTS.map(s => <option key={s} value={s}>{STATUT_STYLE[s].label}</option>)}
          </select>
        </div>

        {/* Nom + Téléphone */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nom</label>
            <input value={form.customer_name} onChange={e => set("customer_name", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Adresse + Gouvernorat */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Adresse</label>
            <input value={form.address} onChange={e => set("address", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Gouvernorat</label>
            <select value={form.governorate} onChange={e => set("governorate", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Taille + Quantité */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Taille</label>
            <input value={form.size} onChange={e => set("size", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Quantité</label>
            <input type="number" min="1" value={form.quantity} onChange={e => set("quantity", Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{
            width: "100%", padding: "13px", border: "none", borderRadius: 4,
            background: "#C9A84C", color: "white", cursor: saving ? "wait" : "pointer",
            fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1.5px",
            textTransform: "uppercase", opacity: saving ? 0.6 : 1,
          }}>
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal de confirmation suppression ───────────────────────
function DeleteConfirmModal({ order, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    // .select() permet de savoir combien de lignes ont REELLEMENT ete supprimees.
    // Si RLS bloque le DELETE, Supabase ne renvoie pas d'erreur mais 0 ligne.
    const { data, error } = await supabase
      .from("orders").delete().eq("id", order.id).select();
    setDeleting(false);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      alert(
        "La suppression a ete bloquee par la securite Supabase (RLS).\n\n" +
        "Va dans Supabase > SQL Editor et execute le fichier " +
        "supabase-rls-orders.sql (policy orders_anon_delete)."
      );
      return;
    }
    onDeleted(order.id);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", WebkitBackdropFilter: "blur(3px)", backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "relative", background: "white", width: "min(400px, 90vw)",
        borderRadius: 10, padding: "32px 28px", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "fadeUp 0.25s ease",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 500, color: "#2C2A20", marginBottom: 8 }}>
          Supprimer cette commande ?
        </h3>
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 24 }}>
          Êtes-vous sûr de vouloir supprimer cette commande ?<br />
          <strong>{order.product_name}</strong> — {order.customer_name}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", border: "1px solid #ddd", borderRadius: 4,
            background: "white", color: "#666", cursor: "pointer",
            fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px",
          }}>
            Annuler
          </button>
          <button onClick={handleDelete} disabled={deleting} style={{
            flex: 1, padding: "12px", border: "none", borderRadius: 4,
            background: "#e53e3e", color: "white", cursor: deleting ? "wait" : "pointer",
            fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px",
            textTransform: "uppercase", opacity: deleting ? 0.6 : 1,
          }}>
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fenêtre détail commande (toutes les infos) ──────────────
function OrderDetailModal({ order, onClose }) {
  const photo = order._photo ?? null;
  const total = Number(order.total_price);
  const unit  = order.quantity ? total / order.quantity : total;
  const [capiMsg, setCapiMsg] = useState(null);

  // Backfill : redemande l'envoi du Purchase à Meta (CAPI) pour cette commande.
  // On remet capi_sent_at à null + on touche capi_resend_at → le Database Webhook
  // ré-appelle l'Edge Function (qui refait le claim atomique + l'envoi).
  const resendCapi = async () => {
    setCapiMsg("…");
    const { error } = await supabase.from("orders")
      .update({ capi_sent_at: null, capi_resend_at: new Date().toISOString() })
      .eq("id", order.id);
    setCapiMsg(error ? "Erreur (colonnes CAPI manquantes ?)" : "✓ Renvoi demandé à Meta");
    setTimeout(() => setCapiMsg(null), 4000);
  };

  const Row = ({ label, children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "10px 0", borderBottom: "1px solid #F0EBE4" }}>
      <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "0.5px", textTransform: "uppercase", color: "#999", flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#2C2A20", textAlign: "right", fontWeight: 500, wordBreak: "break-word" }}>{children}</span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", WebkitBackdropFilter: "blur(3px)", backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "relative", background: "white", width: "min(480px, 96vw)", maxHeight: "92vh", overflowY: "auto",
        borderRadius: 12, boxShadow: "0 24px 70px rgba(0,0,0,0.25)", animation: "fadeUp 0.25s ease",
      }}>
        {/* En-tête */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 22px", borderBottom: "1px solid #EDE8E0", background: "#FDFCFA", borderRadius: "12px 12px 0 0" }}>
          <div style={{ width: 70, height: 70, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F0EBE4", border: "1px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {photo ? <img src={photoUrl(photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <HangerIcon />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: "#2C2A20", margin: "0 0 6px", lineHeight: 1.2 }}>{order.product_name}</p>
            <StatutBadge statut={order.status} />
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, alignSelf: "flex-start" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: "8px 22px 22px" }}>
          {/* Section commande */}
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A84C", margin: "16px 0 4px", fontWeight: 600 }}>Commande</p>
          <Row label="N° commande">#{order.id}</Row>
          <Row label="Taille">{order.size}</Row>
          <Row label="Quantité">{order.quantity}</Row>
          <Row label="Prix unitaire">{unit.toFixed(3)} ت.د</Row>
          <Row label="Total payé"><span style={{ color: "#C9A84C", fontWeight: 700 }}>{total.toFixed(3)} ت.د</span></Row>
          <Row label="Date">{formatDate(order.created_at)}</Row>

          {/* Section cliente */}
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A84C", margin: "20px 0 4px", fontWeight: 600 }}>Cliente</p>
          <Row label="Nom">{order.customer_name}</Row>
          <Row label="Téléphone"><a href={`tel:${order.customer_phone}`} style={{ color: "#C9A84C", textDecoration: "none" }}>{order.customer_phone}</a></Row>
          {order.customer_email && <Row label="Email">{order.customer_email}</Row>}
          <Row label="Adresse">{order.address}</Row>
          <Row label="Gouvernorat">{order.governorate}</Row>
          {order.delegation && <Row label="Délégation">{order.delegation}</Row>}

          {/* Actions rapides */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <a href={`tel:${order.customer_phone}`} style={{ flex: 1, textAlign: "center", padding: "12px", background: "#C9A84C", color: "white", borderRadius: 6, textDecoration: "none", fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" }}>Appeler</a>
            <a href={`https://wa.me/${(order.customer_phone||"").replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", padding: "12px", background: "#25D366", color: "white", borderRadius: 6, textDecoration: "none", fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" }}>WhatsApp</a>
          </div>

          {/* Backfill CAPI Meta */}
          <button onClick={resendCapi} title="Renvoyer l'achat à Meta (Conversions API)"
            style={{ width: "100%", marginTop: 10, padding: "10px", background: "#F0EBE4", color: "#2C2A20", border: "1px solid #ddd9cf", borderRadius: 6, cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" }}>
            ↻ Renvoyer à Meta (CAPI)
          </button>
          {capiMsg && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: capiMsg.startsWith("✓") ? "#2e7d32" : "#999", textAlign: "center", marginTop: 6 }}>{capiMsg}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Photos statiques par catégorie (fallback) ──────────────
const STATIC_PHOTOS = {
  "3ibaya":  "/photos/3ibaya/487447137_1098233225650757_818704683323925263_n.jpg",
  echarpe:   "/photos/echarpe/587840430_17925997047179373_2959763835755661799_n.jpg",
  jiba:      "/photos/jiba/498947811_17903534622179373_3600286315845092783_n.jpg",
  kids:      "/photos/kids/645995833_1370344885106255_9157182548210132803_n.jpg",
  manteau:   "/photos/manteau/579423101_1277387817735296_2206184981912267833_n.jpg",
  MDB:       "/photos/MDB/496049480_1128525475954865_2540523400201882755_n.jpg",
  pyjama:    "/photos/pyjama/490345086_1118998213574258_6134831431061358690_n.jpg",
  Robe:      "/photos/Robe/649636396_1374861407987936_6370692347574891488_n.jpg",
  Sac:       "/photos/Sac/631720297_1352112070262870_4847811711877564932_n.jpg",
  set:       "/photos/set/493138870_1143811757759570_6677303497939193345_n.jpg",
};

// Correspondance nom produit → catégorie statique
function guessStaticPhoto(productName) {
  if (!productName) return null;
  const n = productName.toLowerCase();
  if (n.includes("abaya") || n.includes("3ibaya")) return STATIC_PHOTOS["3ibaya"];
  if (n.includes("écharpe") || n.includes("echarpe")) return STATIC_PHOTOS.echarpe;
  if (n.includes("jiba")) return STATIC_PHOTOS.jiba;
  if (n.includes("kids") || n.includes("enfant")) return STATIC_PHOTOS.kids;
  if (n.includes("manteau")) return STATIC_PHOTOS.manteau;
  if (n.includes("mdb")) return STATIC_PHOTOS.MDB;
  if (n.includes("pyjama")) return STATIC_PHOTOS.pyjama;
  if (n.includes("robe")) return STATIC_PHOTOS.Robe;
  if (n.includes("sac")) return STATIC_PHOTOS.Sac;
  if (n.includes("set")) return STATIC_PHOTOS.set;
  return null;
}

// ── Icône placeholder vêtement ─────────────────────────────
const HangerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3c0 1.1.6 2 1.5 2.5L3 14h18l-7.5-6.5c.9-.5 1.5-1.4 1.5-2.5a3 3 0 0 0-3-3z" />
    <path d="M3 14v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
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
function OrderCard({ order, onStatutChange, onEdit, onDelete, onView }) {
  const photo = order._photo ?? null;

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
        {/* Photo — cliquable pour voir le détail */}
        <div onClick={() => onView(order)} style={{
          width: 60, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0,
          background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid #C9A84C", cursor: "pointer",
        }}>
          {photo
            ? <img src={photoUrl(photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <HangerIcon />
          }
        </div>
        {/* Produit + prix */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p onClick={() => onView(order)} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 600, color: "#2C2A20", margin: "0 0 4px", lineHeight: 1.2, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(201,168,76,0.45)", textUnderlineOffset: 3 }}>
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

        {/* Bouton Détails — bien visible */}
        <button onClick={() => onView(order)} title="Voir le détail complet"
          style={{ width: "100%", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 6, cursor: "pointer", color: "#2C2A20", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>
          <EyeIcon /> Voir le détail
        </button>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <button onClick={() => onEdit(order)} title="Modifier"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#C9A84C", padding: 4, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Jost',sans-serif", fontSize: 11, transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.65"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <EditIcon /> Modifier
          </button>
          <button onClick={() => onDelete(order)} title="Supprimer"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", padding: 4, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Jost',sans-serif", fontSize: 11, transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.65"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <TrashIcon2 /> Supprimer
          </button>
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

function OrderRow({ order, onStatutChange, onEdit, onDelete, onView, index, isTablet }) {
  const photo = order._photo ?? null;
  const isEven = index % 2 === 0;

  return (
    <tr style={{ background: isEven ? "white" : "#FDFCFA", verticalAlign: "middle" }}>
      {/* Photo — desktop seulement */}
      {!isTablet && (
        <td style={tdBase}>
          <div style={{
            width: 60, height: 60, borderRadius: 8, overflow: "hidden",
            background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #C9A84C",
          }}>
            {photo
              ? <img src={photoUrl(photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <HangerIcon />
            }
          </div>
        </td>
      )}

      {/* Produit */}
      <td style={tdBase}>
        <span onClick={() => onView(order)} title="Voir le détail"
          style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 600, color: "#2C2A20", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(201,168,76,0.4)", textUnderlineOffset: 3 }}>
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

      {/* Actions */}
      <td style={{ ...tdBase, whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => onView(order)} title="Voir le détail"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#2C2A20", padding: 4, display: "flex", transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.55"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <EyeIcon />
          </button>
          <button onClick={() => onEdit(order)} title="Modifier"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#C9A84C", padding: 4, display: "flex", transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.55"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <EditIcon />
          </button>
          <button onClick={() => onDelete(order)} title="Supprimer"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", padding: 4, display: "flex", transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.55"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <TrashIcon2 />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Écran login ──────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Authentification réelle via Supabase Auth (plus de mot de passe en dur).
  // En cas de succès, le parent bascule l'affichage via onAuthStateChange.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(false);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim(), password: pwd,
    });
    setLoading(false);
    if (authErr) { setError(true); setPwd(""); }
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
            Email
          </label>
          <input
            type="email" value={email} autoFocus autoComplete="username"
            onChange={(e) => { setEmail(e.target.value); setError(false); }}
            placeholder="email@exemple.com"
            style={{
              width: "100%", padding: "12px 16px", boxSizing: "border-box",
              border: `1px solid ${error ? "#e57373" : "#ddd"}`, borderRadius: 4,
              fontFamily: "'Jost',sans-serif", fontSize: 14, outline: "none", marginBottom: 14,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.target.style.borderColor = error ? "#e57373" : "#ddd")}
          />
          <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 6 }}>
            Mot de passe
          </label>
          <input
            type="password" value={pwd} autoComplete="current-password"
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
              Email ou mot de passe incorrect
            </p>
          )}
          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "14px", marginTop: error ? 0 : 16,
              background: "#C9A84C", color: "white", border: "none", borderRadius: 4,
              fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1.5px",
              textTransform: "uppercase", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b8943e")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
          >
            {loading ? "Connexion…" : "Accéder"}
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
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("commandes");

  // Session Supabase Auth : source de vérité de l'accès admin.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuth(!!data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(!!session);
      setAuthChecked(true);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatut, setFilterStatut] = useState("tous");
  const [search, setSearch] = useState("");
  const [editOrder, setEditOrder] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Charger commandes + produits en parallèle
    // NB : pas de join FK products(images) ici — il casse si la relation
    // n'est pas détectée par PostgREST. On résout la photo via le fallback
    // par nom de produit ci-dessous (plus robuste).
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, images"),
    ]);

    if (ordersRes.error) {
      console.error("Erreur chargement commandes :", ordersRes.error);
      setError(
        "Impossible de charger les commandes : " +
        (ordersRes.error.message || "erreur inconnue") +
        ". Vérifiez les politiques RLS de la table orders dans Supabase."
      );
      setLoading(false);
      return;
    }

    // Map produits par nom (lowercase) pour fallback
    const productsByName = {};
    (productsRes.data ?? []).forEach(p => {
      if (p.name) productsByName[p.name.toLowerCase()] = p;
    });

    // Résoudre la photo pour chaque commande
    const enriched = (ordersRes.data ?? []).map(o => {
      let photo = null;

      // 1. Chercher par nom dans la table products
      if (o.product_name) {
        const match = productsByName[o.product_name.toLowerCase()];
        if (match?.images?.[0]) photo = match.images[0];
      }

      // 2. Fallback : photo statique par catégorie (noms du catalogue)
      if (!photo) photo = guessStaticPhoto(o.product_name);

      return { ...o, _photo: photo };
    });

    setOrders(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { if (auth) fetchOrders(); }, [auth, fetchOrders]);

  const handleStatutChange = (id, statut) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: statut } : o)));

  const handleOrderSaved = (id, updatedFields) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updatedFields } : o));
    setEditOrder(null);
  };

  const handleOrderDeleted = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    setDeleteOrder(null);
  };

  if (!authChecked) return <div style={{ minHeight: "100vh", background: "#FAF9F6" }} />;
  if (!auth) return <LoginScreen />;

  // Filtrage (avec null-safety)
  const filtered = orders.filter((o) => {
    const matchStatut = filterStatut === "tous" || o.status === filterStatut;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (o.customer_name || "").toLowerCase().includes(q)
      || (o.product_name || "").toLowerCase().includes(q)
      || (o.customer_phone || "").includes(q)
      || (o.governorate || "").toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  // Stats
  const stats = {
    total:      orders.length,
    en_attente: orders.filter((o) => o.status === "en_attente").length,
    confirmée:  orders.filter((o) => o.status === "confirmée").length,
    livrée:     orders.filter((o) => o.status === "livrée").length,
    annulée:    orders.filter((o) => o.status === "annulée").length,
    ca: orders.filter((o) => o.status !== "annulée").reduce((s, o) => s + Number(o.total_price || 0), 0),
  };

  // Colonnes du tableau selon la taille
  const tableHeaders = isTablet
    ? ["Produit", "Taille", "Qté", "Cliente", "Gouvernorat", "Statut", "Date", ""]
    : ["Photo", "Produit", "Taille", "Qté", "Prix", "Cliente", "Adresse", "Statut", "Date", ""];

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
            onClick={() => supabase.auth.signOut()}
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
          { key: "promos",    label: "Codes promo" },
          { key: "stats",     label: "Statistiques" },
          { key: "sante",     label: "Santé" },
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

        {/* ── Onglet Codes promo ── */}
        {activeTab === "promos" && (
          <AdminPromoCodes isMobile={isMobile} />
        )}

        {/* ── Onglet Statistiques ── */}
        {activeTab === "stats" && (
          <AdminStats orders={orders} isMobile={isMobile} />
        )}

        {/* ── Onglet Santé (checklist avant campagne) ── */}
        {activeTab === "sante" && (
          <AdminSante isMobile={isMobile} />
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
              <OrderCard key={order.id} order={order} onStatutChange={handleStatutChange} onEdit={setEditOrder} onDelete={setDeleteOrder} onView={setDetailOrder} />
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
                      onEdit={setEditOrder}
                      onDelete={setDeleteOrder}
                      onView={setDetailOrder}
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

      {/* ── Modals ── */}
      {editOrder && (
        <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSaved={handleOrderSaved} />
      )}
      {deleteOrder && (
        <DeleteConfirmModal order={deleteOrder} onClose={() => setDeleteOrder(null)} onDeleted={handleOrderDeleted} />
      )}
      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
    </div>
  );
}

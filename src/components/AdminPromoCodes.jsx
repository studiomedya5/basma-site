import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const GOLD = "#C9A84C";
const DARK = "#2C2A20";

// Génère un code aléatoire lisible (sans caractères ambigus)
function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "LIVE" + s;
}

export default function AdminPromoCodes({ isMobile }) {
  const [codes, setCodes] = useState([]);
  const [usage, setUsage] = useState({});   // code -> nombre d'utilisations
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [codesRes, ordersRes] = await Promise.all([
      supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("promo_code"),
    ]);
    if (codesRes.error) {
      setError("Table « promo_codes » introuvable. Exécute d'abord le fichier supabase-promo-codes.sql dans Supabase > SQL Editor.");
      setLoading(false); return;
    }
    const counts = {};
    (ordersRes.data ?? []).forEach((o) => { if (o.promo_code) counts[o.promo_code] = (counts[o.promo_code] || 0) + 1; });
    setUsage(counts);
    setCodes(codesRes.data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createCode = async () => {
    const code = (input.trim() || randomCode()).toUpperCase().replace(/\s+/g, "");
    if (!code) return;
    const { error } = await supabase.from("promo_codes").insert({ code, free_shipping: true, active: true });
    if (error) {
      setError(/duplicate|unique/i.test(error.message) ? "Ce code existe déjà." : error.message);
      return;
    }
    setInput(""); setError(null); load();
  };

  const toggleActive = async (c) => { await supabase.from("promo_codes").update({ active: !c.active }).eq("id", c.id); load(); };
  const remove = async (c) => {
    if (!window.confirm(`Supprimer le code « ${c.code} » ?`)) return;
    await supabase.from("promo_codes").delete().eq("id", c.id); load();
  };
  const copy = (code) => { try { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); } catch { /* ignore */ } };

  const btn = (bg, color) => ({
    border: "none", borderRadius: 6, cursor: "pointer", padding: "8px 14px",
    fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600, background: bg, color,
  });

  return (
    <div>
      {/* Explication */}
      <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "16px 18px", marginBottom: 22, display: "flex", gap: 12 }}>
        <span style={{ fontSize: 24 }}>🎟️</span>
        <div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: DARK, margin: "0 0 4px" }}>Codes promo — Livraison gratuite</p>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12.5, color: "#777", lineHeight: 1.7, margin: 0 }}>
            Génère un code, annonce-le pendant ton live Facebook/TikTok. Chaque cliente peut l'utiliser <strong>une seule fois</strong> (par numéro de téléphone) pour bénéficier de la <strong>livraison gratuite</strong> sur n'importe quel produit ou panier.
          </p>
        </div>
      </div>

      {/* Génération */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Code personnalisé (ex: LIVE1) ou laisse vide"
          style={{ flex: "1 1 240px", padding: "11px 14px", border: "1px solid #ddd", borderRadius: 6, fontFamily: "'Jost',sans-serif", fontSize: 13, outline: "none", textTransform: "uppercase", color: DARK }}
          onFocus={(e) => (e.target.style.borderColor = GOLD)}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          onKeyDown={(e) => { if (e.key === "Enter") createCode(); }}
        />
        <button onClick={() => setInput(randomCode())} style={btn("#F0EBE4", DARK)}>🎲 Générer</button>
        <button onClick={createCode} style={btn(GOLD, "white")}>+ Créer le code</button>
      </div>

      {error && (
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12.5, color: "#C62828", background: "#FEECEC", border: "1px solid #EF9A9A", borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>{error}</p>
      )}

      {/* Liste des codes */}
      {loading ? (
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#999", padding: "30px 0", textAlign: "center" }}>Chargement…</p>
      ) : codes.length === 0 ? (
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#999", padding: "40px 0", textAlign: "center" }}>Aucun code pour l'instant. Génère ton premier code ci-dessus ! 🎟️</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {codes.map((c) => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              background: "white", border: "1px solid #EDE8E0", borderRadius: 10,
              borderLeft: `4px solid ${c.active ? "#4caf50" : "#bbb"}`, padding: "14px 16px",
            }}>
              {/* Code */}
              <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "1px", color: DARK }}>{c.code}</span>
                <button onClick={() => copy(c.code)} title="Copier" style={{ marginLeft: 8, border: "none", background: "none", cursor: "pointer", color: GOLD, fontSize: 12, fontFamily: "'Jost',sans-serif" }}>
                  {copied === c.code ? "✓ copié" : "📋 copier"}
                </button>
              </div>
              {/* Usage */}
              <div style={{ flexShrink: 0 }}>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#999" }}>Utilisé </span>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 700, color: GOLD }}>{usage[c.code] || 0}</span>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#999" }}> fois</span>
              </div>
              {/* Statut */}
              <span style={{
                flexShrink: 0, fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600,
                padding: "3px 10px", borderRadius: 20,
                background: c.active ? "rgba(76,175,80,0.12)" : "#F0EBE4",
                color: c.active ? "#2e7d32" : "#999",
              }}>{c.active ? "Actif" : "Désactivé"}</span>
              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
                <button onClick={() => toggleActive(c)} style={btn(c.active ? "#F0EBE4" : "#E8F5E9", c.active ? "#666" : "#2e7d32")}>
                  {c.active ? "Désactiver" : "Activer"}
                </button>
                <button onClick={() => remove(c)} style={btn("#FEECEC", "#C62828")}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

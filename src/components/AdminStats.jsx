// ============================================================
// Onglet « Statistiques » du back office
//
// Tout est dessiné en SVG maison : aucune librairie ajoutée
// (recharts pèse ~400 Ko, inutile pour une boutique qui tourne
// surtout sur mobile en 3G/4G).
//
// Contenu :
//   - Indicateurs clés (CA, panier moyen, taux de confirmation)
//   - Courbe du chiffre d'affaires sur la période
//   - Top 5 des produits vendus
//   - Répartition par catégorie (anneau)
//   - Top gouvernorats (utile pour la livraison)
//   - Export des commandes pour Excel
// ============================================================

import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const GOLD = "#C9A84C";
const DARK = "#2C2A20";
const PALETTE = ["#C9A84C", "#8FA98C", "#B07D62", "#7E8CA8", "#C58B9A", "#9A8FB0", "#6F9E9B", "#BFA98F"];

const jost = { fontFamily: "'Jost',sans-serif" };
const card = {
  background: "white", border: "1px solid #EDE8E0", borderRadius: 8,
  padding: 16, marginBottom: 14,
};

const dt = (o) => new Date(o.created_at || Date.now());
const jourISO = (d) => d.toISOString().slice(0, 10);
const fmtDT = (n) => Number(n || 0).toFixed(3) + " DT";

// Commandes qui comptent réellement comme du chiffre d'affaires
const encaissable = (o) => o.status !== "annulée";

// ─── Courbe (CA par jour) ─────────────────────────────────────
function Courbe({ points, hauteur = 170 }) {
  const W = 720, H = hauteur, P = 26;
  const max = Math.max(1, ...points.map((p) => p.valeur));
  const pas = points.length > 1 ? (W - P * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => [P + i * pas, H - P - ((p.valeur / max) * (H - P * 2))]);
  const ligne = xy.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1)).join(" ");
  const aire = ligne + " L" + (P + (points.length - 1) * pas).toFixed(1) + "," + (H - P) + " L" + P + "," + (H - P) + " Z";

  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="grad-ca" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1={P} x2={W - P} y1={H - P - f * (H - P * 2)} y2={H - P - f * (H - P * 2)}
          stroke="#EDE8E0" strokeWidth="1" />
      ))}
      <path d={aire} fill="url(#grad-ca)" />
      <path d={ligne} fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={points[i].valeur ? 2.6 : 0} fill={GOLD}>
          <title>{points[i].label + " — " + fmtDT(points[i].valeur)}</title>
        </circle>
      ))}
      <text x={P} y={H - 6} style={jost} fontSize="11" fill="#999">{points[0] && points[0].label}</text>
      <text x={W - P} y={H - 6} textAnchor="end" style={jost} fontSize="11" fill="#999">
        {points.length ? points[points.length - 1].label : ""}
      </text>
      <text x={P} y={16} style={jost} fontSize="11" fill="#999">{fmtDT(max)}</text>
    </svg>
  );
}

// ─── Barres horizontales ──────────────────────────────────────
function Barres({ items, unite = "" }) {
  const max = Math.max(1, ...items.map((i) => i.valeur));
  if (!items.length) return <p style={{ ...jost, fontSize: 12, color: "#999" }}>Aucune donnée sur la période.</p>;
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {items.map((it, i) => (
        <div key={it.label}>
          <div style={{ ...jost, fontSize: 12, color: DARK, display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{it.label}</span>
            <span style={{ color: "#999", flexShrink: 0 }}>{it.valeur}{unite}</span>
          </div>
          <div style={{ background: "#F5F1E8", borderRadius: 4, height: 8 }}>
            <div style={{
              width: ((it.valeur / max) * 100) + "%", height: "100%", borderRadius: 4,
              background: PALETTE[i % PALETTE.length], transition: "width .4s",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Anneau (répartition par catégorie) ───────────────────────
function Anneau({ items }) {
  const total = items.reduce((s, i) => s + i.valeur, 0);
  if (!total) return <p style={{ ...jost, fontSize: 12, color: "#999" }}>Aucune donnée sur la période.</p>;
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, flexShrink: 0 }}>
        <g transform="rotate(-90 70 70)">
          {items.map((it, i) => {
            const part = (it.valeur / total) * C;
            const el = (
              <circle key={it.label} cx="70" cy="70" r={R} fill="none"
                stroke={PALETTE[i % PALETTE.length]} strokeWidth="20"
                strokeDasharray={part + " " + (C - part)} strokeDashoffset={-offset}>
                <title>{it.label + " — " + it.valeur}</title>
              </circle>
            );
            offset += part;
            return el;
          })}
        </g>
        <text x="70" y="66" textAnchor="middle" style={jost} fontSize="19" fill={DARK}>{total}</text>
        <text x="70" y="82" textAnchor="middle" style={jost} fontSize="10" fill="#999">articles</text>
      </svg>
      <div style={{ display: "grid", gap: 6, minWidth: 150, flex: 1 }}>
        {items.map((it, i) => (
          <div key={it.label} style={{ ...jost, fontSize: 12, color: DARK, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
            <span style={{ color: "#999" }}>{Math.round((it.valeur / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ label, valeur, detail, couleur = GOLD }) {
  return (
    <div style={{ ...card, marginBottom: 0, borderTop: "3px solid " + couleur }}>
      <div style={{ ...jost, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
      <div style={{ ...jost, fontSize: 22, color: DARK, fontWeight: 600, marginTop: 4 }}>{valeur}</div>
      {detail && <div style={{ ...jost, fontSize: 11, color: "#aaa", marginTop: 2 }}>{detail}</div>}
    </div>
  );
}

// ─── Export Excel ─────────────────────────────────────────────
// CSV séparé par des points-virgules + BOM UTF-8 : double-clic et
// le fichier s'ouvre directement dans Excel, accents compris.
export function exporterExcel(orders) {
  const cols = [
    ["Date", (o) => dt(o).toLocaleString("fr-FR")],
    ["Cliente", (o) => o.customer_name],
    ["Téléphone", (o) => o.customer_phone],
    ["Email", (o) => o.customer_email || ""],
    ["Produit", (o) => o.product_name],
    ["Taille", (o) => o.size || ""],
    ["Couleur", (o) => o.color_label || ""],
    ["Quantité", (o) => o.quantity],
    ["Total (DT)", (o) => Number(o.total_price || 0).toFixed(3).replace(".", ",")],
    ["Statut", (o) => o.status],
    ["Gouvernorat", (o) => o.governorate || ""],
    ["Délégation", (o) => o.delegation || ""],
    ["Adresse", (o) => o.address || ""],
    ["Code promo", (o) => o.promo_code || ""],
  ];
  const echap = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const lignes = [
    cols.map((c) => echap(c[0])).join(";"),
    ...orders.map((o) => cols.map((c) => echap(c[1](o))).join(";")),
  ];
  const contenu = "﻿" + lignes.join("\r\n");
  const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "commandes-" + jourISO(new Date()) + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ─── Onglet ───────────────────────────────────────────────────
export default function AdminStats({ orders = [], isMobile }) {
  const [periode, setPeriode] = useState(30); // 7 / 30 / 90 jours
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    supabase.from("products").select("id, name, category, price, stock, is_active")
      .then(({ data }) => setProduits(data || []));
  }, []);

  const d = useMemo(() => {
    const depuis = new Date();
    depuis.setHours(0, 0, 0, 0);
    depuis.setDate(depuis.getDate() - (periode - 1));

    const dansPeriode = orders.filter((o) => dt(o) >= depuis);
    const valides = dansPeriode.filter(encaissable);

    // CA par jour (tous les jours de la période, même à zéro)
    const parJour = {};
    for (let i = 0; i < periode; i++) {
      const j = new Date(depuis);
      j.setDate(depuis.getDate() + i);
      parJour[jourISO(j)] = 0;
    }
    valides.forEach((o) => {
      const k = jourISO(dt(o));
      if (k in parJour) parJour[k] += Number(o.total_price || 0);
    });
    const courbe = Object.entries(parJour).map(([k, v]) => ({
      label: k.slice(8) + "/" + k.slice(5, 7), valeur: v,
    }));

    // Top produits (quantités vendues)
    const parProduit = {};
    valides.forEach((o) => {
      const k = o.product_name || "—";
      parProduit[k] = (parProduit[k] || 0) + Number(o.quantity || 1);
    });
    const topProduits = Object.entries(parProduit)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([label, valeur]) => ({ label, valeur }));

    // Catégories : retrouvées via la table produits (nom -> catégorie)
    const catParNom = {};
    produits.forEach((p) => { if (p.name) catParNom[p.name.toLowerCase()] = p.category; });
    const parCat = {};
    valides.forEach((o) => {
      const c = catParNom[(o.product_name || "").toLowerCase()] || "Autre";
      parCat[c] = (parCat[c] || 0) + Number(o.quantity || 1);
    });
    const categories = Object.entries(parCat).sort((a, b) => b[1] - a[1])
      .map(([label, valeur]) => ({ label, valeur }));

    // Gouvernorats
    const parGouv = {};
    valides.forEach((o) => {
      const g = o.governorate || "—";
      parGouv[g] = (parGouv[g] || 0) + 1;
    });
    const gouvernorats = Object.entries(parGouv).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([label, valeur]) => ({ label, valeur }));

    const ca = valides.reduce((s, o) => s + Number(o.total_price || 0), 0);
    const confirmees = dansPeriode.filter((o) => o.status === "confirmée" || o.status === "livrée").length;
    const annulees = dansPeriode.filter((o) => o.status === "annulée").length;

    return {
      courbe, topProduits, categories, gouvernorats, ca,
      nb: dansPeriode.length,
      panier: valides.length ? ca / valides.length : 0,
      tauxConfirm: dansPeriode.length ? (confirmees / dansPeriode.length) * 100 : 0,
      tauxAnnul: dansPeriode.length ? (annulees / dansPeriode.length) * 100 : 0,
    };
  }, [orders, periode, produits]);

  const titre = {
    ...jost, fontSize: 13, color: DARK, margin: "0 0 12px",
    letterSpacing: "1px", textTransform: "uppercase",
  };

  return (
    <div>
      {/* Période + export */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        {[7, 30, 90].map((p) => (
          <button key={p} onClick={() => setPeriode(p)} style={{
            ...jost, fontSize: 12, padding: "8px 14px", borderRadius: 6, cursor: "pointer",
            border: "1px solid " + (periode === p ? GOLD : "#ddd"),
            background: periode === p ? GOLD : "white",
            color: periode === p ? "white" : "#777",
          }}>{p} jours</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => exporterExcel(orders)} style={{
          ...jost, fontSize: 12, padding: "9px 16px", borderRadius: 6, cursor: "pointer",
          border: "none", background: DARK, color: GOLD, letterSpacing: "1px",
        }}>⤓ Exporter pour Excel</button>
      </div>

      {/* Indicateurs clés */}
      <div style={{
        display: "grid", gap: 12, marginBottom: 14,
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      }}>
        <KPI label="Chiffre d'affaires" valeur={fmtDT(d.ca)} detail={d.nb + " commande(s)"} />
        <KPI label="Panier moyen" valeur={fmtDT(d.panier)} couleur="#8FA98C" />
        <KPI label="Taux de confirmation" valeur={d.tauxConfirm.toFixed(0) + " %"} couleur="#7E8CA8" />
        <KPI label="Taux d'annulation" valeur={d.tauxAnnul.toFixed(0) + " %"}
          detail={d.tauxAnnul > 30 ? "⚠ élevé" : null}
          couleur={d.tauxAnnul > 30 ? "#EF9A9A" : "#B07D62"} />
      </div>

      <div style={card}>
        <h3 style={titre}>Chiffre d'affaires par jour</h3>
        <Courbe points={d.courbe} />
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
        <div style={card}>
          <h3 style={titre}>Top 5 des articles</h3>
          <Barres items={d.topProduits} unite=" vendu(s)" />
        </div>
        <div style={card}>
          <h3 style={titre}>Ventes par catégorie</h3>
          <Anneau items={d.categories} />
        </div>
      </div>

      <div style={card}>
        <h3 style={titre}>Où sont les clientes (livraison)</h3>
        <Barres items={d.gouvernorats} unite=" cmd" />
      </div>
    </div>
  );
}

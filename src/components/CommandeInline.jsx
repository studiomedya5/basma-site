// ============================================================
// Bloc de commande intégré à la fiche produit.
//
// La cliente reste sur la photo de l'article : elle saisit ses
// coordonnées juste en dessous et valide. Un écran de moins entre
// l'envie et l'achat = plus de commandes (surtout depuis une pub).
//
// Responsive sans JavaScript : la grille passe de 2 colonnes à 1
// toute seule selon la largeur RÉELLE du bloc (auto-fit/minmax),
// ce qui marche aussi bien dans le panneau étroit du PC que sur
// tablette ou téléphone.
//
// La logique métier (validation, livraison, promo, enregistrement)
// vit dans src/lib/commande.js, partagée avec OrderModal.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useLang } from "../context/LangContext";
import { fbTrack } from "../lib/pixel";
import { DELEGATIONS } from "../lib/tunisia";
import {
  GOUVERNORATS, DELIVERY_FEE, calculerTotaux, validerCommande,
  verifierPromo, envoyerCommande, lienWhatsappCommande,
} from "../lib/commande";

const GOLD = "#C9A84C";
const DARK = "#2C2A20";
const CREAM = "#FAF9F6";

const jost = { fontFamily: "'Jost',sans-serif" };

const labelStyle = {
  ...jost, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase",
  color: "rgba(201,168,76,0.8)", display: "block", marginBottom: 6,
};

// 16px minimum : en dessous, iOS zoome tout seul sur le champ actif
// et casse la mise en page au moment le plus sensible.
const champ = (erreur) => ({
  ...jost, width: "100%", boxSizing: "border-box",
  padding: "12px 13px", minHeight: 46, fontSize: 16, lineHeight: 1.2,
  color: DARK, background: "white", outline: "none", borderRadius: 4,
  border: `1px solid ${erreur ? "#e57373" : "rgba(44,42,32,0.16)"}`,
  borderLeft: `3px solid ${erreur ? "#e57373" : "transparent"}`,
  transition: "border-color .18s",
});

function Erreur({ children }) {
  return children ? (
    <p style={{ ...jost, fontSize: 11, color: "#e57373", marginTop: 4 }}>{children}</p>
  ) : null;
}

export default function CommandeInline({
  product, colorIdx, size, hasColors, variants, onDone,
}) {
  const { t } = useLang();
  const blocRef = useRef(null);

  const [form, setForm] = useState({
    nom: "", telephone: "", email: "", adresse: "",
    gouvernorat: "", delegation: "", qty: 1, size: size || "TU",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoMsg, setPromoMsg] = useState(null);

  // La taille suit celle choisie plus haut dans la fiche
  useEffect(() => { setForm((p) => ({ ...p, size: size || "TU" })); }, [size]);

  // Pixel : début de commande (étape clé du tunnel Vente)
  useEffect(() => {
    fbTrack("InitiateCheckout", {
      content_name: product.name,
      content_category: product.category,
      content_type: "product",
      value: product.price,
    });
  }, [product.name, product.category, product.price]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };
  const setGouvernorat = (v) => {
    setForm((p) => ({ ...p, gouvernorat: v, delegation: "" }));
    setErrors((p) => ({ ...p, gouvernorat: "", delegation: "" }));
  };
  const delegations = DELEGATIONS[form.gouvernorat] ?? [];

  const { subtotal, deliveryFee, total } = calculerTotaux({
    price: product.price, qty: form.qty, promoApplied,
  });

  const appliquerPromo = async () => {
    const r = await verifierPromo(promoInput);
    if (!r.valid) {
      setPromoApplied(null);
      setPromoMsg({ ok: false, text: r.reason === "expired" ? t("promo_expired") : t("promo_invalid") });
      return;
    }
    setPromoApplied(promoInput.trim().toUpperCase());
    setPromoMsg({ ok: true, text: t("promo_free_ship") });
  };

  const valider = async (e) => {
    e.preventDefault();
    const errs = validerCommande(form, { hasColors, colorIdx, colorEpuisee: false }, t);
    if (Object.keys(errs).length) {
      setErrors(errs);
      // On remonte au premier champ en erreur
      blocRef.current?.querySelector("[data-erreur='1']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStatus("loading");
    const r = await envoyerCommande({
      product, form, colorIdx, hasColors, variants, promoApplied,
      totalPrice: total, activeImg: product.img,
    });
    if (r.ok) { setStatus("success"); return; }
    if (r.motif === "promo") {
      setPromoApplied(null);
      setPromoMsg({
        ok: false,
        text: r.raison === "used" ? t("promo_used") : r.raison === "expired" ? t("promo_expired") : t("promo_invalid"),
      });
      setStatus("idle");
      return;
    }
    setStatus("error");
  };

  /* ── Confirmation ── */
  if (status === "success") {
    return (
      <div ref={blocRef} style={{
        marginTop: 16, padding: "26px 18px", textAlign: "center",
        background: "rgba(46,125,50,0.06)", border: "1px solid rgba(46,125,50,0.25)", borderRadius: 8,
      }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>✓</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: DARK, margin: "0 0 8px" }}>
          {t("order_confirmed")}
        </h3>
        <p style={{ ...jost, fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 18 }}>
          {t("will_contact")} <strong style={{ color: DARK }}>{form.telephone}</strong>
        </p>
        <button onClick={onDone} style={{
          ...jost, padding: "13px 34px", background: DARK, color: GOLD, border: "none",
          borderRadius: 4, cursor: "pointer", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase",
        }}>{t("close")}</button>
      </div>
    );
  }

  /* ── Échec : on ne perd pas la vente, on bascule sur WhatsApp ── */
  if (status === "error") {
    return (
      <div ref={blocRef} style={{
        marginTop: 16, padding: "24px 18px", textAlign: "center",
        background: "rgba(229,115,115,0.06)", border: "1px solid rgba(229,115,115,0.3)", borderRadius: 8,
      }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>⚠️</div>
        <p style={{ ...jost, fontSize: 13, color: "#666", marginBottom: 16 }}>{t("please_retry")}</p>
        <a href={lienWhatsappCommande({ product, form, colorIdx, hasColors, totalPrice: total })}
          target="_blank" rel="noreferrer" style={{
            ...jost, display: "block", padding: "14px", background: "#25D366", color: "white",
            textDecoration: "none", borderRadius: 4, fontSize: 12, letterSpacing: "1.5px",
            textTransform: "uppercase", marginBottom: 10,
          }}>{t("order_whatsapp")}</a>
        <button onClick={() => setStatus("idle")} style={{
          ...jost, width: "100%", padding: "13px", background: "transparent", color: DARK,
          border: `1px solid ${DARK}`, borderRadius: 4, cursor: "pointer",
          fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase",
        }}>{t("retry")}</button>
      </div>
    );
  }

  /* ── Formulaire ── */
  return (
    <form ref={blocRef} onSubmit={valider} style={{
      marginTop: 16, padding: 16, background: CREAM,
      border: "1px solid rgba(201,168,76,0.28)", borderRadius: 8,
      animation: "fadeUp 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ ...jost, fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: DARK, fontWeight: 600 }}>
          {t("your_info")}
        </span>
        <span style={{ ...jost, fontSize: 10.5, color: "#999" }}>{t("cod_hint")}</span>
      </div>

      {/* Grille auto-adaptative : 2 colonnes si la place le permet, sinon 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <div data-erreur={errors.nom ? "1" : undefined}>
          <label style={labelStyle}>{t("name")} *</label>
          <input value={form.nom} onChange={(e) => set("nom", e.target.value)}
            autoComplete="name" placeholder={t("name_ph")} style={champ(errors.nom)} />
          <Erreur>{errors.nom}</Erreur>
        </div>

        <div data-erreur={errors.telephone ? "1" : undefined}>
          <label style={labelStyle}>{t("phone")} *</label>
          <input value={form.telephone} onChange={(e) => set("telephone", e.target.value)}
            type="tel" inputMode="tel" autoComplete="tel" placeholder="+216 XX XXX XXX"
            style={champ(errors.telephone)} />
          <Erreur>{errors.telephone}</Erreur>
        </div>

        <div data-erreur={errors.gouvernorat ? "1" : undefined}>
          <label style={labelStyle}>{t("governorate")} *</label>
          <select value={form.gouvernorat} onChange={(e) => setGouvernorat(e.target.value)}
            style={{ ...champ(errors.gouvernorat), appearance: "auto" }}>
            <option value="">{t("choose_gov")}</option>
            {GOUVERNORATS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <Erreur>{errors.gouvernorat}</Erreur>
        </div>

        <div data-erreur={errors.delegation ? "1" : undefined}>
          <label style={labelStyle}>{t("delegation")} *</label>
          <select value={form.delegation} onChange={(e) => set("delegation", e.target.value)}
            disabled={!form.gouvernorat}
            style={{ ...champ(errors.delegation), appearance: "auto", opacity: form.gouvernorat ? 1 : 0.55 }}>
            <option value="">{form.gouvernorat ? t("choose_deleg") : t("choose_gov_first")}</option>
            {delegations.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <Erreur>{errors.delegation}</Erreur>
        </div>

        <div style={{ gridColumn: "1/-1" }} data-erreur={errors.adresse ? "1" : undefined}>
          <label style={labelStyle}>{t("address")} *</label>
          <input value={form.adresse} onChange={(e) => set("adresse", e.target.value)}
            autoComplete="street-address" placeholder={t("address_ph")} style={champ(errors.adresse)} />
          <Erreur>{errors.adresse}</Erreur>
        </div>

        <div>
          <label style={labelStyle}>{t("email")} <span style={{ textTransform: "none", letterSpacing: 0 }}>({t("optional")})</span></label>
          <input value={form.email} onChange={(e) => set("email", e.target.value)}
            type="email" inputMode="email" autoComplete="email" style={champ(false)} />
        </div>

        <div>
          <label style={labelStyle}>{t("quantity")}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 0, height: 46 }}>
            <button type="button" onClick={() => set("qty", Math.max(1, form.qty - 1))} style={boutonQty}>−</button>
            <span style={{ ...jost, flex: 1, textAlign: "center", fontSize: 16, color: DARK }}>{form.qty}</span>
            <button type="button" onClick={() => set("qty", Math.min(20, form.qty + 1))} style={boutonQty}>+</button>
          </div>
        </div>
      </div>

      {/* Code promo */}
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>🎟️ {t("promo_code")}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={promoInput}
            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoMsg(null); setPromoApplied(null); }}
            placeholder={t("promo_placeholder")} disabled={!!promoApplied}
            style={{ ...champ(false), flex: 1, textTransform: "uppercase",
              borderColor: promoApplied ? "#4caf50" : "rgba(44,42,32,0.16)" }} />
          {promoApplied ? (
            <button type="button" onClick={() => { setPromoApplied(null); setPromoInput(""); setPromoMsg(null); }}
              style={{ ...jost, padding: "0 16px", minHeight: 46, background: "transparent", color: "#999",
                border: "1px solid rgba(44,42,32,0.16)", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>✕</button>
          ) : (
            <button type="button" onClick={appliquerPromo}
              style={{ ...jost, padding: "0 18px", minHeight: 46, background: DARK, color: GOLD,
                border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
                letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {t("promo_apply")}
            </button>
          )}
        </div>
        {promoMsg && (
          <p style={{ ...jost, fontSize: 11, marginTop: 5, color: promoMsg.ok ? "#2e7d32" : "#e57373" }}>
            {promoMsg.text}
          </p>
        )}
      </div>

      {/* Récapitulatif */}
      <div style={{
        marginTop: 14, padding: "12px 14px", borderRadius: 6, background: "white",
        border: "1px solid rgba(44,42,32,0.08)",
      }}>
        <Ligne label={`${t("subtotal")} (${form.qty})`} valeur={`${subtotal.toFixed(3)} DT`} />
        <Ligne
          label={t("delivery")}
          valeur={deliveryFee === 0 ? t("delivery_free") : `${DELIVERY_FEE} DT`}
          vert={deliveryFee === 0}
        />
        <div style={{ height: 1, background: "rgba(44,42,32,0.1)", margin: "9px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ ...jost, fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", color: DARK }}>
            {t("total")}
          </span>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 600, color: GOLD }}>
            {total.toFixed(3)} <span style={{ ...jost, fontSize: 12 }}>DT</span>
          </span>
        </div>
      </div>

      <button type="submit" disabled={status === "loading"} style={{
        ...jost, width: "100%", marginTop: 14, padding: "16px 8px", minHeight: 52,
        background: status === "loading" ? "#7a7768" : DARK, color: GOLD,
        border: "none", borderRadius: 4, cursor: status === "loading" ? "wait" : "pointer",
        fontSize: 13, letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 500,
      }}>
        {status === "loading" ? t("sending") : t("confirm_order")}
      </button>

    </form>
  );
}

function Ligne({ label, valeur, vert }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ ...jost, fontSize: 12.5, color: "#777" }}>{label}</span>
      <span style={{ ...jost, fontSize: 12.5, color: vert ? "#2e7d32" : DARK, fontWeight: vert ? 600 : 500 }}>
        {valeur}
      </span>
    </div>
  );
}

const boutonQty = {
  fontFamily: "'Jost',sans-serif", width: 44, height: 46, fontSize: 18,
  background: "white", color: DARK, border: "1px solid rgba(44,42,32,0.16)",
  cursor: "pointer", lineHeight: 1,
};

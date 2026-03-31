import { useState } from "react";
import { supabase } from "../lib/supabase";

const GOUVERNORATS = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine",
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine",
  "Tozeur", "Tunis", "Zaghouan",
];

const DELIVERY_FEE = 8;
const FREE_THRESHOLD = 100;

export default function OrderModal({ product, onClose }) {
  // product may include: photos (array), catId, initialColorIdx
  const hasColors = product.photos && product.photos.length > 1;

  const [colorIdx, setColorIdx] = useState(product.initialColorIdx ?? (hasColors ? null : 0));
  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
    gouvernorat: "",
    qty: 1,
    size: product.sizes?.[0] ?? product.size ?? "TU",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const activeImg = product.photos
    ? `/photos/${product.catId}/${product.photos[colorIdx ?? 0]}`
    : product.img;

  const subtotal = product.price * form.qty;
  const deliveryFee = subtotal < FREE_THRESHOLD ? DELIVERY_FEE : 0;
  const totalPrice = subtotal + deliveryFee;

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (hasColors && colorIdx === null) e.color = "Veuillez choisir une couleur";
    if (!form.nom.trim())       e.nom        = "Requis";
    if (!form.telephone.trim()) e.telephone  = "Requis";
    if (!form.adresse.trim())   e.adresse    = "Requis";
    if (!form.gouvernorat)      e.gouvernorat = "Requis";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus("loading");

    // Données de base (colonnes garanties)
    const orderData = {
      product_id:     product.id ?? null,
      product_name:   product.name,
      size:           form.size,
      quantity:       form.qty,
      total_price:    totalPrice,
      customer_name:  form.nom,
      customer_phone: form.telephone,
      address:        form.adresse,
      governorate:    form.gouvernorat,
      status:         "en_attente",
    };

    // Ajouter email si la colonne existe (évite l'erreur si pas encore migrée)
    if (form.email.trim()) orderData.customer_email = form.email.trim();

    let { error } = await supabase.from("orders").insert(orderData);

    // Si erreur à cause de customer_email inconnu, réessayer sans
    if (error && error.message?.includes("customer_email")) {
      delete orderData.customer_email;
      const retry = await supabase.from("orders").insert(orderData);
      error = retry.error;
    }

    if (error) { console.error("Order error:", error); setStatus("error"); return; }
    setStatus("success");

    const colorLabel = hasColors ? `Couleur ${(colorIdx ?? 0) + 1}` : "—";

    // Envoi email via Edge Function (non-bloquant)
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        customer_name: form.nom,
        customer_phone: form.telephone,
        customer_email: form.email.trim() || null,
        product_name: product.name,
        size: form.size,
        quantity: form.qty,
        total_price: totalPrice,
        address: form.adresse,
        governorate: form.gouvernorat,
        color_label: colorLabel,
      }),
    }).catch(() => {});

    // Les emails sont envoyés via la Edge Function ci-dessus
  };

  const inp = (key, placeholder, type = "text") => (
    <input
      type={type}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "11px 14px",
        border: `1px solid ${errors[key] ? "#e57373" : "#ddd"}`,
        fontFamily: "'Jost',sans-serif", fontSize: 13,
        outline: "none", background: "white", color: "var(--dark)", borderRadius: 2,
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
      onBlur={(e) => (e.target.style.borderColor = errors[key] ? "#e57373" : "#ddd")}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }} />

      <div className="order-modal-inner" style={{
        position: "relative", background: "white", width: "min(820px,96vw)", maxHeight: "95vh",
        display: "flex", overflow: "hidden", animation: "fadeUp 0.3s ease", borderRadius: 2,
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>

        {/* ── Photo (changes with selected color) ── */}
        <div className="order-modal-photo" style={{ flex: "0 0 42%", position: "relative", background: "#f0ebe4" }}>
          <img
            src={activeImg}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.25s" }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
            padding: "40px 20px 20px",
          }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(200,149,108,0.9)", marginBottom: 4 }}>
              {product.category}
            </p>
            <p style={{ color: "white", fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>
              {product.name}
            </p>
            <span style={{ fontFamily: "'Jost',sans-serif", color: "var(--gold)", fontSize: 22, fontWeight: 700 }}>
              {product.price} ت.د
            </span>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="order-modal-form" style={{ flex: 1, overflowY: "auto", padding: "32px 28px" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, zIndex: 3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* ── Success ── */}
          {status === "success" && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ display: "block", margin: "0 auto 16px" }}>
                <circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" />
              </svg>
              <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 10 }}>Commande confirmée !</h2>
              <p style={{ fontFamily: "'Jost',sans-serif", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
                Votre commande a bien été enregistrée.<br />
                Nous vous contacterons au<br />
                <strong style={{ color: "var(--dark)" }}>{form.telephone}</strong>.
              </p>
              <button className="btn-gold" onClick={onClose} style={{ padding: "12px 36px", fontSize: 12 }}>Fermer</button>
            </div>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 20, fontWeight: 400, marginBottom: 10 }}>Une erreur est survenue</h2>
              <p style={{ fontFamily: "'Jost',sans-serif", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
                Impossible d'enregistrer votre commande.<br />Veuillez réessayer.
              </p>
              <button className="btn-gold" onClick={() => setStatus("idle")} style={{ padding: "12px 36px", fontSize: 12 }}>Réessayer</button>
            </div>
          )}

          {/* ── Form ── */}
          {(status === "idle" || status === "loading") && (
            <form onSubmit={handleSubmit} noValidate>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>
                Passer la commande
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 500, color: "var(--dark)", marginBottom: 16 }}>
                {product.name}
              </h2>

              {/* ── Couleur ── */}
              {hasColors && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: errors.color ? "#e57373" : "var(--text-muted)", marginBottom: 8 }}>
                    Couleur {errors.color && <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0 }}>— {errors.color}</span>}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {product.photos.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setColorIdx(i); setErrors(p => ({ ...p, color: "" })); }}
                        title={`Couleur ${i + 1}`}
                        style={{
                          width: 36, height: 36, padding: 0,
                          borderRadius: "50%",
                          border: i === colorIdx ? "2.5px solid var(--gold)" : "2.5px solid transparent",
                          outline: i === colorIdx ? "2px solid var(--gold)" : "1.5px solid rgba(200,149,108,0.3)",
                          outlineOffset: 2,
                          cursor: "pointer", overflow: "hidden", background: "none", flexShrink: 0,
                          transition: "border-color 0.2s, transform 0.15s",
                          transform: i === colorIdx ? "scale(1.12)" : "scale(1)",
                        }}
                      >
                        <img
                          src={`/photos/${product.catId}/${photo}`}
                          loading="lazy" alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Taille ── */}
              {product.sizes && product.sizes.length > 1 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                    Taille
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {product.sizes.map((s) => (
                      <button key={s} type="button" onClick={() => set("size", s)} style={{
                        padding: "7px 16px",
                        border: form.size === s ? "2px solid var(--gold)" : "1px solid #ddd",
                        background: form.size === s ? "var(--gold)" : "white",
                        color: form.size === s ? "white" : "var(--dark)",
                        fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 500,
                        cursor: "pointer", borderRadius: 2,
                      }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Frais de livraison ── */}
              <div style={{
                background: deliveryFee === 0 ? "#f0faf4" : "#fdf6ec",
                border: `1px solid ${deliveryFee === 0 ? "#c3e6cb" : "rgba(200,149,108,0.35)"}`,
                padding: "10px 14px", marginBottom: 18, borderRadius: 2,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 15 }}>🚚</span>
                {deliveryFee === 0 ? (
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#2e7d32", fontWeight: 500 }}>
                    Livraison gratuite ✓
                  </span>
                ) : (
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "var(--dark)" }}>
                    Frais de livraison : <strong style={{ color: "var(--gold)" }}>{DELIVERY_FEE} DT</strong>
                    <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: 11 }}>
                      (gratuit dès 100 DT)
                    </span>
                  </span>
                )}
              </div>

              {/* ── Nom + Téléphone ── */}
              <div className="order-form-row" style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>Nom et prénom *</label>
                  {inp("nom", "Votre nom")}
                  {errors.nom && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors.nom}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>Téléphone *</label>
                  {inp("telephone", "+216 XX XXX XXX", "tel")}
                  {errors.telephone && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors.telephone}</p>}
                </div>
              </div>

              {/* ── Email (optionnel) ── */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>
                  Email <span style={{ color: "#bbb", fontWeight: 300 }}>(optionnel)</span>
                </label>
                {inp("email", "votre@email.com", "email")}
              </div>

              {/* ── Adresse + Gouvernorat ── */}
              <div className="order-form-row" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>Adresse *</label>
                  {inp("adresse", "Rue, numéro...")}
                  {errors.adresse && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors.adresse}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>Gouvernorat *</label>
                  <select
                    value={form.gouvernorat}
                    onChange={(e) => set("gouvernorat", e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px",
                      border: `1px solid ${errors.gouvernorat ? "#e57373" : "#ddd"}`,
                      fontFamily: "'Jost',sans-serif", fontSize: 13, outline: "none",
                      background: "white", color: form.gouvernorat ? "var(--dark)" : "#aaa",
                      cursor: "pointer", borderRadius: 2,
                    }}
                  >
                    <option value="">Choisir un gouvernorat</option>
                    {GOUVERNORATS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gouvernorat && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors.gouvernorat}</p>}
                </div>
              </div>

              {/* ── Quantité + Total ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 2, overflow: "hidden" }}>
                  <button type="button" onClick={() => set("qty", Math.max(1, form.qty - 1))}
                    style={{ width: 38, height: 38, border: "none", background: "#f9f9f9", fontSize: 18, cursor: "pointer", color: "var(--dark)", borderRight: "1px solid #ddd" }}>
                    −
                  </button>
                  <span style={{ width: 44, textAlign: "center", fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 600 }}>
                    {form.qty}
                  </span>
                  <button type="button" onClick={() => set("qty", form.qty + 1)}
                    style={{ width: 38, height: 38, border: "none", background: "#f9f9f9", fontSize: 18, cursor: "pointer", color: "var(--dark)", borderLeft: "1px solid #ddd" }}>
                    +
                  </button>
                </div>
                <div style={{ textAlign: "right" }}>
                  {deliveryFee > 0 && (
                    <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 1 }}>
                      {subtotal} + {DELIVERY_FEE} DT livraison
                    </span>
                  )}
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Total</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>
                    {totalPrice} ت.د
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-gold"
                disabled={status === "loading"}
                style={{ width: "100%", padding: "14px", fontSize: 12, opacity: status === "loading" ? 0.7 : 1, cursor: status === "loading" ? "wait" : "pointer" }}
              >
                {status === "loading" ? "Envoi en cours..." : "Commander →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

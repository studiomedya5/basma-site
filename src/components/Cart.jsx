import { useState } from "react";
import { useCart, cartItemKey } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";

const GOUVERNORATS = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine",
  "Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine",
  "Tozeur","Tunis","Zaghouan",
];

const inputStyle = (hasError) => ({
  width: "100%", padding: "11px 14px",
  border: `1px solid ${hasError ? "#e57373" : "#ddd"}`,
  fontFamily: "'Jost',sans-serif", fontSize: 13,
  outline: "none", background: "white", color: "var(--dark)",
  borderRadius: 2, boxSizing: "border-box",
});

export default function Cart() {
  const { t } = useLang();
  const { items, removeItem, updateQty, clearCart, total, count, isOpen, setIsOpen } = useCart();
  const [step, setStep] = useState("cart"); // cart | checkout | success | error
  const [form, setForm] = useState({ nom: "", telephone: "", adresse: "", gouvernorat: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const closeCart = () => {
    setIsOpen(false);
    setTimeout(() => { setStep("cart"); setErrors({}); }, 400);
  };

  const setF = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.nom.trim())       errs.nom        = t("required");
    if (!form.telephone.trim()) errs.telephone  = t("required");
    if (!form.adresse.trim())   errs.adresse    = t("required");
    if (!form.gouvernorat)      errs.gouvernorat = t("required");
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const rows = items.map(item => ({
      product_name:   item.name,
      size:           item.size,
      quantity:       item.qty,
      total_price:    item.price * item.qty,
      customer_name:  form.nom,
      customer_phone: form.telephone,
      address:        form.adresse,
      governorate:    form.gouvernorat,
      status:         "en_attente",
    }));
    const { error } = await supabase.from("orders").insert(rows);
    setLoading(false);
    if (error) { setStep("error"); return; }
    clearCart();
    setStep("success");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          WebkitBackdropFilter: "blur(2px)", backdropFilter: "blur(2px)",
          zIndex: 2000,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        zIndex: 2001,
        width: "min(420px, 100vw)",
        background: "white",
        display: "flex", flexDirection: "column",
        animation: "slideIn 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
        boxShadow: "-12px 0 50px rgba(0,0,0,0.18)",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(200,149,108,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === "checkout" && (
              <button
                onClick={() => setStep("cart")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, fontFamily: "'Cormorant Garamond', serif" }}>
                {step === "checkout" ? t("checkout_title") : t("my_cart")}
              </h2>
              {step === "cart" && count > 0 && (
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0", letterSpacing: "0.5px" }}>
                  {count} {t("articles")}
                </p>
              )}
            </div>
          </div>
          <button onClick={closeCart} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* ── Cart list ── */}
          {step === "cart" && (
            items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 32px" }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(200,149,108,0.35)" strokeWidth="1.2"
                  style={{ display: "block", margin: "0 auto 18px" }}>
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text-muted)", marginBottom: 8 }}>{t("cart_empty")}</p>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}>
                  {t("cart_empty_sub")}
                </p>
              </div>
            ) : (
              <div>
                {items.map(item => {
                  const k = cartItemKey(item);
                  return (
                    <div key={k} style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid rgba(200,149,108,0.1)",
                      display: "flex", gap: 14,
                    }}>
                      {/* Photo */}
                      <div style={{ width: 72, height: 90, flexShrink: 0, overflow: "hidden", background: "#f5f0ea" }}>
                        <img src={item.img} alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: "'Jost',sans-serif", fontSize: 9,
                          color: "var(--gold)", letterSpacing: "1.5px",
                          textTransform: "uppercase", marginBottom: 3,
                        }}>{item.category}</p>
                        <p style={{
                          fontSize: 14, fontWeight: 500, lineHeight: 1.3,
                          marginBottom: 3, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{item.name}</p>
                        {item.size && item.size !== "TU" && (
                          <p style={{
                            fontFamily: "'Jost',sans-serif", fontSize: 11,
                            color: "var(--text-muted)", marginBottom: 10,
                          }}>{t("size")} : {item.size}</p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          {/* Qty stepper */}
                          <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 2 }}>
                            <button onClick={() => updateQty(k, -1)}
                              style={{ width: 30, height: 30, border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              −
                            </button>
                            <span style={{ width: 30, textAlign: "center", fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 600 }}>
                              {item.qty}
                            </span>
                            <button onClick={() => updateQty(k, 1)}
                              style={{ width: 30, height: 30, border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              +
                            </button>
                          </div>
                          {/* Price + delete */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>
                              {item.price * item.qty} ت.د
                            </span>
                            <button
                              onClick={() => removeItem(k)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 2, transition: "color 0.2s" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#e57373"}
                              onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── Checkout form ── */}
          {step === "checkout" && (
            <form id="cart-checkout-form" onSubmit={handleCheckout} noValidate style={{ padding: "24px" }}>

              {/* Summary */}
              <div style={{ background: "#faf7f2", padding: "14px 16px", marginBottom: 22, borderRadius: 2, border: "1px solid rgba(200,149,108,0.15)" }}>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
                  Récapitulatif
                </p>
                {items.map(item => (
                  <div key={cartItemKey(item)} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "var(--dark)" }}>
                      {item.name}{item.size !== "TU" ? ` (${item.size})` : ""} ×{item.qty}
                    </span>
                    <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600 }}>
                      {item.price * item.qty} ت.د
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(200,149,108,0.2)", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600 }}>{t("total")}</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 17, fontWeight: 700, color: "var(--gold)" }}>{total} ت.د</span>
                </div>
              </div>

              {/* Free delivery banner */}
              <div style={{ background: "#f0faf4", border: "1px solid #c3e6cb", padding: "10px 14px", marginBottom: 20, borderRadius: 2, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#2e7d32", fontWeight: 500 }}>
                  {t("free_delivery_tn")}
                </span>
              </div>

              {/* Fields */}
              {[
                { k: "nom",       label: `${t("name")} *`,    placeholder: t("name_ph"),     type: "text" },
                { k: "telephone", label: `${t("phone")} *`,   placeholder: "+216 XX XXX XXX", type: "tel"  },
                { k: "adresse",   label: `${t("address")} *`, placeholder: t("address_ph"),  type: "text" },
              ].map(({ k, label, placeholder, type }) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>
                    {label}
                  </label>
                  <input
                    type={type} value={form[k]}
                    onChange={e => setF(k, e.target.value)}
                    placeholder={placeholder}
                    style={inputStyle(errors[k])}
                    onFocus={e => e.target.style.borderColor = "var(--gold)"}
                    onBlur={e => e.target.style.borderColor = errors[k] ? "#e57373" : "#ddd"}
                  />
                  {errors[k] && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors[k]}</p>}
                </div>
              ))}

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>
                  {t("governorate")} *
                </label>
                <select
                  value={form.gouvernorat}
                  onChange={e => setF("gouvernorat", e.target.value)}
                  style={{
                    width: "100%", padding: "11px 14px",
                    border: `1px solid ${errors.gouvernorat ? "#e57373" : "#ddd"}`,
                    fontFamily: "'Jost',sans-serif", fontSize: 13,
                    outline: "none", background: "white",
                    color: form.gouvernorat ? "var(--dark)" : "#aaa",
                    cursor: "pointer", borderRadius: 2,
                  }}
                >
                  <option value="">{t("choose_gov")}</option>
                  {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.gouvernorat && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors.gouvernorat}</p>}
              </div>
            </form>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "70px 32px" }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none"
                stroke="var(--gold)" strokeWidth="1.4"
                style={{ display: "block", margin: "0 auto 20px" }}>
                <circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" />
              </svg>
              <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 10 }}>{t("order_confirmed")}</h2>
              <p style={{ fontFamily: "'Jost',sans-serif", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.9, marginBottom: 32 }}>
                {t("order_saved")}<br />
                {t("will_contact")}<br />
                <strong style={{ color: "var(--dark)" }}>{form.telephone}</strong>.
              </p>
              <button className="btn-gold" onClick={closeCart} style={{ padding: "12px 40px", fontSize: 12 }}>
                {t("close")}
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {step === "error" && (
            <div style={{ textAlign: "center", padding: "70px 32px" }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>⚠️</div>
              <h2 style={{ fontSize: 20, fontWeight: 400, marginBottom: 10 }}>{t("error_word")}</h2>
              <p style={{ fontFamily: "'Jost',sans-serif", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
                {t("order_save_error")}
              </p>
              <button className="btn-gold" onClick={() => setStep("checkout")} style={{ padding: "12px 40px", fontSize: 12 }}>
                {t("retry")}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (step === "cart" || step === "checkout") && (
          <div style={{
            padding: "18px 24px",
            borderTop: "1px solid rgba(200,149,108,0.15)",
            background: "white",
            flexShrink: 0,
          }}>
            {step === "cart" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "var(--text-muted)" }}>{t("total")}</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>{total} ت.د</span>
                </div>
                <button
                  className="btn-gold"
                  onClick={() => setStep("checkout")}
                  style={{ width: "100%", padding: "14px", fontSize: 12 }}
                >
                  {t("validate_order")} →
                </button>
              </>
            )}
            {step === "checkout" && (
              <button
                className="btn-gold"
                form="cart-checkout-form"
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "14px", fontSize: 12, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
              >
                {loading ? t("sending") : `${t("confirm_order")} →`}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

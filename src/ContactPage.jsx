import { useState, useEffect } from "react";
import SummerDecor from "./SummerDecor";
import AnnouncementBar, { ANNOUNCE_H } from "./components/AnnouncementBar";

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function ContactPage({ onBack }) {
  const [form, setForm] = useState({ nom: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = "Le nom est requis";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Email invalide";
    if (!form.message.trim()) e.message = "Le message est requis";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSent(true);
  };

  const navItems = [
    { label: "ACCUEIL",    action: onBack },
    { label: "EXCLUSIFS",  action: onBack },
    { label: "COLLECTION", action: onBack },
    { label: "CONTACT",    action: () => {} },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, var(--cream) 0%, #F5EDE4 50%, #EDE3D8 100%)", position: "relative" }}>
      <AnnouncementBar />
      <SummerDecor />

      {/* ── Header / Nav ── */}
      <header style={{
        position: "sticky", top: ANNOUNCE_H, zIndex: 100, height: 70,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px,4vw,60px)",
        background: "rgba(250,247,242,0.95)", WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(200,149,108,0.18)"
      }}>
        {/* Logo */}
        <img src="/images/logo.png" alt="Basma" style={{ height: 42, cursor: "pointer" }} onClick={onBack} />

        {/* Nav links */}
        <div className="nav-links-desktop" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {navItems.map(({ label, action }) => (
            <a key={label} className="nav-link" onClick={action}
              style={{ color: label === "CONTACT" ? "var(--gold)" : undefined }}>
              {label}
            </a>
          ))}
        </div>

        {/* Back button */}
        <button className="coll-back-btn" onClick={onBack}>
          <BackIcon /> Retour
        </button>
      </header>

      {/* ── Content ── */}
      <div className="contact-content" style={{
        maxWidth: 680, margin: "0 auto",
        padding: "72px clamp(20px,4vw,60px) 100px",
        position: "relative", zIndex: 1
      }}>
        {/* Title section */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{
            fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "4px",
            textTransform: "uppercase", color: "var(--gold)", marginBottom: 16,
            animation: "fadeUp 0.6s ease both"
          }}>Nous Contacter</p>
          <h1 style={{
            fontSize: "clamp(34px,5vw,52px)", fontWeight: 300, letterSpacing: "-1px",
            color: "var(--dark)", lineHeight: 1.05, marginBottom: 22,
            animation: "fadeUp 0.7s ease 0.08s both"
          }}>
            Envoyez-nous<br />
            <em style={{ fontWeight: 500, color: "var(--gold)", fontStyle: "italic" }}>un message</em>
          </h1>
          <div className="coll-divider" style={{ marginBottom: 16 }}>
            <div className="coll-line" />
            <span className="coll-sub">On vous répond rapidement</span>
            <div className="coll-line" />
          </div>
        </div>

        {/* Form or Success */}
        {sent ? (
          <div style={{
            textAlign: "center", padding: "64px 40px",
            background: "white", border: "1px solid rgba(200,149,108,0.2)",
            animation: "fadeUp 0.4s ease"
          }}>
            <div style={{ marginBottom: 20 }}><CheckIcon /></div>
            <h2 style={{ fontSize: 26, fontWeight: 400, marginBottom: 12 }}>Message envoyé !</h2>
            <p style={{
              fontFamily: "'Jost',sans-serif", color: "var(--text-muted)",
              fontSize: 14, lineHeight: 1.7, marginBottom: 36
            }}>
              Merci de nous avoir contactés. Nous reviendrons vers vous très prochainement.
            </p>
            <button className="btn-gold" onClick={onBack}
              style={{ padding: "14px 40px", fontSize: 12 }}>
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{
            background: "white", padding: "clamp(32px,5vw,56px)",
            border: "1px solid rgba(200,149,108,0.2)",
            animation: "fadeUp 0.8s ease 0.15s both"
          }}>
            {/* Nom */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11,
                letterSpacing: "2px", textTransform: "uppercase", color: "var(--dark)",
                marginBottom: 10, fontWeight: 500
              }}>Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => { setForm(p => ({ ...p, nom: e.target.value })); setErrors(p => ({ ...p, nom: "" })); }}
                placeholder="Votre nom complet"
                style={{
                  width: "100%", padding: "14px 18px",
                  border: errors.nom ? "1.5px solid #e57373" : "1px solid rgba(200,149,108,0.3)",
                  fontFamily: "'Jost',sans-serif", fontSize: 14, outline: "none",
                  background: "transparent", color: "var(--dark)", transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = errors.nom ? "#e57373" : "rgba(200,149,108,0.3)"}
              />
              {errors.nom && (
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#e57373", marginTop: 6 }}>
                  {errors.nom}
                </p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11,
                letterSpacing: "2px", textTransform: "uppercase", color: "var(--dark)",
                marginBottom: 10, fontWeight: 500
              }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: "" })); }}
                placeholder="votre@email.com"
                style={{
                  width: "100%", padding: "14px 18px",
                  border: errors.email ? "1.5px solid #e57373" : "1px solid rgba(200,149,108,0.3)",
                  fontFamily: "'Jost',sans-serif", fontSize: 14, outline: "none",
                  background: "transparent", color: "var(--dark)", transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = errors.email ? "#e57373" : "rgba(200,149,108,0.3)"}
              />
              {errors.email && (
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#e57373", marginTop: 6 }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Message */}
            <div style={{ marginBottom: 36 }}>
              <label style={{
                display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11,
                letterSpacing: "2px", textTransform: "uppercase", color: "var(--dark)",
                marginBottom: 10, fontWeight: 500
              }}>Message</label>
              <textarea
                value={form.message}
                onChange={e => { setForm(p => ({ ...p, message: e.target.value })); setErrors(p => ({ ...p, message: "" })); }}
                placeholder="Votre message..."
                rows={6}
                style={{
                  width: "100%", padding: "14px 18px", resize: "vertical",
                  border: errors.message ? "1.5px solid #e57373" : "1px solid rgba(200,149,108,0.3)",
                  fontFamily: "'Jost',sans-serif", fontSize: 14, outline: "none",
                  background: "transparent", color: "var(--dark)", transition: "border-color 0.2s",
                  lineHeight: 1.7
                }}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = errors.message ? "#e57373" : "rgba(200,149,108,0.3)"}
              />
              {errors.message && (
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#e57373", marginTop: 6 }}>
                  {errors.message}
                </p>
              )}
            </div>

            <button type="submit" className="btn-gold"
              style={{ width: "100%", padding: "18px 40px", fontSize: 12 }}>
              Envoyer le Message
            </button>
          </form>
        )}

        {/* Contact info */}
        <div className="contact-links" style={{
          display: "flex", justifyContent: "center", gap: 48, marginTop: 48, flexWrap: "wrap"
        }}>
          {[
            { label: "WhatsApp", value: "+216 29 930 212", href: "https://wa.me/21629930212" },
            { label: "Instagram", value: "@basma_onlyshop", href: "https://www.instagram.com/basma_onlyshop/" },
            { label: "Facebook",  value: "Basma Only Shop", href: "https://www.facebook.com/basmaonlyshop" },
          ].map(({ label, value, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
              textAlign: "center", textDecoration: "none", color: "var(--dark)"
            }}
            onMouseEnter={e => e.currentTarget.querySelector("span")?.style && (e.currentTarget.querySelector(".ci-val").style.color = "var(--gold)")}
            onMouseLeave={e => e.currentTarget.querySelector(".ci-val") && (e.currentTarget.querySelector(".ci-val").style.color = "var(--text-muted)")}>
              <p style={{
                fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2px",
                textTransform: "uppercase", color: "var(--gold)", marginBottom: 6
              }}>{label}</p>
              <p className="ci-val" style={{
                fontFamily: "'Jost',sans-serif", fontSize: 13, color: "var(--text-muted)",
                transition: "color 0.2s"
              }}>{value}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position:"fixed", bottom:74, right:24, zIndex:900,
          width:42, height:42, borderRadius:"50%",
          background:"rgba(250,247,242,0.92)", border:"1px solid rgba(200,149,108,0.3)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
          WebkitBackdropFilter:"blur(8px)", backdropFilter:"blur(8px)", transition:"all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
          color:"var(--gold)",
          opacity: showTop ? 1 : 0,
          transform: showTop ? "translateY(0) scale(1)" : "translateY(14px) scale(0.8)",
          pointerEvents: showTop ? "auto" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>
    </div>
  );
}

import { useState } from "react";

export const GOUVERNORATS = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine",
  "Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine",
  "Tozeur","Tunis","Zaghouan",
];

export default function OrderModal({ product, onClose }) {
  const [form, setForm] = useState({
    nom: "", telephone: "", adresse: "", gouvernorat: "",
    qty: 1, size: product.size || (product.sizes && product.sizes[0]) || "TU",
  });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.nom.trim())       e.nom        = "Requis";
    if (!form.telephone.trim()) e.telephone  = "Requis";
    if (!form.adresse.trim())   e.adresse    = "Requis";
    if (!form.gouvernorat)      e.gouvernorat = "Requis";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const msg =
      `Bonjour Basma! Nouvelle commande 🛍️\n\n` +
      `👗 *${product.name}*\n` +
      `Taille: ${form.size}  |  Qté: ${form.qty}  |  Total: ${product.price * form.qty} ت.د\n\n` +
      `👤 *${form.nom}*\n📞 ${form.telephone}\n📍 ${form.adresse} — ${form.gouvernorat}`;
    window.open(`https://wa.me/21629930212?text=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
  };

  const inp = (key, placeholder, type = "text") => (
    <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"11px 14px", border:`1px solid ${errors[key]?"#e57373":"#ddd"}`,
        fontFamily:"'Jost',sans-serif", fontSize:13, outline:"none", background:"white", color:"var(--dark)", borderRadius:2 }}
      onFocus={e => e.target.style.borderColor = "var(--gold)"}
      onBlur={e => e.target.style.borderColor = errors[key] ? "#e57373" : "#ddd"}
    />
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2500, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)" }} />
      <div className="order-modal-inner" style={{
        position:"relative", background:"white", width:"min(820px,96vw)", maxHeight:"95vh",
        display:"flex", overflow:"hidden", animation:"fadeUp 0.3s ease", borderRadius:2,
        boxShadow:"0 24px 80px rgba(0,0,0,0.25)"
      }}>
        {/* Photo */}
        <div className="order-modal-photo" style={{ flex:"0 0 42%", position:"relative", background:"#f0ebe4" }}>
          <img src={product.img} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.65))", padding:"40px 20px 20px" }}>
            <p style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(200,149,108,0.9)", marginBottom:4 }}>{product.category}</p>
            <p style={{ color:"white", fontSize:16, fontWeight:500, lineHeight:1.3 }}>{product.name}</p>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6 }}>
              <span style={{ fontFamily:"'Jost',sans-serif", color:"var(--gold)", fontSize:22, fontWeight:700 }}>{product.price} ت.د</span>
              {product.oldPrice && <span style={{ fontFamily:"'Jost',sans-serif", color:"rgba(255,255,255,0.5)", fontSize:14, textDecoration:"line-through" }}>{product.oldPrice} ت.د</span>}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="order-modal-form" style={{ flex:1, overflowY:"auto", padding:"32px 28px" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", cursor:"pointer", color:"#999", padding:4, zIndex:3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {sent ? (
            <div style={{ textAlign:"center", paddingTop:60 }}>
              <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
              <h2 style={{ fontSize:22, fontWeight:400, marginBottom:10 }}>Commande envoyée !</h2>
              <p style={{ fontFamily:"'Jost',sans-serif", color:"var(--text-muted)", fontSize:13, lineHeight:1.7, marginBottom:28 }}>
                Votre commande a été transmise via WhatsApp.<br />Nous vous contacterons très prochainement.
              </p>
              <button className="btn-gold" onClick={onClose} style={{ padding:"12px 36px", fontSize:12 }}>Fermer</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <p style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"var(--gold)", marginBottom:4 }}>Passer la commande</p>
              <h2 style={{ fontSize:20, fontWeight:500, color:"var(--dark)", marginBottom:16 }}>{product.name}</h2>

              {/* Taille */}
              {product.sizes && product.sizes.length > 1 && (
                <div style={{ marginBottom:16 }}>
                  <p style={{ fontFamily:"'Jost',sans-serif", fontSize:11, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>Taille</p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {product.sizes.map(s => (
                      <button key={s} type="button" onClick={() => set("size", s)} style={{
                        padding:"7px 16px", border:form.size===s?"2px solid var(--gold)":"1px solid #ddd",
                        background:form.size===s?"var(--gold)":"white", color:form.size===s?"white":"var(--dark)",
                        fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer", borderRadius:2,
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Livraison */}
              <div style={{ background:"#f0faf4", border:"1px solid #c3e6cb", padding:"10px 14px", marginBottom:18, borderRadius:2, display:"flex", alignItems:"center", gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"#2e7d32", fontWeight:500 }}>Livraison gratuite partout en Tunisie</span>
              </div>

              {/* Nom + Tel */}
              <div className="order-form-row" style={{ display:"flex", gap:12, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:"block", fontFamily:"'Jost',sans-serif", fontSize:11, color:"#666", marginBottom:5 }}>Nom et prénom *</label>
                  {inp("nom","Votre nom")}
                  {errors.nom && <p style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:"#e57373", marginTop:3 }}>{errors.nom}</p>}
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ display:"block", fontFamily:"'Jost',sans-serif", fontSize:11, color:"#666", marginBottom:5 }}>Téléphone *</label>
                  {inp("telephone","+216 XX XXX XXX","tel")}
                  {errors.telephone && <p style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:"#e57373", marginTop:3 }}>{errors.telephone}</p>}
                </div>
              </div>

              {/* Adresse + Gouvernorat */}
              <div className="order-form-row" style={{ display:"flex", gap:12, marginBottom:20 }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:"block", fontFamily:"'Jost',sans-serif", fontSize:11, color:"#666", marginBottom:5 }}>Adresse *</label>
                  {inp("adresse","Rue, numéro...")}
                  {errors.adresse && <p style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:"#e57373", marginTop:3 }}>{errors.adresse}</p>}
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ display:"block", fontFamily:"'Jost',sans-serif", fontSize:11, color:"#666", marginBottom:5 }}>Gouvernorat *</label>
                  <select value={form.gouvernorat} onChange={e => set("gouvernorat", e.target.value)} style={{
                    width:"100%", padding:"11px 14px", border:`1px solid ${errors.gouvernorat?"#e57373":"#ddd"}`,
                    fontFamily:"'Jost',sans-serif", fontSize:13, outline:"none", background:"white",
                    color:form.gouvernorat?"var(--dark)":"#aaa", cursor:"pointer", borderRadius:2,
                  }}>
                    <option value="">Choisir un gouvernorat</option>
                    {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gouvernorat && <p style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:"#e57373", marginTop:3 }}>{errors.gouvernorat}</p>}
                </div>
              </div>

              {/* Qty + Total */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", border:"1px solid #ddd", borderRadius:2, overflow:"hidden" }}>
                  <button type="button" onClick={() => set("qty", Math.max(1,form.qty-1))}
                    style={{ width:38,height:38,border:"none",background:"#f9f9f9",fontSize:18,cursor:"pointer",color:"var(--dark)",borderRight:"1px solid #ddd" }}>−</button>
                  <span style={{ width:44,textAlign:"center",fontFamily:"'Jost',sans-serif",fontSize:15,fontWeight:600 }}>{form.qty}</span>
                  <button type="button" onClick={() => set("qty",form.qty+1)}
                    style={{ width:38,height:38,border:"none",background:"#f9f9f9",fontSize:18,cursor:"pointer",color:"var(--dark)",borderLeft:"1px solid #ddd" }}>+</button>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:2 }}>Total</span>
                  <span style={{ fontFamily:"'Jost',sans-serif", fontSize:22, fontWeight:700, color:"var(--gold)" }}>{product.price * form.qty} ت.د</span>
                </div>
              </div>

              <button type="submit" className="btn-gold" style={{ width:"100%", padding:"14px", fontSize:12 }}>
                Commander →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

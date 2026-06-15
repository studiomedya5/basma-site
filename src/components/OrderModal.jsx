import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { fbTrack } from "../lib/pixel";
import { DELEGATIONS } from "../lib/tunisia";
import { normVariants } from "../lib/variants";
import { useLang } from "../context/LangContext";

const GOUVERNORATS = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine",
  "Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine",
  "Tozeur","Tunis","Zaghouan",
];

const DELIVERY_FEE  = 8;
const FREE_THRESHOLD = 100;
const GOLD  = "#C9A84C";
const DARK  = "#2C2A20";
const CREAM = "#FAF9F6";

/* ─── Tokens typographiques ──────────────────── */
const T = {
  eyebrow: { fontFamily:"'Jost',sans-serif", fontSize:9, letterSpacing:"3px", textTransform:"uppercase" },
  label:   { fontFamily:"'Jost',sans-serif", fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(201,168,76,0.72)", display:"block", marginBottom:7 },
  body:    { fontFamily:"'Jost',sans-serif", fontSize:13 },
  serif:   { fontFamily:"'Cormorant Garamond',serif" },
};

export default function OrderModal({ product, onClose }) {
  const { t, isAr } = useLang();
  const displayName = isAr && product.nameAr ? product.nameAr : product.name;
  const hasColors = product.photos && product.photos.length > 1;

  const [colorIdx, setColorIdx]   = useState(product.initialColorIdx ?? (hasColors ? null : 0));
  const [form, setForm]           = useState({ nom:"", telephone:"", email:"", adresse:"", gouvernorat:"", delegation:"", qty:1, size:product.initialSize ?? product.sizes?.[0] ?? product.size ?? "TU" });
  const [errors, setErrors]       = useState({});
  const [status, setStatus]       = useState("idle");
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [hoveredBtn, setHoveredBtn] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Pixel : début de commande (étape clé du tunnel Vente)
  useEffect(() => {
    fbTrack("InitiateCheckout", {
      content_name: product.name,
      content_category: product.category,
      content_type: "product",
      value: product.price,
    });
  }, [product.name, product.category, product.price]);

  // Variante par couleur (stock + tailles dispo)
  const variants = normVariants(product.variants, product.sizes ?? []);
  const colorStock = (i) => variants ? (variants[i]?.stock ?? 0) : (product.stock ?? 1);
  const colorSizes = (i) => variants ? (variants[i]?.sizes ?? (product.sizes ?? [])) : (product.sizes ?? []);
  const selColorOut = colorIdx !== null && colorStock(colorIdx) <= 0;

  // Si la taille choisie n'est plus dispo pour la couleur sélectionnée, on bascule sur la 1re dispo
  useEffect(() => {
    if (colorIdx === null) return;
    const avail = colorSizes(colorIdx);
    if (avail.length && !avail.includes(form.size)) setForm(p => ({ ...p, size: avail[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorIdx]);

  const resolvePhoto = (p) => p?.startsWith("http") ? p : `/photos/${product.catId}/${p}`;
  const activeImg    = product.photos ? resolvePhoto(product.photos[colorIdx ?? 0]) : product.img;
  const subtotal     = product.price * form.qty;
  const deliveryFee  = subtotal < FREE_THRESHOLD ? DELIVERY_FEE : 0;
  const totalPrice   = subtotal + deliveryFee;

  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrors(p => ({...p,[k]:""})); };
  // Changer de gouvernorat réinitialise la délégation (liste dépendante)
  const setGouvernorat = (v) => { setForm(p => ({...p, gouvernorat:v, delegation:""})); setErrors(p => ({...p, gouvernorat:"", delegation:""})); };
  const delegationOptions = DELEGATIONS[form.gouvernorat] ?? [];

  const validate = () => {
    const e = {};
    if (hasColors && colorIdx === null)  e.color      = t("required");
    else if (selColorOut)                e.color      = t("color_out");
    if (!form.nom.trim())                e.nom        = t("required");
    if (!form.telephone.trim())          e.telephone  = t("required");
    if (!form.adresse.trim())            e.adresse    = t("required");
    if (!form.gouvernorat)               e.gouvernorat = t("required");
    if (!form.delegation)                e.delegation = t("required");
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus("loading");

    const orderData = {
      product_id: product.id ?? null, product_name: product.name,
      size: form.size, quantity: form.qty, total_price: totalPrice,
      customer_name: form.nom, customer_phone: form.telephone,
      address: form.adresse, governorate: form.gouvernorat,
      delegation: form.delegation, status: "en_attente",
    };
    if (form.email.trim()) orderData.customer_email = form.email.trim();
    // Couleur choisie (pour décrémenter le bon stock par couleur)
    if (hasColors || variants) {
      orderData.color_index = colorIdx ?? 0;
      orderData.color_label = `Couleur ${(colorIdx ?? 0) + 1}`;
    }

    // Insert + repli : si une colonne optionnelle (delegation, color_index...)
    // n'existe pas encore dans le schema, on la retire et on réessaie.
    let { error } = await supabase.from("orders").insert(orderData);
    let tries = 0;
    while (error && tries < 4) {
      const msg = error.message || "";
      let stripped = false;
      for (const col of ["delegation", "customer_email", "color_index", "color_label"]) {
        if (msg.includes(col) && col in orderData) { delete orderData[col]; stripped = true; }
      }
      if (!stripped) break;
      ({ error } = await supabase.from("orders").insert(orderData));
      tries++;
    }
    if (error) { console.error(error); setStatus("error"); return; }
    setStatus("success");
    fbTrack("Purchase", {
      value: totalPrice,
      content_name: product.name,
      content_category: product.category,
      content_type: "product",
    });

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        customer_name: form.nom, customer_phone: form.telephone, customer_email: form.email||null,
        product_name: product.name, product_image: `https://basmaonlyshop.tn${activeImg}`,
        product_price: product.price, size: form.size, quantity: form.qty, total_price: totalPrice,
        address: form.adresse, governorate: form.gouvernorat, delegation: form.delegation,
        color_label: hasColors ? `Couleur ${(colorIdx??0)+1}` : "—",
      }),
    }).catch(()=>{});
  };

  /* ─── Input desktop ─────────────────────────── */
  const DeskInput = ({ k, placeholder, type="text" }) => (
    <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"11px 14px", boxSizing:"border-box",
        border:`1px solid ${errors[k]?"#e57373":"rgba(44,42,32,0.13)"}`,
        borderLeft: `3px solid ${errors[k]?"#e57373":"transparent"}`,
        fontFamily:"'Jost',sans-serif", fontSize:13, outline:"none",
        background:"white", color:DARK, borderRadius:0, transition:"border-color 0.18s, border-left-color 0.18s" }}
      onFocus={e=>{ e.target.style.borderColor="rgba(201,168,76,0.4)"; e.target.style.borderLeftColor=GOLD; }}
      onBlur={e=>{ e.target.style.borderColor=errors[k]?"#e57373":"rgba(44,42,32,0.13)"; e.target.style.borderLeftColor=errors[k]?"#e57373":"transparent"; }}
    />
  );

  /* ─── Input mobile underline ─────────────────── */
  const MobInput = ({ k, placeholder, type="text" }) => (
    <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"7px 0", background:"transparent", border:"none",
        borderBottom:`1.5px solid ${errors[k]?"#e57373":"rgba(44,42,32,0.14)"}`,
        fontFamily:"'Jost',sans-serif", fontSize:14, color:DARK, outline:"none",
        boxSizing:"border-box", transition:"border-bottom-color 0.18s" }}
      onFocus={e=>e.target.style.borderBottomColor=GOLD}
      onBlur={e=>e.target.style.borderBottomColor=errors[k]?"#e57373":"rgba(44,42,32,0.14)"}
    />
  );

  /* ─── Bloc couleurs ─────────────────────────── */
  const ColorPicker = () => hasColors ? (
    <div style={{marginBottom:18}}>
      <span style={{...T.label,color:errors.color?"#e57373":"rgba(201,168,76,0.72)"}}>
        {t("color")} {errors.color&&<span style={{letterSpacing:0,textTransform:"none",fontSize:10}}>— {t("required")}</span>}
      </span>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {product.photos.map((ph,i)=>{
          const cOut = colorStock(i) <= 0;
          return (
          <button key={i} type="button"
            onClick={()=>{setColorIdx(i);setErrors(p=>({...p,color:""}));}}
            title={cOut?t("color_out"):undefined}
            style={{ width:36,height:36,padding:0,borderRadius:"50%",cursor:"pointer",overflow:"hidden",background:"none",
              border:i===colorIdx?`2.5px solid ${GOLD}`:"2.5px solid transparent",
              outline:i===colorIdx?`2px solid ${GOLD}`:"1.5px solid rgba(200,149,108,0.3)",
              outlineOffset:2, transition:"transform 0.15s",
              transform:i===colorIdx?"scale(1.1)":"scale(1)", opacity:cOut?0.4:1 }}>
            <img src={resolvePhoto(ph)} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%",display:"block",filter:cOut?"grayscale(1)":"none"}} />
          </button>
          );
        })}
      </div>
      {selColorOut && <p style={{...T.body,fontSize:10,color:"#e57373",marginTop:6}}>{t("color_out_hint")}</p>}
    </div>
  ) : null;

  /* ─── Bloc tailles ──────────────────────────── */
  const SizePicker = () => product.sizes?.length > 1 ? (
    <div style={{marginBottom:18}}>
      <span style={T.label}>{t("size")}</span>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {product.sizes.map(s=>{
          const avail = colorSizes(colorIdx ?? 0).includes(s);
          return (
          <button key={s} type="button" disabled={!avail}
            onClick={()=> avail && set("size",s)}
            title={avail?undefined:t("size_unavailable")}
            style={{ padding:"6px 14px", fontSize:12, fontFamily:"'Jost',sans-serif", fontWeight:500,
              cursor:avail?"pointer":"not-allowed", borderRadius:0, transition:"all 0.15s",
              border:(form.size===s&&avail)?`1.5px solid ${GOLD}`:"1.5px solid rgba(44,42,32,0.18)",
              background:(form.size===s&&avail)?GOLD:"transparent",
              color:!avail?"#ccc":(form.size===s?"white":DARK),
              textDecoration:avail?"none":"line-through", opacity:avail?1:0.6 }}>
            {s}
          </button>
          );
        })}
      </div>
    </div>
  ) : null;

  /* ─── Livraison badge ───────────────────────── */
  const DeliveryBadge = () => (
    <div style={{ display:"flex",alignItems:"center",gap:8,
      padding:"9px 13px", marginBottom:20, borderRadius:0,
      background:deliveryFee===0?"rgba(46,125,50,0.05)":"rgba(201,168,76,0.06)",
      borderLeft:`3px solid ${deliveryFee===0?"#4caf50":GOLD}` }}>
      <span style={{fontSize:14}}>🚚</span>
      {deliveryFee===0 ? (
        <span style={{...T.body,color:"#2e7d32",fontWeight:600,fontSize:12}}>{t("delivery_free")}</span>
      ) : (
        <span style={{...T.body,fontSize:12,color:DARK}}>
          {t("delivery")} <strong style={{color:GOLD}}>{DELIVERY_FEE} DT</strong>
          <span style={{color:"#bbb",marginLeft:6,fontSize:11}}>· {t("delivery_from")}</span>
        </span>
      )}
    </div>
  );

  /* ─── Écran succès ──────────────────────────── */
  const SuccessScreen = () => (
    <div style={{textAlign:"center",padding:"50px 20px 30px"}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(201,168,76,0.1)",
        display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 style={{...T.serif,fontSize:22,fontWeight:500,color:DARK,marginBottom:10}}>{t("order_confirmed")}</h2>
      <p style={{...T.body,color:"#888",fontSize:13,lineHeight:1.9,marginBottom:28}}>
        {t("will_contact")}<br/>
        <strong style={{color:DARK,fontWeight:600}}>{form.telephone}</strong>
      </p>
      <button onClick={onClose} style={{...T.body,padding:"14px 40px",background:DARK,color:GOLD,border:"none",
        letterSpacing:"2.5px",fontSize:11,textTransform:"uppercase",cursor:"pointer"}}>
        {t("close")}
      </button>
    </div>
  );

  /* ─── Écran erreur ──────────────────────────── */
  const ErrorScreen = () => (
    <div style={{textAlign:"center",padding:"50px 20px 30px"}}>
      <div style={{fontSize:36,marginBottom:16}}>⚠️</div>
      <h2 style={{...T.serif,fontSize:20,fontWeight:400,color:DARK,marginBottom:8}}>{t("error_title")}</h2>
      <p style={{...T.body,color:"#888",fontSize:13,marginBottom:24}}>{t("please_retry")}</p>
      <button onClick={()=>setStatus("idle")} style={{...T.body,padding:"14px 40px",background:DARK,color:GOLD,
        border:"none",letterSpacing:"2.5px",fontSize:11,textTransform:"uppercase",cursor:"pointer"}}>
        {t("retry")}
      </button>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     RENDU MOBILE — bottom sheet haute couture
  ════════════════════════════════════════════════════════════ */
  if (isMobile) return (
    <div style={{position:"fixed",inset:0,zIndex:2500,display:"flex",alignItems:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(20,14,8,0.65)",
        backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}}/>

      <div style={{position:"relative",width:"100vw",maxHeight:"96dvh",
        background:CREAM,borderRadius:"20px 20px 0 0",
        display:"flex",flexDirection:"column",overflow:"hidden",
        boxShadow:"0 -20px 60px rgba(0,0,0,0.35)",
        animation:"fadeUp 0.34s cubic-bezier(0.22,1,0.36,1)"}}>

        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:2,flexShrink:0}}>
          <div style={{width:38,height:4,borderRadius:2,background:"rgba(44,42,32,0.14)"}}/>
        </div>

        {/* ── Hero cinématique ── */}
        <div style={{position:"relative",height:210,flexShrink:0,overflow:"hidden"}}>
          <img src={activeImg} alt={displayName}
            style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 28%",display:"block"}}/>
          {/* Gradient profond */}
          <div style={{position:"absolute",inset:0,
            background:"linear-gradient(160deg,rgba(0,0,0,0.1) 0%,rgba(20,14,8,0.85) 100%)"}}/>
          {/* Bouton retour */}
          <button onClick={onClose} style={{position:"absolute",top:12,left:12,zIndex:2,
            background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.18)",
            backdropFilter:"blur(8px)",borderRadius:"50%",width:34,height:34,
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",color:"white"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          {/* Infos produit sur photo */}
          <div style={{position:"absolute",bottom:14,left:16,right:16}}>
            <p style={{...T.eyebrow,color:"rgba(201,168,76,0.8)",marginBottom:5}}>
              {t(`cat_${product.catId}`)}
            </p>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12}}>
              <p style={{...T.serif,fontSize:19,fontWeight:500,color:"white",lineHeight:1.15,flex:1}}>
                {displayName}
              </p>
              <span style={{...T.serif,color:GOLD,fontSize:22,fontWeight:600,flexShrink:0,letterSpacing:"-0.5px"}}>
                {product.price}<span style={{fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:400,marginLeft:2}}>ت.د</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Formulaire scrollable ── */}
        <div style={{overflowY:"auto",padding:"22px 20px 36px",flex:1}}>

          {status==="success" && SuccessScreen()}
          {status==="error"   && ErrorScreen()}

          {(status==="idle"||status==="loading") && (
            <form onSubmit={handleSubmit} noValidate>

              {ColorPicker()}
              {SizePicker()}
              {DeliveryBadge()}

              {/* Nom */}
              <div style={{marginBottom:20}}>
                <label style={T.label}>{t("name")} *</label>
                {MobInput({ k:"nom", placeholder:t("name_ph") })}
                {errors.nom&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.nom}</p>}
              </div>

              {/* Téléphone */}
              <div style={{marginBottom:20}}>
                <label style={T.label}>{t("phone")} *</label>
                {MobInput({ k:"telephone", placeholder:"+216 XX XXX XXX", type:"tel" })}
                {errors.telephone&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.telephone}</p>}
              </div>

              {/* Adresse */}
              <div style={{marginBottom:20}}>
                <label style={T.label}>{t("address")} *</label>
                {MobInput({ k:"adresse", placeholder:t("address_ph") })}
                {errors.adresse&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.adresse}</p>}
              </div>

              {/* Gouvernorat */}
              <div style={{marginBottom:20}}>
                <label style={T.label}>{t("governorate")} *</label>
                <select value={form.gouvernorat} onChange={e=>setGouvernorat(e.target.value)}
                  style={{width:"100%",padding:"7px 0",background:"transparent",border:"none",
                    borderBottom:`1.5px solid ${errors.gouvernorat?"#e57373":"rgba(44,42,32,0.14)"}`,
                    fontFamily:"'Jost',sans-serif",fontSize:14,
                    color:form.gouvernorat?DARK:"#bbb",outline:"none",cursor:"pointer",appearance:"none"}}
                  onFocus={e=>e.target.style.borderBottomColor=GOLD}
                  onBlur={e=>e.target.style.borderBottomColor=errors.gouvernorat?"#e57373":"rgba(44,42,32,0.14)"}>
                  <option value="">{t("choose")}</option>
                  {GOUVERNORATS.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                {errors.gouvernorat&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.gouvernorat}</p>}
              </div>

              {/* Délégation (dépend du gouvernorat) */}
              <div style={{marginBottom:20}}>
                <label style={T.label}>{t("delegation")} *</label>
                <select value={form.delegation} onChange={e=>set("delegation",e.target.value)}
                  disabled={!form.gouvernorat}
                  style={{width:"100%",padding:"7px 0",background:"transparent",border:"none",
                    borderBottom:`1.5px solid ${errors.delegation?"#e57373":"rgba(44,42,32,0.14)"}`,
                    fontFamily:"'Jost',sans-serif",fontSize:14,
                    color:form.delegation?DARK:"#bbb",outline:"none",cursor:form.gouvernorat?"pointer":"not-allowed",
                    appearance:"none",opacity:form.gouvernorat?1:0.5}}
                  onFocus={e=>e.target.style.borderBottomColor=GOLD}
                  onBlur={e=>e.target.style.borderBottomColor=errors.delegation?"#e57373":"rgba(44,42,32,0.14)"}>
                  <option value="">{form.gouvernorat?t("choose"):t("choose_gov_first")}</option>
                  {delegationOptions.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                {errors.delegation&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.delegation}</p>}
              </div>

              {/* Email optionnel */}
              <div style={{marginBottom:24,opacity:0.7}}>
                <label style={{...T.label}}>{t("email")} <span style={{letterSpacing:0,textTransform:"none",fontSize:9}}>({t("optional")})</span></label>
                {MobInput({ k:"email", placeholder:"votre@email.com", type:"email" })}
              </div>

              {/* Quantité + Total */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"14px 16px",marginBottom:22,
                background:"white",border:`1px solid rgba(201,168,76,0.2)`,
                borderLeft:`3px solid ${GOLD}`}}>
                <div>
                  <p style={{...T.label,marginBottom:10}}>{t("quantity")}</p>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <button type="button" onClick={()=>set("qty",Math.max(1,form.qty-1))}
                      style={{width:28,height:28,border:`1px solid rgba(44,42,32,0.2)`,background:"transparent",
                        fontSize:16,cursor:"pointer",color:DARK,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:0}}>
                      −
                    </button>
                    <span style={{...T.serif,fontSize:22,fontWeight:600,minWidth:20,textAlign:"center",color:DARK}}>
                      {form.qty}
                    </span>
                    <button type="button" onClick={()=>set("qty",form.qty+1)}
                      style={{width:28,height:28,border:`1px solid rgba(44,42,32,0.2)`,background:"transparent",
                        fontSize:16,cursor:"pointer",color:DARK,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:0}}>
                      +
                    </button>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{...T.label,marginBottom:6}}>{t("total")}</p>
                  {deliveryFee>0&&<p style={{...T.body,fontSize:10,color:"#aaa",marginBottom:3}}>{subtotal} + {DELIVERY_FEE} {t("livraison_word")}</p>}
                  <span style={{...T.serif,fontSize:26,fontWeight:600,color:GOLD,letterSpacing:"-0.5px"}}>
                    {totalPrice}<span style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:400,marginLeft:3}}>ت.د</span>
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button type="submit" disabled={status==="loading"}
                style={{width:"100%",padding:"16px",background:status==="loading"?"#4a3e20":DARK,
                  color:GOLD,border:"none",fontFamily:"'Jost',sans-serif",fontSize:11,
                  letterSpacing:"3px",textTransform:"uppercase",cursor:status==="loading"?"wait":"pointer",
                  transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {status==="loading" ? t("sending") : t("order")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     RENDU DESKTOP — document de commande luxueux
  ════════════════════════════════════════════════════════════ */
  return (
    <div style={{position:"fixed",inset:0,zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(20,14,8,0.58)",
        backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)"}}/>

      <div className="order-modal-inner" style={{
        position:"relative",width:"min(860px,96vw)",maxHeight:"94vh",
        display:"flex",overflow:"hidden",background:"white",
        boxShadow:"0 30px 90px rgba(0,0,0,0.28)",borderRadius:0,
        animation:"fadeUp 0.28s ease",
      }}>

        {/* ── Panneau photo ── */}
        <div className="order-modal-photo" style={{flex:"0 0 44%",position:"relative",background:"#1a1410",overflow:"hidden"}}>
          <img src={activeImg} alt={displayName}
            style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top",
              display:"block",transition:"transform 0.6s ease",}}
            onMouseEnter={e=>e.target.style.transform="scale(1.04)"}
            onMouseLeave={e=>e.target.style.transform="scale(1)"}
          />
          {/* Gradient */}
          <div style={{position:"absolute",inset:0,
            background:"linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(16,11,6,0.88) 100%)"}}/>
          {/* Ligne gold décorative */}
          <div style={{position:"absolute",top:0,right:0,width:1,height:"100%",
            background:`linear-gradient(to bottom,transparent,${GOLD},transparent)`,opacity:0.4}}/>
          {/* Infos */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 28px 28px"}}>
            <div style={{width:32,height:1,background:GOLD,marginBottom:14,opacity:0.7}}/>
            <p style={{...T.eyebrow,color:"rgba(201,168,76,0.75)",marginBottom:8}}>{t(`cat_${product.catId}`)}</p>
            <p style={{...T.serif,fontSize:26,fontWeight:400,color:"white",lineHeight:1.1,marginBottom:10}}>
              {displayName}
            </p>
            <span style={{...T.serif,color:GOLD,fontSize:24,fontWeight:600,letterSpacing:"-0.5px"}}>
              {product.price}
              <span style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:300,marginLeft:4}}>ت.د</span>
            </span>
          </div>
        </div>

        {/* ── Bouton fermer ── */}
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,
          background:"none",border:"none",cursor:"pointer",
          color:"rgba(44,42,32,0.35)",padding:6,zIndex:10,
          transition:"color 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.color=DARK}
          onMouseLeave={e=>e.currentTarget.style.color="rgba(44,42,32,0.35)"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* ── Formulaire ── */}
        <div className="order-modal-form" style={{flex:1,overflowY:"auto",padding:"40px 36px"}}>

          {status==="success" && SuccessScreen()}
          {status==="error"   && ErrorScreen()}

          {(status==="idle"||status==="loading") && (
            <form onSubmit={handleSubmit} noValidate>

              {/* En-tête document */}
              <p style={{...T.eyebrow,color:GOLD,marginBottom:6}}>{t("your_order")}</p>
              <h2 style={{...T.serif,fontSize:22,fontWeight:400,color:DARK,marginBottom:12,lineHeight:1.2}}>
                {displayName}
              </h2>
              <div style={{height:1,background:`linear-gradient(to right,${GOLD},transparent)`,marginBottom:22,opacity:0.35}}/>

              {ColorPicker()}
              {SizePicker()}
              {DeliveryBadge()}

              {/* Nom + Téléphone */}
              <div className="order-form-row" style={{display:"flex",gap:14,marginBottom:14}}>
                <div style={{flex:1}}>
                  <label style={T.label}>{t("name")} *</label>
                  {DeskInput({ k:"nom", placeholder:t("name_ph") })}
                  {errors.nom&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.nom}</p>}
                </div>
                <div style={{flex:1}}>
                  <label style={T.label}>{t("phone")} *</label>
                  {DeskInput({ k:"telephone", placeholder:"+216 XX XXX XXX", type:"tel" })}
                  {errors.telephone&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.telephone}</p>}
                </div>
              </div>

              {/* Email */}
              <div style={{marginBottom:14}}>
                <label style={{...T.label,opacity:0.7}}>{t("email")} <span style={{letterSpacing:0,textTransform:"none",fontSize:9}}>({t("optional")})</span></label>
                {DeskInput({ k:"email", placeholder:"votre@email.com", type:"email" })}
              </div>

              {/* Adresse (pleine largeur) */}
              <div style={{marginBottom:14}}>
                <label style={T.label}>{t("address")} *</label>
                {DeskInput({ k:"adresse", placeholder:t("address_ph") })}
                {errors.adresse&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.adresse}</p>}
              </div>

              {/* Gouvernorat + Délégation */}
              <div className="order-form-row" style={{display:"flex",gap:14,marginBottom:22}}>
                <div style={{flex:1}}>
                  <label style={T.label}>{t("governorate")} *</label>
                  <select value={form.gouvernorat} onChange={e=>setGouvernorat(e.target.value)}
                    style={{width:"100%",padding:"11px 14px",boxSizing:"border-box",
                      border:`1px solid ${errors.gouvernorat?"#e57373":"rgba(44,42,32,0.13)"}`,
                      borderLeft:`3px solid ${errors.gouvernorat?"#e57373":"transparent"}`,
                      fontFamily:"'Jost',sans-serif",fontSize:13,outline:"none",
                      background:"white",color:form.gouvernorat?DARK:"#bbb",cursor:"pointer",borderRadius:0,
                      transition:"border-color 0.18s,border-left-color 0.18s"}}
                    onFocus={e=>{e.target.style.borderColor="rgba(201,168,76,0.4)";e.target.style.borderLeftColor=GOLD;}}
                    onBlur={e=>{e.target.style.borderColor=errors.gouvernorat?"#e57373":"rgba(44,42,32,0.13)";e.target.style.borderLeftColor=errors.gouvernorat?"#e57373":"transparent";}}>
                    <option value="">{t("choose_gov")}</option>
                    {GOUVERNORATS.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gouvernorat&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.gouvernorat}</p>}
                </div>
                <div style={{flex:1}}>
                  <label style={T.label}>{t("delegation")} *</label>
                  <select value={form.delegation} onChange={e=>set("delegation",e.target.value)}
                    disabled={!form.gouvernorat}
                    style={{width:"100%",padding:"11px 14px",boxSizing:"border-box",
                      border:`1px solid ${errors.delegation?"#e57373":"rgba(44,42,32,0.13)"}`,
                      borderLeft:`3px solid ${errors.delegation?"#e57373":"transparent"}`,
                      fontFamily:"'Jost',sans-serif",fontSize:13,outline:"none",
                      background:"white",color:form.delegation?DARK:"#bbb",
                      cursor:form.gouvernorat?"pointer":"not-allowed",borderRadius:0,opacity:form.gouvernorat?1:0.55,
                      transition:"border-color 0.18s,border-left-color 0.18s"}}
                    onFocus={e=>{e.target.style.borderColor="rgba(201,168,76,0.4)";e.target.style.borderLeftColor=GOLD;}}
                    onBlur={e=>{e.target.style.borderColor=errors.delegation?"#e57373":"rgba(44,42,32,0.13)";e.target.style.borderLeftColor=errors.delegation?"#e57373":"transparent";}}>
                    <option value="">{form.gouvernorat?t("choose_deleg"):t("choose_gov_first")}</option>
                    {delegationOptions.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.delegation&&<p style={{...T.body,fontSize:10,color:"#e57373",marginTop:4}}>{errors.delegation}</p>}
                </div>
              </div>

              {/* Séparateur */}
              <div style={{height:1,background:"rgba(44,42,32,0.07)",marginBottom:20}}/>

              {/* Quantité + Total */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
                <div>
                  <label style={{...T.label,marginBottom:8}}>{t("quantity")}</label>
                  <div style={{display:"flex",alignItems:"center",border:`1px solid rgba(44,42,32,0.15)`,overflow:"hidden"}}>
                    <button type="button" onClick={()=>set("qty",Math.max(1,form.qty-1))}
                      style={{width:38,height:38,border:"none",borderRight:`1px solid rgba(44,42,32,0.12)`,
                        background:"#faf9f6",fontSize:18,cursor:"pointer",color:DARK}}>−</button>
                    <span style={{...T.body,width:44,textAlign:"center",fontSize:15,fontWeight:600}}>{form.qty}</span>
                    <button type="button" onClick={()=>set("qty",form.qty+1)}
                      style={{width:38,height:38,border:"none",borderLeft:`1px solid rgba(44,42,32,0.12)`,
                        background:"#faf9f6",fontSize:18,cursor:"pointer",color:DARK}}>+</button>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <label style={{...T.label,marginBottom:6}}>{t("total_pay")}</label>
                  {deliveryFee>0&&<p style={{...T.body,fontSize:11,color:"#aaa",marginBottom:2}}>{subtotal} + {DELIVERY_FEE} DT {t("livraison_word")}</p>}
                  <span style={{...T.serif,fontSize:26,fontWeight:600,color:GOLD,letterSpacing:"-0.5px"}}>
                    {totalPrice}
                    <span style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:300,marginLeft:4}}>ت.د</span>
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button type="submit" disabled={status==="loading"}
                onMouseEnter={e=>{if(status!=="loading")e.currentTarget.style.background="#3d3628";}}
                onMouseLeave={e=>{if(status!=="loading")e.currentTarget.style.background=DARK;}}
                style={{width:"100%",padding:"15px",background:DARK,color:GOLD,border:"none",
                  fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:"3px",
                  textTransform:"uppercase",cursor:status==="loading"?"wait":"pointer",
                  transition:"background 0.2s",opacity:status==="loading"?0.75:1}}>
                {status==="loading" ? t("sending") : `${t("confirm_order")} →`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

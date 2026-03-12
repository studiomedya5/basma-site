import { useState, useEffect, useRef, useCallback } from "react";
import CollectionPage from "./CollectionPage";
import ContactPage from "./ContactPage";
import RamadanDecor from "./RamadanDecor";

// ─── Product Data ───────────────────────────────────────────
const products = [
  { id:1, name:"Abaya Satin Bleu Nuit", price:350, oldPrice:420, category:"Abayas", tag:"Popular", img:"/images/abaya-bleu-nuit.jpg", sizes:["S","M","L","XL"] },
  { id:2, name:"Abaya Lavande Élégante", price:380, category:"Abayas", tag:"New", img:"/images/abaya-lavande.jpg", sizes:["S","M","L","XL"] },
  { id:3, name:"Abaya Lavande Brodée", price:380, category:"Abayas", tag:"Popular", img:"/images/abaya-lavande-brodee.jpg", sizes:["M","L","XL"] },
  { id:4, name:"Abaya Magenta Royal", price:390, oldPrice:450, category:"Abayas", tag:"Hot", img:"/images/abaya-magenta.jpg", sizes:["S","M","L","XL"] },
  { id:5, name:"Abaya Rose Satiné", price:360, category:"Abayas", tag:"New", img:"/images/abaya-rose.jpg", sizes:["S","M","L"] },
  { id:6, name:"Abaya Noir & Or", price:400, category:"Abayas", tag:"Popular", img:"/images/abaya-noir-or.jpg", sizes:["S","M","L","XL"] },
  { id:7, name:"Abaya Bordeaux Satin", price:420, oldPrice:490, category:"Abayas", tag:"Hot", img:"/images/abaya-bordeaux.jpg", sizes:["S","M","L","XL"] },
  { id:8, name:"Abaya Noir Classique", price:370, category:"Abayas", tag:"Popular", img:"/images/abaya-noir-classique.jpg", sizes:["M","L","XL"] },
  { id:9, name:"Djellaba Blanche Traditionnelle", price:450, category:"Djellabas", tag:"New", img:"/images/djellaba-blanche.jpg", sizes:["S","M","L","XL"] },
  { id:10, name:"Djellaba Rose Brodée", price:430, oldPrice:500, category:"Djellabas", tag:"Hot", img:"/images/djellaba-rose.jpg", sizes:["S","M","L","XL"] },
  { id:11, name:"Abaya Noir Liseré Or", price:410, category:"Abayas", tag:"Popular", img:"/images/abaya-noir-lisere.jpg", sizes:["S","M","L","XL"] },
  { id:12, name:"Abaya Noir Rayures", price:380, category:"Abayas", tag:"New", img:"/images/abaya-noir-rayures.jpg", sizes:["M","L","XL"] },
  { id:13, name:"Abaya Noir Dorée", price:440, oldPrice:520, category:"Abayas", tag:"Hot", img:"/images/abaya-noir-doree.jpg", sizes:["S","M","L","XL"] },
  { id:14, name:"Abaya Rose Poudré", price:360, category:"Abayas", tag:"New", img:"/images/abaya-rose-poudre.jpg", sizes:["S","M","L"] },
];

const categories = ["Tout", "Popular", "Hot", "New"];

// ─── Exclusifs tabs → collection categories (vraies photos) ──
const exclusifsData = {
  Popular: [
    { id: "3ibaya", label: "Abaya", imgs: [
      "/photos/3ibaya/487447137_1098233225650757_818704683323925263_n.jpg",
      "/photos/3ibaya/488374854_1098231745650905_8820862824133621922_n.jpg",
      "/photos/3ibaya/641057449_17935739097179373_2825300746075166942_n.jpg",
      "/photos/3ibaya/648102785_1371074615033282_5385296663968872502_n.jpg",
    ]},
    { id: "jiba", label: "Jiba", imgs: [
      "/photos/jiba/498947811_17903534622179373_3600286315845092783_n.jpg",
      "/photos/jiba/499366748_17903534595179373_7559916904546442049_n.jpg",
      "/photos/jiba/499602625_17903534667179373_4535199890911258257_n.jpg",
      "/photos/jiba/499833958_17903534649179373_903899459310677770_n.jpg",
    ]},
    { id: "pyjama", label: "Pyjama", imgs: [
      "/photos/pyjama/490345086_1118998213574258_6134831431061358690_n.jpg",
      "/photos/pyjama/492617363_1119002820240464_4055654624926574235_n.jpg",
      "/photos/pyjama/579083507_1276299481177463_446330100554526195_n.jpg",
      "/photos/pyjama/589159541_17926554309179373_4773932076652099313_n.jpg",
    ]},
    { id: "Robe", label: "Robe", imgs: [
      "/photos/Robe/649636396_1374861407987936_6370692347574891488_n.jpg",
      "/photos/Robe/649665854_1374861444654599_6644258085429623943_n.jpg",
      "/photos/Robe/650287811_1375865401220870_230421896988538844_n.jpg",
      "/photos/Robe/650839941_1375865431220867_1210585044214971859_n.jpg",
    ]},
  ],
  Hot: [
    { id: "set", label: "Set", imgs: [
      "/photos/set/549864507_1232854562188622_2760973217095054367_n.jpg",
      "/photos/set/503595961_1144400911033988_4417601806757851793_n.jpg",
      "/photos/set/627056759_17932957533179373_8778773970641450727_n.jpg",
      "/photos/set/648685767_17937284784179373_1588006055100656717_n.jpg",
    ]},
    { id: "Sac", label: "Sac", imgs: [
      "/photos/Sac/631720297_1352112070262870_4847811711877564932_n.jpg",
      "/photos/Sac/631917370_1352111973596213_194994035129029681_n.jpg",
      "/photos/Sac/633207472_1352112016929542_6323390260047978267_n.jpg",
      "/photos/Sac/633375719_1352111933596217_4381281051821960200_n.jpg",
    ]},
    { id: "manteau", label: "Manteau", imgs: [
      "/photos/manteau/579423101_1277387817735296_2206184981912267833_n.jpg",
      "/photos/manteau/579550354_1277389351068476_4317445584969625127_n.jpg",
      "/photos/manteau/631604059_17933767830179373_7389489587997262940_n.jpg",
      "/photos/manteau/630629104_17933675214179373_4861346317016091070_n.jpg",
    ]},
  ],
  New: [
    { id: "kids", label: "Kids", imgs: [
      "/photos/kids/645995833_1370344885106255_9157182548210132803_n.jpg",
      "/photos/kids/646076253_1370344838439593_3346000056858945782_n.jpg",
      "/photos/kids/649876591_1375551517918925_6681548330046473505_n.jpg",
      "/photos/kids/650825674_1375601961247214_9084526571701164849_n.jpg",
    ]},
    { id: "MDB", label: "MDB", imgs: [
      "/photos/MDB/496049480_1128525475954865_2540523400201882755_n.jpg",
      "/photos/MDB/496263120_1128525229288223_2489261562133792631_n.jpg",
      "/photos/MDB/497885050_1131003555707057_3874941570880894198_n.jpg",
      "/photos/MDB/505353945_1156440629830016_8647673457501953606_n.jpg",
    ]},
    { id: "echarpe", label: "Écharpe", imgs: [
      "/photos/echarpe/587840430_17925997047179373_2959763835755661799_n.jpg",
      "/photos/echarpe/588084802_17925997029179373_8431155902852837248_n.jpg",
      "/photos/echarpe/589062375_17925996990179373_8845487259511413527_n.jpg",
      "/photos/echarpe/595502671_1298811695592908_1151798460515221855_n.jpg",
    ]},
  ],
};
exclusifsData.Tout = [
  ...exclusifsData.Popular,
  ...exclusifsData.Hot,
  ...exclusifsData.New,
];

// ─── Animated Exclusifs Card ──────────────────────────────────
function ExcluCard({ item, index, onNavigate }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) {
        setImgIdx(i => (i + 1) % item.imgs.length);
      }
    }, 2800);
    return () => clearInterval(t);
  }, [item.imgs.length]);

  return (
    <div
      className="product-card"
      style={{
        background: "white", cursor: "pointer",
        animation: `fadeUp 0.55s ease ${0.08 * index}s both`,
        boxShadow: hovered ? "0 18px 50px rgba(0,0,0,0.16)" : "0 3px 18px rgba(0,0,0,0.07)",
        transform: hovered ? "translateY(-7px)" : "translateY(0)",
        transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease",
        overflow: "hidden",
      }}
      onClick={() => onNavigate(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Photo stack ── */}
      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "3/4" }}>
        {item.imgs.map((src, i) => (
          <img key={i} src={src} alt={item.label}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%", objectFit: "cover",
              opacity: i === imgIdx ? 1 : 0,
              transition: "opacity 1.4s cubic-bezier(0.4,0,0.2,1)",
              zIndex: i === imgIdx ? 2 : 1,
            }}
          />
        ))}

        {/* Dots progress */}
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 5, zIndex: 8,
        }}>
          {item.imgs.map((_, i) => (
            <div key={i} style={{
              height: 3, borderRadius: 2,
              width: i === imgIdx ? 18 : 5,
              background: i === imgIdx ? "white" : "rgba(255,255,255,0.35)",
              transition: "width 0.5s ease, background 0.4s",
            }} />
          ))}
        </div>

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 6,
          background: "linear-gradient(to top, rgba(44,33,23,0.6) 0%, rgba(44,33,23,0.1) 60%, transparent 100%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s ease",
        }} />
        <div style={{
          position: "absolute", bottom: 36, left: 0, right: 0, zIndex: 7,
          display: "flex", justifyContent: "center",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}>
          <span style={{
            fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2.5px",
            textTransform: "uppercase", color: "white",
            background: "var(--gold)", padding: "8px 20px",
          }}>Voir la Collection</span>
        </div>
      </div>

      {/* ── Label band ── */}
      <div style={{
        padding: "13px 16px",
        borderTop: "1px solid rgba(200,149,108,0.12)",
      }}>
        <h3 style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 18, fontWeight: 500, color: "var(--dark)", margin: 0,
        }}>{item.label}</h3>
      </div>
    </div>
  );
}

// ─── Carrousel Photos (hero slider) ─────────────────────────
const galleryPhotos = [
  // ── Ordre prioritaire 1→14 ──
  "1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg",
  "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg",
  // ── Sac ──
  "sac1.jpg", "sac2.jpg", "sac3.jpg",
  // ── Reste ──
  "492617363_1119002820240464_4055654624926574235_n.jpg",
  "549864507_1232854562188622_2760973217095054367_n.jpg",
  "579083507_1276299481177463_446330100554526195_n.jpg",
  "579390802_1276298841177527_9096355951208059728_n.jpg",
  "579423101_1277387817735296_2206184981912267833_n.jpg",
  "589159541_17926554309179373_4773932076652099313_n.jpg",
  "590482479_17926554318179373_3929513711600136633_n.jpg",
  "631604059_17933767830179373_7389489587997262940_n.jpg",
  "631720297_1352112070262870_4847811711877564932_n.jpg",
  "631917370_1352111973596213_194994035129029681_n.jpg",
  "633207472_1352112016929542_6323390260047978267_n.jpg",
  "633375719_1352111933596217_4381281051821960200_n.jpg",
  "634743500_17934788058179373_1514141254197804076_n.jpg",
  "645995833_1370344885106255_9157182548210132803_n.jpg",
  "648690320_1372503324890411_4987795754496219365_n.jpg",
  "649871571_1375601994580544_2088247681471175482_n.jpg",
  "649884125_1375551551252255_8133070511646187938_n.jpg",
  "650829522_1375601927913884_8875948773283361845_n.jpg",
  "650831842_1375551661252244_8326199711515305436_n.jpg",
  "airport.png",
].map(f => `/photos/carrousel/${f}`);

// ─── SVG Icons ──────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#C8956C" : "none"} stroke={filled ? "#C8956C" : "#999"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
);
const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
const ArrowUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
);

// ─── Order Modal ────────────────────────────────────────────
const GOUVERNORATS = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine",
  "Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine",
  "Tozeur","Tunis","Zaghouan",
];

function OrderModal({ product, onClose }) {
  const [form, setForm] = useState({ nom: "", telephone: "", adresse: "", gouvernorat: "", qty: 1, size: product.size });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.nom.trim())        e.nom        = "Requis";
    if (!form.telephone.trim())  e.telephone  = "Requis";
    if (!form.adresse.trim())    e.adresse    = "Requis";
    if (!form.gouvernorat)       e.gouvernorat = "Requis";
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
      `👤 *${form.nom}*\n` +
      `📞 ${form.telephone}\n` +
      `📍 ${form.adresse} — ${form.gouvernorat}`;
    window.open(`https://wa.me/21629930212?text=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
  };

  const inp = (key, placeholder, type = "text") => (
    <input
      type={type}
      value={form[key]}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "11px 14px",
        border: `1px solid ${errors[key] ? "#e57373" : "#ddd"}`,
        fontFamily: "'Jost',sans-serif", fontSize: 13, outline: "none",
        background: "white", color: "var(--dark)", borderRadius: 2,
      }}
      onFocus={e => e.target.style.borderColor = "var(--gold)"}
      onBlur={e => e.target.style.borderColor = errors[key] ? "#e57373" : "#ddd"}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />

      <div className="order-modal-inner" style={{
        position: "relative", background: "white",
        width: "min(820px,96vw)", maxHeight: "95vh",
        display: "flex", overflow: "hidden",
        animation: "fadeUp 0.3s ease", borderRadius: 2,
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)"
      }}>

        {/* ── Left: big product photo ── */}
        <div className="order-modal-photo" style={{ flex: "0 0 42%", position: "relative", background: "#f0ebe4" }}>
          <img src={product.img} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {/* Price overlay bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
            padding: "40px 20px 20px"
          }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(200,149,108,0.9)", marginBottom: 4 }}>{product.category}</p>
            <p style={{ color: "white", fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>{product.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <span style={{ fontFamily: "'Jost',sans-serif", color: "var(--gold)", fontSize: 22, fontWeight: 700 }}>{product.price} ت.د</span>
              {product.oldPrice && <span style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "line-through" }}>{product.oldPrice} ت.د</span>}
            </div>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="order-modal-form" style={{ flex: 1, overflowY: "auto", padding: "32px 28px" }}>

          {/* Close */}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, zIndex: 3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {sent ? (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 10 }}>Commande envoyée !</h2>
              <p style={{ fontFamily: "'Jost',sans-serif", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
                Votre commande a été transmise via WhatsApp.<br />Nous vous contacterons très prochainement.
              </p>
              <button className="btn-gold" onClick={onClose} style={{ padding: "12px 36px", fontSize: 12 }}>Fermer</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              {/* Header */}
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Passer la commande</p>
              <h2 style={{ fontSize: 20, fontWeight: 500, color: "var(--dark)", marginBottom: 6 }}>{product.name}</h2>

              {/* Taille */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Taille</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {product.sizes.map(s => (
                    <button key={s} type="button" onClick={() => set("size", s)} style={{
                      padding: "7px 18px",
                      border: form.size === s ? "2px solid var(--gold)" : "1px solid #ddd",
                      background: form.size === s ? "var(--gold)" : "white",
                      color: form.size === s ? "white" : "var(--dark)",
                      fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 500,
                      cursor: "pointer", transition: "all 0.2s", borderRadius: 2,
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Livraison gratuite */}
              <div style={{
                background: "#f0faf4", border: "1px solid #c3e6cb",
                padding: "10px 14px", marginBottom: 20, borderRadius: 2,
                display: "flex", alignItems: "center", gap: 8
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#2e7d32", fontWeight: 500 }}>Livraison gratuite partout en Tunisie</span>
              </div>

              {/* Nom + Téléphone */}
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

              {/* Adresse + Gouvernorat */}
              <div className="order-form-row" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>Adresse *</label>
                  {inp("adresse", "Rue, numéro...")}
                  {errors.adresse && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors.adresse}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#666", marginBottom: 5 }}>Gouvernorat *</label>
                  <select value={form.gouvernorat} onChange={e => set("gouvernorat", e.target.value)} style={{
                    width: "100%", padding: "11px 14px",
                    border: `1px solid ${errors.gouvernorat ? "#e57373" : "#ddd"}`,
                    fontFamily: "'Jost',sans-serif", fontSize: 13, outline: "none",
                    background: "white", color: form.gouvernorat ? "var(--dark)" : "#aaa",
                    cursor: "pointer", borderRadius: 2,
                  }}>
                    <option value="">Choisir un gouvernorat</option>
                    {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gouvernorat && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#e57373", marginTop: 3 }}>{errors.gouvernorat}</p>}
                </div>
              </div>

              {/* Quantité + Total */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 2, overflow: "hidden" }}>
                  <button type="button" onClick={() => set("qty", Math.max(1, form.qty - 1))}
                    style={{ width: 38, height: 38, border: "none", background: "#f9f9f9", fontSize: 18, cursor: "pointer", color: "var(--dark)", borderRight: "1px solid #ddd" }}>−</button>
                  <span style={{ width: 44, textAlign: "center", fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 600 }}>{form.qty}</span>
                  <button type="button" onClick={() => set("qty", form.qty + 1)}
                    style={{ width: 38, height: 38, border: "none", background: "#f9f9f9", fontSize: 18, cursor: "pointer", color: "var(--dark)", borderLeft: "1px solid #ddd" }}>+</button>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Total</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>{product.price * form.qty} ت.د</span>
                </div>
              </div>

              <button type="submit" className="btn-gold" style={{ width: "100%", padding: "14px", fontSize: 12 }}>
                Commander →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Avis Clients ───────────────────────────────────────────
const avisPhotos = [
  "613305422_17930421420179373_948083869247423410_n.jpg",
  "573055904_1267916582015753_4648795093125359844_n.jpg",
  "600986824_17927466804179373_560503238053382020_n.jpg",
];

function AvisGrid() {
  const [lightbox, setLightbox] = useState(null);
  const [hovered, setHovered] = useState(null);

  return (
    <>
      {/* Cards row */}
      <div className="avis-row" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 24,
        maxWidth: 1100,
        margin: "0 auto",
      }}>
        {avisPhotos.map((f, i) => (
          <div
            key={i}
            onClick={() => setLightbox(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "relative",
              cursor: "zoom-in",
              background: "white",
              overflow: "hidden",
              borderRadius: 2,
              border: "1px solid rgba(200,149,108,0.18)",
              boxShadow: hovered === i
                ? "0 20px 56px rgba(0,0,0,0.18)"
                : "0 4px 20px rgba(0,0,0,0.06)",
              transform: hovered === i ? "translateY(-10px) scale(1.012)" : "translateY(0) scale(1)",
              transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease",
              animation: `fadeUp 0.6s ease ${0.12 * i}s both`,
            }}
          >
            {/* Gold top accent line */}
            <div style={{
              height: 3,
              background: hovered === i
                ? "var(--gold)"
                : "linear-gradient(to right, transparent, rgba(200,149,108,0.4), transparent)",
              transition: "background 0.4s ease",
            }} />

            {/* Photo */}
            <div style={{ overflow: "hidden" }}>
              <img
                src={`/photos/avis/${f}`}
                alt={`Avis cliente ${i + 1}`}
                style={{
                  width: "100%",
                  display: "block",
                  objectFit: "contain",
                  transform: hovered === i ? "scale(1.04)" : "scale(1)",
                  transition: "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
                }}
              />
            </div>

            {/* Bottom label */}
            <div style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(200,149,108,0.1)",
            }}>
              <div>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p style={{
                  fontFamily: "'Jost',sans-serif", fontSize: 11,
                  color: "var(--text-muted)", letterSpacing: "1px",
                  textTransform: "uppercase",
                }}>Cliente vérifiée</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(200,149,108,0.4)" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>

            {/* Zoom hint overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(44,33,23,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: hovered === i ? 1 : 0,
              transition: "opacity 0.3s ease",
              pointerEvents: "none",
            }}>
              <div style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "50%",
                width: 48, height: 48,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 3000,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
            animation: "fadeIn 0.25s ease",
          }}
        >
          {/* Prev */}
          {lightbox > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(l => l - 1); }} style={{
              position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "white", width: 44, height: 44, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          <img
            src={`/photos/avis/${avisPhotos[lightbox]}`}
            alt="Avis"
            style={{ maxWidth: "88vw", maxHeight: "88vh", objectFit: "contain", animation: "fadeUp 0.3s ease" }}
          />
          {/* Next */}
          {lightbox < avisPhotos.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(l => l + 1); }} style={{
              position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "white", width: 44, height: 44, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}
          {/* Close */}
          <button onClick={() => setLightbox(null)} style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            color: "white", width: 40, height: 40, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {/* Counter */}
          <div style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            fontFamily: "'Jost',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)",
            letterSpacing: "2px",
          }}>
            {lightbox + 1} / {avisPhotos.length}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main App ───────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home"); // "home" | "collection" | "contact"
  const [activeCategory, setActiveCategory] = useState("Tout");

  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderTimer = useRef(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showProduct, setShowProduct] = useState(null);
  const [addedToCart, setAddedToCart] = useState(null);
  const [selectedSize, setSelectedSize] = useState({});
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderProduct, setOrderProduct] = useState(null);
  const [collectionTarget, setCollectionTarget] = useState(null);
  const shopRef = useRef(null);
  const collectionRef = useRef(null);
  const nouvellesRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = products
    .filter(p => activeCategory === "Tout" || p.tag === activeCategory)
    .filter(p => !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()));

  const addToCart = (product, size) => {
    const sz = size || selectedSize[product.id] || product.sizes[0];
    setCart(prev => {
      const key = `${product.id}-${sz}`;
      const exists = prev.find(i => `${i.id}-${i.size}` === key);
      if (exists) return prev.map(i => `${i.id}-${i.size}` === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, size: sz, qty: 1 }];
    });
    setAddedToCart(product.id);
    setNotification(`${product.name} ajouté au panier`);
    setTimeout(() => { setAddedToCart(null); setNotification(null); }, 2000);
  };

  const removeFromCart = (id, size) =>
    setCart(prev => prev.filter(i => !(i.id === id && i.size === size)));

  const updateQty = (id, size, delta) =>
    setCart(prev => prev.map(i => {
      if (i.id === id && i.size === size) {
        const q = i.qty + delta;
        return q > 0 ? { ...i, qty: q } : i;
      }
      return i;
    }));

  const toggleFav = (id) =>
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // ── Background music ──
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    const play = () => audio.play().catch(() => {});
    play();
    document.addEventListener("click", play, { once: true });
    return () => document.removeEventListener("click", play);
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const scrollToShop       = () => shopRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToCollection = () => collectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToNouvelles  = () => nouvellesRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToContact    = () => contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToTop        = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navActions = [
    scrollToTop,
    scrollToShop,
    () => setPage("collection"),
    () => setPage("contact"),
  ];

  const sliderNext = useCallback(() =>
    setSliderIndex(i => (i + 1) % galleryPhotos.length), []);
  const sliderPrev = () =>
    setSliderIndex(i => (i - 1 + galleryPhotos.length) % galleryPhotos.length);

  useEffect(() => {
    sliderTimer.current = setInterval(sliderNext, 4500);
    return () => clearInterval(sliderTimer.current);
  }, [sliderNext]);

  // ── WhatsApp order message
  const waMessage = encodeURIComponent(
    "Bonjour Basma! Je souhaite commander:\n" +
    cart.map(i => `• ${i.name} (Taille: ${i.size}) x${i.qty} — ${i.price * i.qty} ت.د`).join("\n") +
    `\n\nTotal: ${totalPrice} ت.د`
  );

  return (
    <>
      {/* ── Audio — toujours dans le DOM ── */}
      <audio ref={audioRef} src="/son.mp3" loop preload="auto" />

      {/* ── Mute button — à côté du bouton WhatsApp ── */}
      <button onClick={toggleMute} title={muted ? "Activer le son" : "Couper le son"} className="mute-btn" style={{
        position: "fixed", bottom: 24, left: 24, zIndex: 900,
        width: 42, height: 42, borderRadius: "50%",
        background: "rgba(250,247,242,0.92)", border: "1px solid rgba(200,149,108,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        backdropFilter: "blur(8px)", transition: "all 0.25s",
        color: "var(--gold)",
      }}>
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        )}
      </button>

      {/* ── WhatsApp — toutes les pages ── */}
      <a href="https://wa.me/21629930212" target="_blank" rel="noopener noreferrer"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 900,
          width: 42, height: 42, borderRadius: "50%",
          background: "rgba(250,247,242,0.92)", border: "1px solid rgba(200,149,108,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)", backdropFilter: "blur(8px)",
          transition: "all 0.25s", textDecoration: "none",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(200,149,108,0.45)"; e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(250,247,242,0.92)"; e.currentTarget.style.borderColor = "rgba(200,149,108,0.3)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "scale(1)"; }}
        title="Nous contacter sur WhatsApp"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--gold)">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ── Scroll to top — toutes les pages ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Retour en haut"
        style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 900,
          width: 42, height: 42, borderRadius: "50%",
          background: "rgba(250,247,242,0.92)", border: "1px solid rgba(200,149,108,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          backdropFilter: "blur(8px)", transition: "all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
          color: "var(--gold)",
          opacity: showTop ? 1 : 0,
          transform: showTop ? "translateY(0) scale(1)" : "translateY(14px) scale(0.8)",
          pointerEvents: showTop ? "auto" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>

      {/* ── Page Collection ── */}
      {page === "collection" ? (
        <CollectionPage onBack={() => { setPage("home"); setCollectionTarget(null); }} initialCategory={collectionTarget} />
      ) : page === "contact" ? (
        <ContactPage onBack={() => setPage("home")} />
      ) : (
      <>
      <RamadanDecor />

      {/* ── Notification Toast ── */}
      {notification && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 3000,
          background: "var(--dark)", color: "white", padding: "12px 28px", borderRadius: 50,
          fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 500,
          animation: "notifSlide 0.3s ease", boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <CheckIcon /> {notification}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           NAVBAR
         ══════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 70,
        background: scrolled ? "rgba(250,247,242,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(200,149,108,0.15)" : "none",
        transition: "all 0.4s ease", padding: "0 clamp(20px,4vw,60px)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/images/logo.png" alt="Basma" style={{ height: 42 }} />
        </div>

        <div className="nav-links-desktop" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {["ACCUEIL", "EXCLUSIFS", "COLLECTION", "CONTACT"].map((item, i) => (
            <a key={item} className="nav-link" onClick={() => navActions[i]()}>
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Search */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {showSearch && (
              <div className="search-input-wrap" style={{
                position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
                display: "flex", alignItems: "center",
                border: "1px solid rgba(200,149,108,0.4)",
                background: "rgba(250,247,242,0.97)", backdropFilter: "blur(8px)",
                animation: "fadeIn 0.2s ease"
              }}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); } if (e.key === "Enter" && searchQuery.trim()) scrollToShop(); }}
                  placeholder="Rechercher..."
                  style={{
                    width: 190, padding: "8px 10px 8px 14px",
                    border: "none", fontFamily: "'Jost',sans-serif", fontSize: 13,
                    outline: "none", background: "transparent", color: "var(--dark)"
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "0 8px", color: "#aaa", display: "flex", alignItems: "center"
                  }} title="Effacer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
            <button onClick={() => { setShowSearch(s => !s); if (showSearch) setSearchQuery(""); }} style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4
            }} title="Rechercher">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>

          {/* Favoris */}
          <button onClick={() => {}} style={{
            position: "relative", background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4
          }} title="Favoris">
            <svg width="22" height="22" viewBox="0 0 24 24" fill={favorites.length > 0 ? "var(--gold)" : "none"} stroke={favorites.length > 0 ? "var(--gold)" : "currentColor"} strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {favorites.length > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -7, background: "var(--gold)", color: "white",
                fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Jost',sans-serif"
              }}>{favorites.length}</span>
            )}
          </button>

          {/* Panier */}
          <button onClick={() => setShowCart(true)} style={{
            position: "relative", background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4
          }} title="Panier">
            <CartIcon />
            {totalItems > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -7, background: "var(--gold)", color: "white",
                fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Jost',sans-serif", animation: "pulse 0.3s ease"
              }}>{totalItems}</span>
            )}
          </button>

          <button className="mobile-btn" onClick={() => setMobileMenu(!mobileMenu)} style={{
            display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4
          }}>
            {mobileMenu ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div style={{
          position: "fixed", top: 70, left: 0, right: 0, background: "var(--cream)", zIndex: 999,
          padding: "16px 24px", borderBottom: "1px solid rgba(200,149,108,0.2)", animation: "fadeIn 0.2s"
        }}>
          {["ACCUEIL", "EXCLUSIFS", "COLLECTION", "CONTACT"].map((item, i) => (
            <a key={item} onClick={() => { setMobileMenu(false); navActions[i](); }} style={{
              display: "block", padding: "14px 0", textDecoration: "none", color: "var(--dark)",
              fontFamily: "'Jost',sans-serif", fontSize: 14, letterSpacing: "1px",
              textTransform: "uppercase", borderBottom: "1px solid #f0ebe4", cursor: "pointer"
            }}>{item}</a>
          ))}
          {/* Search in mobile menu */}
          <div style={{ padding: "14px 0", borderBottom: "1px solid #f0ebe4" }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && searchQuery.trim()) { setMobileMenu(false); scrollToShop(); } }}
              placeholder="Rechercher un produit..."
              style={{
                width: "100%", padding: "10px 14px", border: "1px solid rgba(200,149,108,0.3)",
                fontFamily: "'Jost',sans-serif", fontSize: 13, outline: "none",
                background: "transparent", color: "var(--dark)"
              }}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           HERO SECTION
         ══════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 70,
        background: "linear-gradient(135deg, var(--cream) 0%, #F5EDE4 50%, #EDE3D8 100%)",
        overflow: "hidden"
      }}>
        <div className="hero-grid" style={{
          display: "flex", maxWidth: 1200, margin: "0 auto",
          padding: "40px clamp(20px,4vw,60px)", gap: 60, alignItems: "center", width: "100%"
        }}>
          <div style={{ flex: 1, animation: "fadeUp 0.8s ease" }}>
            <p style={{
              fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "3px",
              textTransform: "uppercase", color: "var(--gold)", marginBottom: 20, fontWeight: 500
            }}>✦ Collection Exclusive 2026</p>

            <h1 className="hero-title" style={{
              fontSize: "clamp(38px,5vw,62px)", fontWeight: 300, lineHeight: 1.05,
              letterSpacing: "-1px", marginBottom: 24, color: "var(--dark)"
            }}>
              L'Élégance<br />
              <em style={{ fontWeight: 500, color: "var(--gold)" }}>Authentique</em><br />
              par Basma
            </h1>

            <p style={{
              fontFamily: "'Jost',sans-serif", color: "var(--text-muted)", fontSize: 15,
              lineHeight: 1.8, marginBottom: 36, maxWidth: 420, fontWeight: 300
            }}>
              Des abayas et djellabas d'exception, confectionnées avec des tissus nobles
              pour sublimer votre élégance au quotidien.
            </p>

            <div className="hero-btns" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button className="btn-gold" onClick={scrollToShop}
                style={{ padding: "16px 40px", fontSize: 12 }}>
                Découvrir
              </button>
              <button className="btn-outline-gold"
                style={{ padding: "16px 40px", fontSize: 12 }}>
                Catalogue
              </button>
            </div>
          </div>

          <div className="hero-right" style={{ flex: 1, maxWidth: 460, animation: "fadeUp 0.8s ease 0.2s both" }}>
            {/* Decorative border */}
            <div style={{ position: "relative" }}>
              <div className="hero-deco-border" style={{
                position: "absolute", top: -20, left: -20, right: 20, bottom: 20,
                border: "1px solid var(--gold)", opacity: 0.25, zIndex: 0, pointerEvents: "none"
              }} />

              {/* Slider */}
              <div className="hero-slider" style={{ position: "relative", zIndex: 1, aspectRatio: "3/4", overflow: "hidden" }}>
                {galleryPhotos.map((src, i) => (
                  <div key={i} className={`hero-slide${i === sliderIndex ? " hero-slide-active" : ""}`}>
                    <img src={src} alt="" />
                  </div>
                ))}

                {/* Minimal arrows — visible on hover */}
                <button className="hero-arrow hero-arrow-left"
                  onClick={() => { clearInterval(sliderTimer.current); sliderPrev(); sliderTimer.current = setInterval(sliderNext, 4500); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button className="hero-arrow hero-arrow-right"
                  onClick={() => { clearInterval(sliderTimer.current); sliderNext(); sliderTimer.current = setInterval(sliderNext, 4500); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Thin progress bar */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.15)", zIndex: 5 }}>
                  <div className="hero-progress" key={sliderIndex} style={{ height: "100%", background: "rgba(255,255,255,0.7)" }} />
                </div>
              </div>

              {/* Badge */}
              <div className="hero-badge" style={{
                position: "absolute", bottom: 28, right: -16, background: "white",
                padding: "14px 22px", boxShadow: "0 8px 40px rgba(0,0,0,0.1)", zIndex: 6,
                animation: "fadeUp 1s ease 0.6s both"
              }}>
                <p style={{
                  fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2.5px",
                  textTransform: "uppercase", color: "var(--gold)", marginBottom: 4
                }}>Nouveauté</p>
                <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>Ramadan 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           FEATURES
         ══════════════════════════════════════════════════════ */}
      <section ref={collectionRef} style={{ padding: "80px clamp(20px,4vw,60px)", background: "white" }}>
        <div className="features-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          gap: 40, maxWidth: 1000, margin: "0 auto"
        }}>
          {[
            { icon: "◇", title: "Tissus Nobles", desc: "Satin, soie et crêpe sélectionnés pour un confort exceptionnel." },
            { icon: "✦", title: "Fait Main", desc: "Chaque pièce est confectionnée avec une attention minutieuse aux détails." },
            { icon: "❋", title: "Design Exclusif", desc: "Créations uniques alliant tradition marocaine et modernité." }
          ].map((f, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "32px 20px",
              animation: `fadeUp 0.5s ease ${0.15 * i}s both`
            }}>
              <div style={{ fontSize: 28, color: "var(--gold)", marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{
                fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 600,
                letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12
              }}>{f.title}</h3>
              <p style={{
                fontFamily: "'Jost',sans-serif", color: "#999", fontSize: 13,
                lineHeight: 1.7, fontWeight: 300
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           PRODUCTS SECTION — EXCLUSIFS
         ══════════════════════════════════════════════════════ */}
      <section ref={shopRef} style={{ background: "white" }}>
        {/* Section header band */}
        <div className="exclusifs-header" style={{
          background: "linear-gradient(135deg, var(--dark) 0%, #3D3328 100%)",
          padding: "56px clamp(20px,4vw,60px) 52px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "4px",
            textTransform: "uppercase", color: "var(--gold)", marginBottom: 14
          }}>Boutique</p>
          <h2 style={{
            fontSize: "clamp(30px,4vw,46px)", fontWeight: 300, letterSpacing: "-0.5px",
            color: "white", lineHeight: 1.1, marginBottom: 20
          }}>
            Produits <em style={{ fontWeight: 500, color: "var(--gold)", fontStyle: "italic" }}>Exclusifs</em>
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 48, height: 1, background: "linear-gradient(to right, transparent, rgba(200,149,108,0.6))" }} />
            <span style={{ color: "rgba(200,149,108,0.7)", fontSize: 14 }}>✦</span>
            <div style={{ width: 48, height: 1, background: "linear-gradient(to left, transparent, rgba(200,149,108,0.6))" }} />
          </div>
        </div>

        <div style={{ padding: "60px clamp(20px,4vw,60px) 80px", maxWidth: 1260, margin: "0 auto" }}>

        {/* Tab Filters */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 44, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} className="cat-pill"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "10px 28px",
                border: activeCategory === cat ? "1.5px solid var(--gold)" : "1.5px solid #ddd",
                background: activeCategory === cat ? "var(--gold)" : "transparent",
                color: activeCategory === cat ? "white" : "#888",
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Collection Category Cards */}
        <div className="products-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20
        }}>
          {(exclusifsData[activeCategory] || []).map((item, i) => (
            <ExcluCard key={item.id} item={item} index={i}
              onNavigate={(id) => { setCollectionTarget(id); setPage("collection"); }} />
          ))}
        </div>
        </div>{/* end inner padding div */}
      </section>

      {/* ── Séparateur entre sections ── */}
      <div style={{
        height: 2,
        background: "linear-gradient(to right, transparent, rgba(200,149,108,0.35) 20%, var(--gold) 50%, rgba(200,149,108,0.35) 80%, transparent)",
      }} />

      {/* ══════════════════════════════════════════════════════
           AVIS CLIENTS
         ══════════════════════════════════════════════════════ */}
      <section ref={nouvellesRef} style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(200,149,108,0.1) 0%, transparent 65%), #F5EDE4",
        padding: "80px clamp(20px,4vw,60px) 96px",
      }}>
        <div style={{ maxWidth: 1260, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{
              fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "4px",
              textTransform: "uppercase", color: "var(--gold)", marginBottom: 14
            }}>Témoignages</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 300, letterSpacing: "-0.5px", color: "var(--dark)" }}>
              Ce que disent nos{" "}
              <em style={{ fontWeight: 500, color: "var(--gold)", fontStyle: "italic" }}>clientes</em>
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 }}>
              <div style={{ width: 48, height: 1, background: "linear-gradient(to right, transparent, var(--gold))" }} />
              <span style={{ color: "var(--gold)", fontSize: 14 }}>✦</span>
              <div style={{ width: 48, height: 1, background: "linear-gradient(to left, transparent, var(--gold))" }} />
            </div>
          </div>

          {/* Reviews grid — drops screenshots from /photos/avis/ */}
          <AvisGrid />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           NEWSLETTER
         ══════════════════════════════════════════════════════ */}
      <section ref={contactRef} style={{ padding: "80px clamp(20px,4vw,60px)", background: "white" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "3px",
            textTransform: "uppercase", color: "var(--gold)", marginBottom: 12
          }}>Newsletter</p>
          <h2 style={{ fontSize: 32, fontWeight: 400, marginBottom: 12 }}>Restez Informée</h2>
          <p style={{
            fontFamily: "'Jost',sans-serif", color: "#999", fontSize: 14, marginBottom: 32, fontWeight: 300
          }}>Recevez nos dernières créations et offres exclusives.</p>
          <div style={{ display: "flex", gap: 0 }}>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              style={{
                flex: 1, padding: "16px 20px", border: "1px solid #ddd", borderRight: "none",
                fontFamily: "'Jost',sans-serif", fontSize: 14, outline: "none", background: "transparent"
              }} />
            <button className="btn-gold" style={{ padding: "16px 32px", fontSize: 12, border: "1px solid var(--gold)", whiteSpace: "nowrap" }}>
              S'abonner
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           FOOTER
         ══════════════════════════════════════════════════════ */}
      <footer style={{ background: "var(--dark)", color: "white", padding: "60px clamp(20px,4vw,60px) 30px" }}>
        <div className="footer-grid" style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 50,
          maxWidth: 1200, margin: "0 auto", marginBottom: 50
        }}>
          <div>
            <img src="/images/logo.png" alt="Basma"
              style={{ height: 50, marginBottom: 16, filter: "brightness(10)" }} />
            <p style={{
              fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.5)",
              fontSize: 13, lineHeight: 1.8, fontWeight: 300
            }}>
              Mode élégante pour femme. Abayas et djellabas de qualité,
              confectionnées avec des tissus nobles et un savoir-faire artisanal.
            </p>
          </div>
          {[
            { title: "Boutique", links: ["Abayas", "Djellabas", "Nouveautés", "Soldes"] },
            { title: "Service", links: ["FAQ", "Livraison", "Retours", "Contact"] },
          ].map((col, i) => (
            <div key={i}>
              <h4 style={{
                fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: "2px", textTransform: "uppercase", marginBottom: 20, color: "var(--gold)"
              }}>{col.title}</h4>
              {col.links.map(link => (
                <a key={link} style={{
                  display: "block", fontFamily: "'Jost',sans-serif",
                  color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12,
                  textDecoration: "none", cursor: "pointer", fontWeight: 300
                }}>{link}</a>
              ))}
            </div>
          ))}

          {/* Réseaux sociaux */}
          <div>
            <h4 style={{
              fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: "2px", textTransform: "uppercase", marginBottom: 20, color: "var(--gold)"
            }}>Suivez-nous</h4>
            {[
              { label: "Instagram", href: "https://www.instagram.com/basma_onlyshop/", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
              { label: "Facebook",  href: "https://www.facebook.com/profile.php?id=100063922697417", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label: "TikTok",    href: "https://www.tiktok.com/@____basmas__777", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.84a8.2 8.2 0 0 0 4.78 1.52V6.91a4.85 4.85 0 0 1-1.01-.22z"/></svg> },
              { label: "WhatsApp",  href: "https://wa.me/21629930212", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 13,
                marginBottom: 12, textDecoration: "none", fontWeight: 300,
                transition: "color 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
                {icon} {label}
              </a>
            ))}
          </div>
        </div>
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24,
          display: "flex", justifyContent: "space-between", flexWrap: "wrap",
          gap: 10, maxWidth: 1200, margin: "0 auto"
        }}>
          <p style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            © 2026 Basma Only Shop. Tous droits réservés.
          </p>
          <p style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            Fait avec ♥ au Maroc
          </p>
        </div>
      </footer>


      {/* ══════════════════════════════════════════════════════
           ORDER PAGE
         ══════════════════════════════════════════════════════ */}
      {orderProduct && (
        <OrderModal product={orderProduct} onClose={() => setOrderProduct(null)} />
      )}


      {/* ══════════════════════════════════════════════════════
           PRODUCT DETAIL MODAL
         ══════════════════════════════════════════════════════ */}
      {showProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setShowProduct(null)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div className="product-modal-inner" style={{
            position: "relative", background: "white", width: "min(850px,92vw)", maxHeight: "90vh",
            overflow: "auto", display: "flex", flexWrap: "wrap", animation: "fadeUp 0.3s ease"
          }}>
            <button onClick={() => setShowProduct(null)} style={{
              position: "absolute", top: 16, right: 16, background: "white", border: "none",
              cursor: "pointer", zIndex: 3, padding: 4
            }}><CloseIcon /></button>

            <div className="product-modal-img" style={{ flex: "1 1 350px", minHeight: 400 }}>
              <img src={showProduct.img} alt={showProduct.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            <div className="product-modal-info" style={{
              flex: "1 1 300px", padding: "40px 36px", display: "flex",
              flexDirection: "column", justifyContent: "center"
            }}>
              <p style={{
                fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "2px",
                textTransform: "uppercase", color: "var(--gold)", marginBottom: 8
              }}>{showProduct.category}</p>
              <h2 style={{ fontSize: 28, fontWeight: 500, marginBottom: 8 }}>{showProduct.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 24, fontWeight: 600 }}>
                  {showProduct.price} ت.د
                </span>
                {showProduct.oldPrice && (
                  <span style={{
                    fontFamily: "'Jost',sans-serif", fontSize: 16, color: "#bbb", textDecoration: "line-through"
                  }}>{showProduct.oldPrice} ت.د</span>
                )}
              </div>
              <p style={{
                fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#999", lineHeight: 1.7,
                marginBottom: 24, fontWeight: 300
              }}>
                Une pièce d'exception confectionnée en tissu satin de haute qualité.
                Coupe fluide et élégante, parfaite pour toutes les occasions.
              </p>

              {/* Size selector */}
              <div style={{ marginBottom: 24 }}>
                <p style={{
                  fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px",
                  textTransform: "uppercase", marginBottom: 10, fontWeight: 500
                }}>Taille</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {showProduct.sizes.map(s => {
                    const active = (selectedSize[showProduct.id] || showProduct.sizes[0]) === s;
                    return (
                      <button key={s} className="size-btn"
                        onClick={() => setSelectedSize(prev => ({ ...prev, [showProduct.id]: s }))}
                        style={{
                          width: 42, height: 42,
                          border: active ? "2px solid var(--gold)" : "1px solid #ddd",
                          background: active ? "var(--gold)" : "transparent",
                          color: active ? "white" : "var(--dark)",
                          fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 500,
                          cursor: "pointer", transition: "all 0.2s"
                        }}>{s}</button>
                    );
                  })}
                </div>
              </div>

              <button className="btn-gold" onClick={() => {
                addToCart(showProduct);
                setShowProduct(null);
                setShowCart(true);
              }} style={{ width: "100%", padding: 16, fontSize: 12, marginBottom: 10 }}>
                Ajouter au Panier
              </button>
              <button className="btn-outline-gold"
                onClick={() => { setOrderProduct({ ...showProduct, size: selectedSize[showProduct.id] || showProduct.sizes[0] }); setShowProduct(null); }}
                style={{ width: "100%", padding: 16, fontSize: 12 }}>
                Commander
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           CART DRAWER
         ══════════════════════════════════════════════════════ */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
          <div onClick={() => setShowCart(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
          <div className="cart-drawer" style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: "min(420px,90vw)",
            background: "white", animation: "slideIn 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
            display: "flex", flexDirection: "column"
          }}>
            {/* Cart header */}
            <div style={{
              padding: "24px 28px", borderBottom: "1px solid #f0ebe4",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 500 }}>Panier</h2>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#999", marginTop: 2 }}>
                  {totalItems} article{totalItems !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setShowCart(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <CloseIcon />
              </button>
            </div>

            {/* Cart items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 80, color: "#bbb" }}>
                  <CartIcon /><br /><br />
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 14 }}>Votre panier est vide</p>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, marginTop: 8, color: "#ccc" }}>
                    Explorez notre collection
                  </p>
                </div>
              ) : cart.map(item => (
                <div key={`${item.id}-${item.size}`} style={{
                  display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid #f5f0ea",
                  animation: "fadeUp 0.3s"
                }}>
                  <img src={item.img} alt={item.name}
                    style={{ width: 72, height: 90, objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 500 }}>{item.name}</h4>
                        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>
                          Taille: {item.size}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(item.id, item.size)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 2 }}>
                        <TrashIcon />
                      </button>
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14
                    }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #eee" }}>
                        <button onClick={() => updateQty(item.id, item.size, -1)} style={{
                          width: 32, height: 32, background: "none", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}><MinusIcon /></button>
                        <span style={{
                          width: 32, textAlign: "center", fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 500
                        }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.size, 1)} style={{
                          width: 32, height: 32, background: "none", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}><PlusIcon /></button>
                      </div>
                      <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 600 }}>
                        {item.price * item.qty} ت.د
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart footer */}
            {cart.length > 0 && (
              <div style={{ padding: "24px 28px", borderTop: "1px solid #f0ebe4" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Jost',sans-serif", color: "#888", fontSize: 13 }}>Sous-total</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontWeight: 500, fontSize: 13 }}>{totalPrice} ت.د</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Jost',sans-serif", color: "#888", fontSize: 13 }}>Livraison</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontWeight: 500, fontSize: 13, color: "#25D366" }}>Gratuite</span>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", paddingTop: 14,
                  borderTop: "1px solid #f0ebe4", marginBottom: 20
                }}>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontWeight: 600, fontSize: 16 }}>Total</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontWeight: 700, fontSize: 18, color: "var(--gold)" }}>
                    {totalPrice} ت.د
                  </span>
                </div>

                <button className="btn-gold" style={{
                  width: "100%", padding: 16, fontSize: 12, marginBottom: 10
                }}>
                  Commander
                </button>

                <a href={`https://wa.me/21629930212?text=${waMessage}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: 14, background: "#25D366", color: "white", border: "none",
                    fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 500,
                    letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer",
                    textDecoration: "none"
                  }}>
                  <WhatsAppIcon /> Commander via WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
      )}
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import OrderModal from "./components/OrderModal";
import { useLang } from "./context/LangContext";
import { chargerProduits } from "./lib/catalog";

// Correspondance libellé catégorie (en base) -> id catégorie (pour la traduction)
const LABEL_TO_ID = {
  "Abaya": "3ibaya", "Écharpe": "echarpe", "Jiba": "jiba", "Kids": "kids",
  "Manteau": "manteau", "Burkini": "MDB", "Pyjama": "pyjama", "Robe": "Robe",
  "Sac": "Sac", "Set": "set", "Accessoires": "accessoires", "Cosmétique": "cosmetique",
  "Pack's": "pack",
};

// ── Lookbook pages ─────────────────────────────────────────────
// Ordre : Abaya → Jiba → Pyjama → Robe → Set → Manteau → Écharpe → Sac → Kids → MDB
const PAGES = [
  {
    id: 1,
    catId: "3ibaya",
    img: "/photos/3ibaya/648102785_1371074615033282_5385296663968872502_n.jpg",
    category: "Abaya",
    name: "Abaya Collection",
    price: 120,
    sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Abaya élégante en tissu de haute qualité, coupe fluide et raffinée.",
  },
  {
    id: 2,
    catId: "3ibaya",
    img: "/photos/3ibaya/641057449_17935739097179373_2825300746075166942_n.jpg",
    category: "Abaya",
    name: "Abaya Exclusive",
    price: 120,
    sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Abaya élégante en tissu de haute qualité, coupe fluide et raffinée.",
  },
  {
    id: 3,
    catId: "jiba",
    img: "/photos/jiba/499406882_1134013042072775_8705946179588991738_n.jpg",
    category: "Jiba",
    name: "Jiba Moderne",
    price: 90,
    sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Jiba moderne au style traditionnel revisité.",
  },
  {
    id: 4,
    catId: "pyjama",
    img: "/photos/pyjama/490345086_1118998213574258_6134831431061358690_n.jpg",
    category: "Pyjama",
    name: "Pyjama Satin",
    price: 85,
    sizes: ["S","M","L","XL"],
    desc: "Pyjama doux et confortable en tissu respirant.",
  },
  {
    id: 5,
    catId: "pyjama",
    img: "/photos/pyjama/579083507_1276299481177463_446330100554526195_n.jpg",
    category: "Pyjama",
    name: "Pyjama Luxe",
    price: 85,
    sizes: ["S","M","L","XL"],
    desc: "Pyjama doux et confortable en tissu respirant.",
  },
  {
    id: 6,
    catId: "Robe",
    img: "/photos/Robe/649636396_1374861407987936_6370692347574891488_n.jpg",
    category: "Robe",
    name: "Robe Élégance",
    price: 130,
    sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Robe aux couleurs vives et coupes flatteuses.",
  },
  {
    id: 7,
    catId: "set",
    img: "/photos/set/493138870_1143811757759570_6677303497939193345_n.jpg",
    category: "Set",
    name: "Set Coordonné",
    price: 150,
    sizes: ["S","M","L","XL"],
    desc: "Set coordonné pour un look complet et soigné.",
  },
  {
    id: 8,
    catId: "set",
    img: "/photos/set/549864507_1232854562188622_2760973217095054367_n.jpg",
    category: "Set",
    name: "Set Premium",
    price: 150,
    sizes: ["S","M","L","XL"],
    desc: "Set coordonné pour un look complet et soigné.",
  },
  {
    id: 9,
    catId: "manteau",
    img: "/photos/manteau/631604059_17933767830179373_7389489587997262940_n.jpg",
    category: "Manteau",
    name: "Manteau Couture",
    price: 200,
    sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Manteau chic en tissu de qualité supérieure.",
  },
  {
    id: 10,
    catId: "echarpe",
    img: "/photos/echarpe/595502671_1298811695592908_1151798460515221855_n.jpg",
    category: "Écharpe",
    name: "Écharpe Luxe",
    price: 35,
    sizes: ["TU"],
    desc: "Écharpe légère et douce en tissu premium.",
  },
  {
    id: 11,
    catId: "Sac",
    img: "/photos/Sac/631720297_1352112070262870_4847811711877564932_n.jpg",
    category: "Sac",
    name: "Sac Signature",
    price: 75,
    sizes: ["TU"],
    desc: "Sac tendance et fonctionnel.",
  },
  {
    id: 12,
    catId: "kids",
    img: "/photos/kids/649876591_1375551517918925_6681548330046473505_n.jpg",
    category: "Kids",
    name: "Kids Collection",
    price: 60,
    sizes: ["2-3ans","4-5ans","6-7ans","8-9ans","10-11ans"],
    desc: "Collection enfants colorée et confortable.",
  },
  {
    id: 13,
    catId: "MDB",
    img: "/photos/MDB/505353945_1156440629830016_8647673457501953606_n.jpg",
    category: "MDB",
    name: "MDB Signature",
    price: 110,
    sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Ensemble MDB moderne et tendance.",
  },
];

// ── Arrow SVGs ─────────────────────────────────────────────────
const ArrowLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ArrowRight = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ── Main component ─────────────────────────────────────────────
export default function LookbookPage({ onClose, muteAudio }) {
  const { t, isAr } = useLang();
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);       // entrance fade
  const [fading, setFading] = useState(false);         // transition fade
  const [orderProduct, setOrderProduct] = useState(null);
  const [pages, setPages] = useState([]);              // articles réels (Supabase)
  const [loaded, setLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" && window.innerWidth >= 1024);
  const touchStartX = useRef(null);
  const total = pages.length;

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Charge les articles disponibles (actifs) avec leur prix réel
  useEffect(() => {
    chargerProduits({ activesSeulement: true, order: "created_desc" })
      .then(({ produits }) => {
        const built = produits.map((p) => ({
          supabaseId: p.id,
          img: (p.images && p.images[0]) || "",
          photos: p.images || [],
          category: p.category,
          catId: LABEL_TO_ID[p.category] ?? null,
          name: p.name,
          nameAr: p.name_ar,
          desc: p.description,
          descAr: p.description_ar,
          price: p.price,
          originalPrice: p.original_price,
          sizes: p.sizes || [],
          variants: p.variants,
        })).filter((pg) => pg.img);
        setPages(built);
        setLoaded(true);
      });
  }, []);

  // Entrance animation
  useEffect(() => {
    muteAudio?.();
    const tm = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(tm);
  }, []);

  // Navigate with transition
  const goTo = useCallback((next) => {
    if (fading || next === idx) return;
    setFading(true);
    setTimeout(() => {
      setIdx(next);
      setFading(false);
    }, 380);
  }, [fading, idx]);

  const prev = useCallback(() => { if (idx > 0) goTo(idx - 1); }, [idx, goTo]);
  const next = useCallback(() => { if (idx < total - 1) goTo(idx + 1); }, [idx, total, goTo]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      else if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  // Touch / swipe
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx >  55) prev();
    else if (dx < -55) next();
  };

  const page = pages[idx];
  const pageLabel = `${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  // Écran de chargement / vide
  if (!page) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "rgba(255,255,255,0.7)" }}>
          {!loaded ? t("loading") : t("soon_available")}
        </p>
        <button onClick={onClose} style={{ padding: "10px 28px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px" }}>
          {t("close")}
        </button>
      </div>
    );
  }
  const origPrice = Number(page.originalPrice) || 0;
  const hasPromo = origPrice > page.price;
  const displayName = isAr && page.nameAr ? page.nameAr : page.name;
  const displayDesc = isAr && page.descAr ? page.descAr : page.desc;
  const openOrder = () => setOrderProduct({
    id: page.supabaseId, name: page.name, nameAr: page.nameAr,
    price: page.price, originalPrice: page.originalPrice,
    img: page.img, category: page.category, catId: page.catId,
    sizes: page.sizes, desc: page.desc, descAr: page.descAr,
    photos: page.photos, variants: page.variants,
  });

  return (
    <>
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed", inset: 0, zIndex: 3000,
          background: "#1a1a1a",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.75s ease",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* ── Full photo (photo entière + fond flou, jamais coupée) ── */}
        <div style={{
          position: "absolute", top: 0, bottom: 0, right: 0,
          left: isDesktop ? "38%" : 0,                       // PC : laisse la place au panneau éditorial
          opacity: fading ? 0 : 1,
          transform: fading ? "scale(1.025)" : "scale(1)",
          transition: "opacity 0.38s ease, transform 0.38s ease, left 0.3s ease",
        }}>
          {/* Fond flou de la même image → remplit l'espace avec élégance */}
          <img
            src={page.img}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", display: "block",
              filter: "blur(30px) brightness(0.5)", transform: "scale(1.12)",
            }}
          />
          {/* Photo complète, bien cadrée et centrée (aucune coupe) */}
          <img
            src={page.img}
            alt={page.name}
            loading="eager"
            decoding="async"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "center", display: "block",
            }}
          />
        </div>

        {/* ── Panneau éditorial (PC uniquement) — spread magazine ── */}
        {isDesktop && (
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "38%", zIndex: 15,
            background: "linear-gradient(135deg, #221d17 0%, #14110d 100%)",
            borderRight: "1px solid rgba(201,168,76,0.18)",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            padding: "clamp(40px,5vh,72px) clamp(34px,3.2vw,62px)", boxSizing: "border-box",
          }}>
            {/* Marque */}
            <div>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "5px", textTransform: "uppercase", color: "var(--gold)", margin: "0 0 4px" }}>Basma Only Shop</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, letterSpacing: "2px", color: "rgba(255,255,255,0.45)", margin: 0, fontStyle: "italic" }}>Lookbook 2026</p>
            </div>

            {/* Bloc article (change à chaque page) */}
            <div key={idx} style={{ animation: "fadeUp 0.6s ease both", opacity: fading ? 0 : 1, transition: "opacity 0.38s ease" }}>
              <div style={{ width: 44, height: 2, background: "var(--gold)", marginBottom: 22 }} />
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>
                {page.catId ? t(`cat_${page.catId}`) : page.category}
              </p>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", color: "white", fontSize: "clamp(30px,2.6vw,46px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.5px", margin: "0 0 18px" }}>
                {displayName}
              </h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 26, fontWeight: 700, color: "var(--gold)" }}>{page.price} ت.د</span>
                {hasPromo && (<>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 16, color: "rgba(255,255,255,0.45)", textDecoration: "line-through" }}>{origPrice} ت.د</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 700, color: "white", background: "#e0574a", padding: "3px 9px", borderRadius: 3 }}>-{Math.round((1 - page.price / origPrice) * 100)}%</span>
                </>)}
              </div>
              {displayDesc && (
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13.5, lineHeight: 1.8, color: "rgba(255,255,255,0.6)", margin: "0 0 28px", maxWidth: 360, whiteSpace: "pre-line" }}>
                  {displayDesc}
                </p>
              )}
              <button onClick={openOrder} style={{ padding: "14px 38px", fontSize: 12, background: "var(--gold)", color: "#1a1410", border: "none", cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                {t("order")}
              </button>
            </div>

            {/* Pied : numéro de page */}
            <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, letterSpacing: "3px", color: "rgba(255,255,255,0.35)" }}>{pageLabel}</div>
          </div>
        )}

        {/* ── Gradients (mobile/tablette uniquement, pour lisibilité du texte) ── */}
        {!isDesktop && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%, transparent 52%, rgba(0,0,0,0.78) 100%)",
        }} />
        )}

        {/* ── Top bar ── */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          padding: "28px clamp(20px,4vw,52px)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          {/* Branding (mobile uniquement — sur PC il est dans le panneau) */}
          {!isDesktop ? (
          <div style={{ animation: visible ? "fadeUp 0.8s ease 0.3s both" : "none" }}>
            <p style={{
              fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "5px",
              textTransform: "uppercase", color: "var(--gold)", margin: 0, marginBottom: 3,
            }}>
              Basma Only Shop
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: "2px",
              color: "rgba(255,255,255,0.5)", margin: 0, fontStyle: "italic",
            }}>
              Lookbook 2026
            </p>
          </div>
          ) : <div />}

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "50%", width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white",
              WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            title={t("close")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Left click zone ── */}
        <div
          onClick={prev}
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "20%",
            zIndex: 10, cursor: idx > 0 ? "pointer" : "default",
          }}
        />
        {/* ── Right click zone ── */}
        <div
          onClick={next}
          style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "20%",
            zIndex: 10, cursor: idx < total - 1 ? "pointer" : "default",
          }}
        />

        {/* ── Arrow buttons ── */}
        {idx > 0 && (
          <button
            onClick={prev}
            style={{
              position: "absolute", left: isDesktop ? "calc(38% + 16px)" : "clamp(16px,3vw,40px)", top: "50%",
              transform: "translateY(-50%)",
              zIndex: 20, background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%", width: 52, height: 52,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white",
              WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,149,108,0.3)"; e.currentTarget.style.borderColor = "var(--gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          >
            <ArrowLeft />
          </button>
        )}
        {idx < total - 1 && (
          <button
            onClick={next}
            style={{
              position: "absolute", right: "clamp(16px,3vw,40px)", top: "50%",
              transform: "translateY(-50%)",
              zIndex: 20, background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%", width: 52, height: 52,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white",
              WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,149,108,0.3)"; e.currentTarget.style.borderColor = "var(--gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          >
            <ArrowRight />
          </button>
        )}

        {/* ── Bottom info (mobile/tablette uniquement) ── */}
        {!isDesktop && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
          padding: "0 clamp(20px,4vw,52px) 36px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          gap: 16,
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 0.38s ease, transform 0.38s ease",
        }}>
          {/* Article info */}
          <div style={{ animation: visible ? "fadeUp 0.7s ease 0.5s both" : "none" }}>
            <p style={{
              fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "3px",
              textTransform: "uppercase", color: "var(--gold)", marginBottom: 6,
            }}>
              {page.catId ? t(`cat_${page.catId}`) : page.category}
            </p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif", color: "white",
              fontSize: "clamp(22px,3.5vw,40px)", fontWeight: 400,
              letterSpacing: "-0.3px", lineHeight: 1.1, marginBottom: 10,
            }}>
              {displayName}
            </h2>
            <p style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", margin: 0 }}>
              <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 22, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.5px" }}>
                {page.price} ت.د
              </span>
              {hasPromo && (
                <>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 15, color: "rgba(255,255,255,0.5)", textDecoration: "line-through" }}>{origPrice} ت.د</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 700, color: "white", background: "#e0574a", padding: "3px 9px", borderRadius: 3 }}>-{Math.round((1 - page.price / origPrice) * 100)}%</span>
                </>
              )}
            </p>
          </div>

          {/* Page number + Commander */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16,
            flexShrink: 0,
            animation: visible ? "fadeUp 0.7s ease 0.6s both" : "none",
          }}>
            <span style={{
              fontFamily: "'Jost',sans-serif", fontSize: 13, letterSpacing: "3px",
              color: "rgba(255,255,255,0.45)",
            }}>
              {pageLabel}
            </span>
            <button
              onClick={openOrder}
              style={{
                padding: "11px 28px", fontSize: 11,
                background: "rgba(200,149,108,0.15)",
                border: "1px solid rgba(200,149,108,0.5)",
                color: "white", cursor: "pointer",
                fontFamily: "'Jost',sans-serif", letterSpacing: "2px", textTransform: "uppercase",
                WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.borderColor = "var(--gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(200,149,108,0.15)"; e.currentTarget.style.borderColor = "rgba(200,149,108,0.5)"; }}
            >
              {t("order")}
            </button>
          </div>
        </div>
        )}

        {/* ── Progress bar ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: "rgba(255,255,255,0.1)", zIndex: 21,
        }}>
          <div style={{
            height: "100%",
            background: "var(--gold)",
            width: `${((idx + 1) / total) * 100}%`,
            transition: "width 0.38s ease",
          }} />
        </div>

        {/* ── Page dots ── */}
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 21, display: "flex", gap: 6, alignItems: "center",
        }}>
          {PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === idx ? 20 : 6,
                height: 2,
                padding: 0, border: "none", cursor: "pointer",
                background: i === idx ? "var(--gold)" : "rgba(255,255,255,0.3)",
                borderRadius: 2,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Order modal (au-dessus du Lookbook : z plus élevé que le conteneur z3000) ── */}
      {orderProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 4000 }}>
          <OrderModal product={orderProduct} onClose={() => setOrderProduct(null)} />
        </div>
      )}
    </>
  );
}

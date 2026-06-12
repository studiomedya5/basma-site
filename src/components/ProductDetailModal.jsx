import { useState, useEffect } from "react";
import { productUrl } from "../lib/productKey";

const GOLD = "#C9A84C";
const DARK = "#2C2A20";
const CREAM = "#FAF9F6";

/* ─────────────────────────────────────────────────────────────
   Fenêtre détail produit (ouverte au clic sur une card).
   - Affiche la grande photo + toutes les couleurs dispo
   - Bouton "Copier le lien" → URL propre à coller dans Ads Manager
   - Sert aussi de page d'atterrissage pour les liens /produit/<clé>
   props:
     product : { catId, category, label, price, desc, sizes, photos, supabaseId }
     shareKey: clé partageable du produit ("set--set-groupe-5")
     onClose, onOrder, onAddToCart
───────────────────────────────────────────────────────────── */
export default function ProductDetailModal({ product, shareKey, onClose, onOrder, onAddToCart }) {
  const photos = product.photos ?? [];
  const hasColors = photos.length > 1;
  const sizes = product.sizes ?? [];

  const [colorIdx, setColorIdx] = useState(product.initialColorIdx ?? 0);
  const [size, setSize] = useState(sizes[0] ?? "TU");
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Gère l'URL : /produit/<clé> à l'ouverture, restaure à la fermeture
  useEffect(() => {
    if (!shareKey) return;
    const prev = window.location.pathname + window.location.search;
    const target = `/produit/${shareKey}`;
    if (prev !== target) window.history.pushState({ product: shareKey }, "", target);
    // Empêche le scroll du fond
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      // Restaure une URL propre quand on ferme
      if (window.location.pathname.startsWith("/produit/")) {
        window.history.pushState({}, "", "/");
      }
    };
  }, [shareKey]);

  // Ferme avec la touche Échap
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resolvePhoto = (p) => (p?.startsWith("http") ? p : `/photos/${product.catId}/${p}`);
  const activeSrc = resolvePhoto(photos[colorIdx] ?? photos[0]);

  const copyLink = async () => {
    const url = productUrl(shareKey);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback navigateurs anciens
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOrder = () => {
    onOrder({
      id: product.supabaseId,
      name: product.label,
      price: product.price,
      img: activeSrc,
      category: product.category,
      sizes,
      desc: product.desc,
      photos,
      catId: product.catId,
      initialColorIdx: colorIdx,
    });
  };

  const handleAddToCart = () => {
    onAddToCart({
      name: product.label,
      price: product.price,
      img: activeSrc,
      category: product.category,
      size,
      colorIdx,
      photos,
      catId: product.catId,
    });
  };

  const nextColor = () => setColorIdx((i) => (i + 1) % photos.length);
  const prevColor = () => setColorIdx((i) => (i - 1 + photos.length) % photos.length);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2300, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
      {/* Fond */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,14,8,0.6)", WebkitBackdropFilter: "blur(5px)", backdropFilter: "blur(5px)", animation: "fadeIn 0.25s ease" }} />

      <div style={{
        position: "relative",
        width: isMobile ? "100vw" : "min(940px,96vw)",
        maxHeight: isMobile ? "94dvh" : "92vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        background: "white",
        overflow: "hidden",
        boxShadow: "0 30px 90px rgba(0,0,0,0.3)",
        borderRadius: isMobile ? "20px 20px 0 0" : 0,
        animation: isMobile ? "fadeUp 0.34s cubic-bezier(0.22,1,0.36,1)" : "fadeUp 0.28s ease",
      }}>

        {/* ── Bouton fermer ── */}
        <button onClick={onClose} aria-label="Fermer" style={{
          position: "absolute", top: 14, right: 14, zIndex: 20,
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(255,255,255,0.9)", border: "1px solid rgba(44,42,32,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: DARK, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── Panneau photo ── */}
        <div style={{
          position: "relative",
          flex: isMobile ? "none" : "0 0 50%",
          height: isMobile ? 320 : "auto",
          background: "#1a1410", overflow: "hidden",
        }}>
          <img src={activeSrc} alt={product.label}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />

          {/* Flèches navigation couleurs */}
          {hasColors && (
            <>
              <button onClick={prevColor} aria-label="Couleur précédente" style={navArrow("left")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button onClick={nextColor} aria-label="Couleur suivante" style={navArrow("right")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {/* Compteur couleur */}
              <div style={{
                position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                background: "rgba(20,14,8,0.6)", color: "white", padding: "4px 12px", borderRadius: 50,
                fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "1px",
                WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)",
              }}>
                {colorIdx + 1} / {photos.length}
              </div>
            </>
          )}
        </div>

        {/* ── Panneau infos ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "22px 20px 32px" : "38px 34px" }}>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
            {product.category}
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 24 : 28, fontWeight: 500, color: DARK, lineHeight: 1.1, marginBottom: 10 }}>
            {product.label}
          </h2>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 600, color: GOLD, letterSpacing: "-0.5px" }}>
            {product.price}
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 400, marginLeft: 4 }}>ت.د</span>
          </span>

          <div style={{ height: 1, background: `linear-gradient(to right,${GOLD},transparent)`, margin: "18px 0", opacity: 0.35 }} />

          {product.desc && (
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, lineHeight: 1.7, color: "var(--text-muted,#777)", marginBottom: 20 }}>
              {product.desc}
            </p>
          )}

          {/* ── Couleurs disponibles ── */}
          {hasColors && (
            <div style={{ marginBottom: 20 }}>
              <p style={labelStyle}>Couleurs disponibles · {photos.length}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {photos.map((ph, i) => (
                  <button key={i} onClick={() => setColorIdx(i)} title={`Couleur ${i + 1}`}
                    style={{
                      width: 46, height: 46, padding: 0, borderRadius: 6, overflow: "hidden",
                      border: i === colorIdx ? `2.5px solid ${GOLD}` : "2px solid transparent",
                      outline: i === colorIdx ? `1px solid ${GOLD}` : "1px solid rgba(200,149,108,0.3)",
                      outlineOffset: 1, cursor: "pointer", background: "none", flexShrink: 0,
                      transform: i === colorIdx ? "scale(1.06)" : "scale(1)", transition: "all 0.15s",
                    }}>
                    <img src={resolvePhoto(ph)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Tailles ── */}
          {sizes.length > 1 && (
            <div style={{ marginBottom: 22 }}>
              <p style={labelStyle}>Taille</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} style={{
                    padding: "6px 14px", fontSize: 12, fontFamily: "'Jost',sans-serif", fontWeight: 500,
                    cursor: "pointer", borderRadius: 2, transition: "all 0.15s",
                    border: size === s ? `1.5px solid ${GOLD}` : "1.5px solid rgba(44,42,32,0.18)",
                    background: size === s ? GOLD : "transparent",
                    color: size === s ? "white" : DARK,
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Boutons commande ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={handleAddToCart} style={{
              flex: 1, padding: "13px 8px", fontSize: 12, background: "white", color: GOLD,
              border: `1.5px solid ${GOLD}`, cursor: "pointer", fontFamily: "'Jost',sans-serif",
              letterSpacing: "1px", textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>🛒</span> Panier
            </button>
            <button onClick={handleOrder} style={{
              flex: 1.4, padding: "13px 8px", fontSize: 12, background: DARK, color: GOLD,
              border: `1.5px solid ${DARK}`, cursor: "pointer", fontFamily: "'Jost',sans-serif",
              letterSpacing: "1.5px", textTransform: "uppercase",
            }}>
              Commander
            </button>
          </div>

          {/* ── Copier le lien (pour le sponsoring / Ads Manager) ── */}
          <button onClick={copyLink} style={{
            width: "100%", padding: "11px 8px", fontSize: 11,
            background: copied ? "rgba(46,125,50,0.08)" : CREAM,
            color: copied ? "#2e7d32" : "var(--text-muted,#777)",
            border: `1px dashed ${copied ? "#4caf50" : "rgba(200,149,108,0.5)"}`,
            cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: "1px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}>
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Lien copié !
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Copier le lien du produit
              </>
            )}
          </button>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#aaa", textAlign: "center", marginTop: 8, letterSpacing: "0.5px" }}>
            Lien à utiliser dans vos publicités Facebook / Instagram
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2.5px",
  textTransform: "uppercase", color: "rgba(201,168,76,0.72)", marginBottom: 9,
};

const navArrow = (side) => ({
  position: "absolute", top: "50%", [side]: 12, transform: "translateY(-50%)",
  width: 38, height: 38, borderRadius: "50%",
  background: "rgba(255,255,255,0.85)", border: "1px solid rgba(44,42,32,0.1)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: DARK, zIndex: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
});

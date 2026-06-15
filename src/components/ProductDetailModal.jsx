import { useState, useEffect, useRef } from "react";
import { fbTrack } from "../lib/pixel";

const GOLD = "#C9A84C";
const DARK = "#2C2A20";
const CREAM = "#FAF9F6";

// Lien Messenger vers la page Basma Only Shop
const MESSENGER_BASE = "https://m.me/basmaonlyshop";

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
  // Stock par couleur (variante) ; repli sur le stock global si absent
  const variants = Array.isArray(product.variants) ? product.variants.map(n => Number(n) || 0) : null;
  const colorStock = (i) => variants ? (variants[i] ?? 0) : (product.stock ?? 0);
  const allOut = variants ? variants.every(v => v <= 0) : product.stock === 0;
  const outOfStock = allOut;

  const [colorIdx, setColorIdx] = useState(product.initialColorIdx ?? 0);
  const [size, setSize] = useState(sizes[0] ?? "TU");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const curColorOut = colorStock(colorIdx) <= 0; // couleur sélectionnée épuisée

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Pixel : vue produit (étape du tunnel pour la campagne Vente)
  useEffect(() => {
    fbTrack("ViewContent", {
      content_name: product.label,
      content_category: product.category,
      content_type: "product",
      value: product.price,
    });
  }, [product.label, product.category, product.price]);

  // onClose à jour sans relancer l'effet d'historique à chaque rendu
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Gère l'URL /produit/<clé> + le bouton "précédent" (ferme la fenêtre)
  useEffect(() => {
    // Signale aux autres handlers que la fenêtre gère son propre retour
    window.__basmaModalOpen = true;
    const onPop = () => onCloseRef.current?.();
    window.addEventListener("popstate", onPop);

    if (shareKey) {
      const prev = window.location.pathname + window.location.search;
      const target = `/produit/${shareKey}`;
      if (prev !== target) window.history.pushState({ product: shareKey }, "", target);
    }
    // Empêche le scroll du fond
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.__basmaModalOpen = false;
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prevOverflow;
      // Restaure une URL propre si on ferme autrement que par "précédent"
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

  // Ouvre Messenger vers la page Basma (ref = produit pour le contexte côté page)
  const openMessenger = () => {
    const ref = `produit-${shareKey || ""}`.replace(/[^a-zA-Z0-9_-]/g, "");
    const url = ref ? `${MESSENGER_BASE}?ref=${ref}` : MESSENGER_BASE;
    window.open(url, "_blank", "noopener,noreferrer");
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
      variants: product.variants,
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
        maxHeight: isMobile ? "92dvh" : "92vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        background: "white",
        overflow: isMobile ? "auto" : "hidden",
        WebkitOverflowScrolling: "touch",
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
          height: "auto",
          aspectRatio: isMobile ? "3 / 4" : "auto",
          flexShrink: 0,
          background: "#1a1410", overflow: "hidden",
        }}>
          <img src={activeSrc} alt={product.label}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />

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
        <div style={{ flex: 1, overflowY: isMobile ? "visible" : "auto", padding: isMobile ? "20px 20px 30px" : "38px 34px" }}>
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
                {photos.map((ph, i) => {
                  const cOut = colorStock(i) <= 0;
                  return (
                  <button key={i} onClick={() => setColorIdx(i)} title={cOut ? `Couleur ${i + 1} — épuisée` : `Couleur ${i + 1}`}
                    style={{
                      width: 46, height: 46, padding: 0, borderRadius: 6, overflow: "hidden", position: "relative",
                      border: i === colorIdx ? `2.5px solid ${GOLD}` : "2px solid transparent",
                      outline: i === colorIdx ? `1px solid ${GOLD}` : "1px solid rgba(200,149,108,0.3)",
                      outlineOffset: 1, cursor: "pointer", background: "none", flexShrink: 0,
                      transform: i === colorIdx ? "scale(1.06)" : "scale(1)", transition: "all 0.15s",
                      opacity: cOut ? 0.45 : 1,
                    }}>
                    <img src={resolvePhoto(ph)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: cOut ? "grayscale(1)" : "none" }} />
                  </button>
                  );
                })}
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
          {outOfStock ? (
            <div style={{ marginBottom: 14 }}>
              <button disabled style={{
                width: "100%", padding: "14px 8px", fontSize: 12, background: "#ECEAE3", color: "#9a958a",
                border: "1.5px solid #ddd9cf", cursor: "not-allowed", fontFamily: "'Jost',sans-serif",
                letterSpacing: "1.5px", textTransform: "uppercase",
              }}>
                Rupture de stock
              </button>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999", textAlign: "center", marginTop: 8 }}>
                Cet article n'est plus disponible pour le moment.
              </p>
            </div>
          ) : curColorOut ? (
            <div style={{ marginBottom: 14 }}>
              <button disabled style={{
                width: "100%", padding: "14px 8px", fontSize: 12, background: "#ECEAE3", color: "#9a958a",
                border: "1.5px solid #ddd9cf", cursor: "not-allowed", fontFamily: "'Jost',sans-serif",
                letterSpacing: "1.5px", textTransform: "uppercase",
              }}>
                Couleur épuisée
              </button>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999", textAlign: "center", marginTop: 8 }}>
                Cette couleur est épuisée — choisissez-en une autre disponible.
              </p>
            </div>
          ) : (
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
          )}

          {/* ── Plus d'info — Envoyer un message sur Messenger (animé) ── */}
          <button onClick={openMessenger} style={{
            width: "100%", padding: "14px 8px", fontSize: 12,
            background: "linear-gradient(135deg, #00B2FF 0%, #006AFF 100%)", color: "white",
            border: "none", borderRadius: 6,
            cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: "1px", fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            animation: "msgBtnPulse 2.2s ease-in-out infinite",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.03.57.61.94 1.13.71l1.99-.88c.17-.07.36-.09.54-.04 1.03.28 2.12.43 3.27.43 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm6 7.46l-2.94 4.66c-.47.74-1.47.93-2.18.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.18-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63z" />
            </svg>
            Plus d'info — Envoyer un message
          </button>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: "#aaa", textAlign: "center", marginTop: 8, letterSpacing: "0.5px" }}>
            Une question ? Écrivez-nous sur Messenger
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

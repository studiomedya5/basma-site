import { useState, useEffect, useRef } from "react";
import { fbTrack } from "../lib/pixel";
import { normVariants } from "../lib/variants";
import { useLang } from "../context/LangContext";

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
  const { t, isAr } = useLang();
  const displayName = isAr && product.labelAr ? product.labelAr : product.label;
  const displayDesc = isAr && product.descAr ? product.descAr : product.desc;
  const photos = product.photos ?? [];
  const hasColors = photos.length > 1;
  const sizes = product.sizes ?? [];
  // Variante par couleur (stock + tailles dispo) ; repli sur le stock global si absent
  const variants = normVariants(product.variants, sizes);
  const colorStock = (i) => variants ? (variants[i]?.stock ?? 0) : (product.stock ?? 0);
  const colorSizes = (i) => variants ? (variants[i]?.sizes ?? sizes) : sizes; // tailles dispo pour cette couleur
  const allOut = variants ? variants.every(v => v.stock <= 0) : product.stock === 0;
  const outOfStock = allOut;

  const [colorIdx, setColorIdx] = useState(product.initialColorIdx ?? 0);
  const [size, setSize] = useState(sizes[0] ?? "TU");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [msgCopied, setMsgCopied] = useState(false);
  const curColorOut = colorStock(colorIdx) <= 0; // couleur sélectionnée épuisée

  // Si la taille choisie n'est plus dispo pour la nouvelle couleur, on bascule sur la 1re dispo
  useEffect(() => {
    const avail = colorSizes(colorIdx);
    if (avail.length && !avail.includes(size)) setSize(avail[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorIdx]);

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

  // Construit le message de commande à envoyer
  const buildOrderMessage = () => {
    const lines = [t("msg_greeting"), t("msg_want_order"), `👗 ${displayName}`];
    if (hasColors) lines.push(`🎨 ${t("color")} ${(colorIdx ?? 0) + 1}`);
    if (sizes.length > 1) lines.push(`📏 ${t("size")} ${size}`);
    lines.push(`💰 ${product.price} ت.د`);
    if (shareKey) lines.push(`🔗 ${window.location.origin}/produit/${shareKey}`);
    return lines.join("\n");
  };

  // Messenger ne permet pas de pré-remplir un message : on copie la commande
  // dans le presse-papier puis on ouvre Messenger (la cliente n'a qu'à coller).
  const openMessenger = async () => {
    const msg = buildOrderMessage();
    try { await navigator.clipboard.writeText(msg); setMsgCopied(true); setTimeout(() => setMsgCopied(false), 5000); } catch { /* ignore */ }
    const ref = `produit-${shareKey || ""}`.replace(/[^a-zA-Z0-9_-]/g, "");
    const url = ref ? `${MESSENGER_BASE}?ref=${ref}` : MESSENGER_BASE;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // WhatsApp : pré-remplit nativement le message (1 clic, la cliente envoie)
  const openWhatsApp = () => {
    const url = `https://wa.me/21696430850?text=${encodeURIComponent(buildOrderMessage())}`;
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
      initialSize: size,
      variants: product.variants,
      nameAr: product.labelAr,
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
            {displayName}
          </h2>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 600, color: GOLD, letterSpacing: "-0.5px" }}>
            {product.price}
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 400, marginLeft: 4 }}>ت.د</span>
          </span>

          <div style={{ height: 1, background: `linear-gradient(to right,${GOLD},transparent)`, margin: "18px 0", opacity: 0.35 }} />

          {displayDesc && (
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, lineHeight: 1.7, color: "var(--text-muted,#777)", marginBottom: 20, whiteSpace: "pre-line" }}>
              {displayDesc}
            </p>
          )}

          {/* ── Couleurs disponibles ── */}
          {hasColors && (
            <div style={{ marginBottom: 20 }}>
              <p style={labelStyle}>{t("available_colors")} · {photos.length}</p>
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

          {/* ── Tailles (grisées si non dispo pour la couleur choisie) ── */}
          {sizes.length > 1 && (
            <div style={{ marginBottom: 22 }}>
              <p style={labelStyle}>{t("size")}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sizes.map((s) => {
                  const avail = colorSizes(colorIdx).includes(s);
                  return (
                  <button key={s} disabled={!avail}
                    onClick={() => avail && setSize(s)}
                    title={avail ? undefined : t("size_unavailable")}
                    style={{
                    padding: "6px 14px", fontSize: 12, fontFamily: "'Jost',sans-serif", fontWeight: 500,
                    cursor: avail ? "pointer" : "not-allowed", borderRadius: 2, transition: "all 0.15s",
                    border: size === s && avail ? `1.5px solid ${GOLD}` : "1.5px solid rgba(44,42,32,0.18)",
                    background: size === s && avail ? GOLD : "transparent",
                    color: !avail ? "#ccc" : (size === s ? "white" : DARK),
                    textDecoration: avail ? "none" : "line-through",
                    opacity: avail ? 1 : 0.6,
                  }}>
                    {s}
                  </button>
                  );
                })}
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
                {t("out_of_stock")}
              </button>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999", textAlign: "center", marginTop: 8 }}>
                {t("product_unavailable")}
              </p>
            </div>
          ) : curColorOut ? (
            <div style={{ marginBottom: 14 }}>
              <button disabled style={{
                width: "100%", padding: "14px 8px", fontSize: 12, background: "#ECEAE3", color: "#9a958a",
                border: "1.5px solid #ddd9cf", cursor: "not-allowed", fontFamily: "'Jost',sans-serif",
                letterSpacing: "1.5px", textTransform: "uppercase",
              }}>
                {t("color_out")}
              </button>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999", textAlign: "center", marginTop: 8 }}>
                {t("color_out_hint")}
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
              <span style={{ fontSize: 14 }}>🛒</span> {t("cart")}
            </button>
            <button onClick={handleOrder} style={{
              flex: 1.4, padding: "13px 8px", fontSize: 12, background: DARK, color: GOLD,
              border: `1.5px solid ${DARK}`, cursor: "pointer", fontFamily: "'Jost',sans-serif",
              letterSpacing: "1.5px", textTransform: "uppercase",
            }}>
              {t("order")}
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
            {t("order_messenger")}
          </button>

          {/* Commander via WhatsApp (message pré-rempli automatiquement) */}
          <button onClick={openWhatsApp} style={{
            width: "100%", padding: "14px 8px", fontSize: 12, marginTop: 10,
            background: "#25D366", color: "white", border: "none", borderRadius: 6,
            cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: "1px", fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            animation: "waBtnPulse 2.2s ease-in-out infinite",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.05-1.32A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
            {t("order_whatsapp")}
          </button>

          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, color: msgCopied ? "#2e7d32" : "#aaa", textAlign: "center", marginTop: 8, letterSpacing: "0.5px", lineHeight: 1.5 }}>
            {msgCopied ? t("msg_copied") : t("msg_hint")}
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

// ============================================================
// Logique de commande — partagée entre :
//   - OrderModal        (commande depuis le panier / bouton Commander)
//   - CommandeInline    (formulaire intégré à la fiche produit)
//
// Tout ce qui touche à l'argent, au stock et à la base est ICI,
// une seule fois : validation, frais de livraison, code promo,
// enregistrement de la commande, email de confirmation.
// ============================================================

import { supabase } from "./supabase";

export const GOUVERNORATS = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine",
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine",
  "Tozeur", "Tunis", "Zaghouan",
];

export const DELIVERY_FEE = 8;
export const FREE_THRESHOLD = 100;

/** Sous-total, frais de livraison et total. */
export function calculerTotaux({ price, qty = 1, promoApplied = null }) {
  const subtotal = Number(price || 0) * Number(qty || 1);
  const deliveryFee = (subtotal >= FREE_THRESHOLD || promoApplied) ? 0 : DELIVERY_FEE;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

/** Champs obligatoires. Renvoie { champ: message } — vide si tout est bon. */
export function validerCommande(form, { hasColors, colorIdx, colorEpuisee }, t) {
  const e = {};
  if (hasColors && (colorIdx === null || colorIdx === undefined)) e.color = t("required");
  else if (colorEpuisee) e.color = t("color_out");
  if (!form.nom?.trim()) e.nom = t("required");
  if (!form.telephone?.trim()) e.telephone = t("required");
  if (!form.adresse?.trim()) e.adresse = t("required");
  if (!form.gouvernorat) e.gouvernorat = t("required");
  if (!form.delegation) e.delegation = t("required");
  return e;
}

/**
 * Vérifie un code promo côté serveur (fonction SECURITY DEFINER).
 * La table promo_codes n'est pas exposée au public.
 */
export async function verifierPromo(code, phone = null) {
  const c = (code || "").trim().toUpperCase();
  if (!c) return { valid: false, reason: "empty" };
  const { data } = await supabase.rpc("validate_promo_code", { p_code: c, p_phone: phone });
  return data || { valid: false, reason: "invalid" };
}

/**
 * Enregistre la commande.
 * @returns {Promise<{ok:true} | {ok:false, motif:"promo"|"base", raison?:string}>}
 */
export async function envoyerCommande({
  product, form, colorIdx, hasColors, variants, promoApplied, totalPrice, activeImg,
}) {
  // 1. Le code promo est revalidé au dernier moment (existe, actif, non expiré,
  //    pas déjà utilisé par ce numéro) — on ne fait jamais confiance au client.
  if (promoApplied) {
    const chk = await verifierPromo(promoApplied, form.telephone?.trim());
    if (!chk.valid) return { ok: false, motif: "promo", raison: chk.reason };
  }

  const orderData = {
    product_id: product.id ?? null,
    product_name: product.name,
    size: form.size,
    quantity: form.qty,
    total_price: totalPrice,
    customer_name: form.nom,
    customer_phone: form.telephone,
    address: form.adresse,
    governorate: form.gouvernorat,
    delegation: form.delegation,
    status: "en_attente",
  };
  if (form.email?.trim()) orderData.customer_email = form.email.trim();
  if (promoApplied) orderData.promo_code = promoApplied;
  if (hasColors || variants) {
    orderData.color_index = colorIdx ?? 0;
    orderData.color_label = `Couleur ${(colorIdx ?? 0) + 1}`;
  }

  // 2. Insertion, avec repli : si une colonne optionnelle n'existe pas encore
  //    dans le schéma, on la retire et on réessaie.
  let { error } = await supabase.from("orders").insert(orderData);
  let tries = 0;
  while (error && tries < 4) {
    const msg = error.message || "";
    let stripped = false;
    for (const col of ["delegation", "customer_email", "color_index", "color_label", "promo_code"]) {
      if (msg.includes(col) && col in orderData) { delete orderData[col]; stripped = true; }
    }
    if (!stripped) break;
    ({ error } = await supabase.from("orders").insert(orderData));
    tries++;
  }
  if (error) {
    console.error("[commande]", error);
    return { ok: false, motif: "base", raison: error.message };
  }

  // 3. Email de confirmation (best effort : une commande enregistrée reste
  //    valable même si l'email échoue).
  // NB : l'événement Purchase n'est PAS déclenché ici. En paiement à la
  // livraison, la source unique est la Conversions API serveur, au passage
  // de la commande en « confirmée » (dédupliqué/idempotent).
  const img = /^https?:/.test(activeImg || "") ? activeImg : `https://basmaonlyshop.tn${activeImg}`;
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      customer_name: form.nom,
      customer_phone: form.telephone,
      customer_email: form.email || null,
      product_name: product.name,
      product_image: img,
      product_price: product.price,
      size: form.size,
      quantity: form.qty,
      total_price: totalPrice,
      address: form.adresse,
      governorate: form.gouvernorat,
      delegation: form.delegation,
      color_label: hasColors ? `Couleur ${(colorIdx ?? 0) + 1}` : "—",
    }),
  }).catch(() => {});

  return { ok: true };
}

/** Message WhatsApp pré-rempli — filet de sécurité si la base ne répond pas. */
export function lienWhatsappCommande({ product, form, colorIdx, hasColors, totalPrice, numero = "21629930212" }) {
  const l = [
    "Bonjour Basma, je souhaite commander :",
    `• Article : ${product?.name || ""}`,
    form.size ? `• Taille : ${form.size}` : null,
    hasColors ? `• Couleur : ${(colorIdx ?? 0) + 1}` : null,
    `• Quantité : ${form.qty}`,
    `• Total : ${totalPrice} DT`,
    "",
    `Nom : ${form.nom}`,
    `Téléphone : ${form.telephone}`,
    `Adresse : ${form.adresse}, ${form.delegation} (${form.gouvernorat})`,
  ].filter(Boolean).join(String.fromCharCode(10));
  return `https://wa.me/${numero}?text=${encodeURIComponent(l)}`;
}

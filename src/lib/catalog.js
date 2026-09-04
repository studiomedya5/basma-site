// ============================================================
// Chargement du catalogue — avec mode SECOURS
//
// Problème vécu : quand Supabase est indisponible (quota dépassé,
// projet en pause, incident), le site affichait une boutique VIDE.
// Pendant une campagne de pub Facebook, c'est de l'argent perdu.
//
// Solution : à chaque build réussi, scripts/prerender-products.mjs
// écrit un instantané du catalogue dans public/catalogue.json.
// Si Supabase ne répond pas, on sert cet instantané depuis le CDN
// Cloudflare : la cliente voit les produits et peut commander par
// WhatsApp (voir OrderModal).
// ============================================================

import { supabase } from "./supabase";
import { photoUrls } from "./images";

const SECOURS_URL = "/catalogue.json";

let secoursPromise = null;

function chargerSecours() {
  if (!secoursPromise) {
    secoursPromise = fetch(SECOURS_URL, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => (Array.isArray(j) ? j : j?.produits || []))
      .catch(() => []);
  }
  return secoursPromise;
}

// Uniformise un produit : photos passées par le CDN, valeurs par défaut
function normaliser(p) {
  return {
    ...p,
    images: photoUrls(p.images),
    oldPrice: p.oldPrice ?? p.old_price ?? null,
    sizes: p.sizes ?? ["S", "M", "L", "XL"],
  };
}

function trier(liste, order) {
  const l = [...liste];
  if (order === "created_desc") {
    l.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  } else {
    l.sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
  }
  return l;
}

/** true dès qu'un chargement est passé par l'instantané de secours. */
export function enModeSecours() {
  return typeof window !== "undefined" && window.__basmaSecours === true;
}

/**
 * Charge les produits.
 * @returns {Promise<{produits: Array, secours: boolean}>}
 */
export async function chargerProduits({
  category = null,
  activesSeulement = false,
  order = "id",
} = {}) {
  try {
    let q = supabase.from("products").select("*");
    if (category) q = q.eq("category", category);
    if (activesSeulement) q = q.eq("is_active", true);
    q = order === "created_desc"
      ? q.order("created_at", { ascending: false })
      : q.order("id", { ascending: true });

    // Garde-fou : si Supabase met plus de 7 s a repondre (projet en pause,
    // incident reseau), on n'attend pas — la cliente venue d'une pub part
    // au bout de 3 s. On bascule directement sur l'instantane.
    const { data, error } = await Promise.race([
      q,
      new Promise((_, rej) => setTimeout(() => rej(new Error("delai depasse")), 7000)),
    ]);
    if (error) throw error;
    if (Array.isArray(data)) {
      return { produits: data.map(normaliser), secours: false };
    }
    throw new Error("réponse vide");
  } catch (e) {
    console.warn("[catalogue] Supabase indisponible, passage en mode secours :", e?.message || e);
  }

  // ── Mode secours : instantané servi par Cloudflare ──
  let liste = await chargerSecours();
  if (category) liste = liste.filter((p) => p.category === category);
  if (activesSeulement) liste = liste.filter((p) => p.is_active !== false);
  if (liste.length && typeof window !== "undefined") window.__basmaSecours = true;
  return { produits: trier(liste, order).map(normaliser), secours: true };
}

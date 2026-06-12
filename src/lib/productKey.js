// ─── Clés produit pour les liens partageables (sponsoring Facebook) ───
// Chaque produit a une clé stable de la forme "{catId}--{slug}" (produit
// statique) ou "{catId}--sb-{id}" (produit Supabase). Cette clé sert d'URL
// propre : https://basmaonlyshop.tn/produit/{clé}

// Slugifie un libellé : minuscules, sans accents, tirets
export const slugify = (str) =>
  (str || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Génère la clé stable d'un produit (groupe)
export const makeProductKey = (catId, group) =>
  group?.supabaseId != null
    ? `${catId}--sb-${group.supabaseId}`
    : `${catId}--${slugify(group?.label)}`;

// Extrait l'identifiant de catégorie depuis une clé
export const catIdFromKey = (key) => (key || "").split("--")[0];

// URL absolue partageable (à coller dans Ads Manager)
export const productUrl = (key) =>
  `${window.location.origin}/produit/${key}`;

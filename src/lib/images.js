// ============================================================
// Images produits — passage par le CDN Cloudflare
//
// Les photos sont stockées dans Supabase Storage, mais la bande
// passante Supabase est limitée (et la boutique l'a déjà saturée).
// On réécrit donc chaque URL Supabase vers /img/<fichier>, servi
// par la Cloudflare Pages Function functions/img/[[path]].js :
//   -> mise en cache edge illimitée + copie automatique dans R2
//   -> la bande passante Supabase tombe quasiment à zéro
//
// En développement local (vite dev) les Functions n'existent pas :
// on garde l'URL Supabase d'origine.
// ============================================================

const SUPABASE_STORAGE_RE =
  /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i;

// Le proxy n'est disponible que sur un déploiement Cloudflare Pages
function proxyDisponible() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h.endsWith("basmaonlyshop.tn") || h.endsWith(".pages.dev");
}

/**
 * Renvoie l'URL à utiliser dans un <img src=...>.
 * - URL Supabase  -> /img/<fichier>  (CDN Cloudflare)
 * - autre URL     -> inchangée (/photos/..., /images/..., data:, blob:)
 */
export function photoUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!proxyDisponible()) return url;
  const m = url.match(SUPABASE_STORAGE_RE);
  if (!m) return url;
  // m[1] = bucket (products), m[2] = chemin du fichier
  return "/img/" + m[2].split("/").map(decodeURIComponent).map(encodeURIComponent).join("/");
}

/** Idem pour un tableau de photos. */
export function photoUrls(list) {
  return Array.isArray(list) ? list.map(photoUrl) : [];
}

/** Nom du fichier dans le bucket, depuis une URL Supabase ou /img/. */
export function photoPath(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(SUPABASE_STORAGE_RE);
  if (m) return m[2];
  if (url.startsWith("/img/")) return url.slice(5);
  return null;
}

/**
 * Filet de sécurité : si /img/ ne répond pas correctement (Function pas
 * encore déployée, R2 mal configuré...), la photo retombe automatiquement
 * sur son URL Supabase d'origine. Le site ne peut donc jamais se retrouver
 * sans photos à cause du proxy.
 * Appelé une seule fois au démarrage (main.jsx).
 */
export function installerFallbackImages() {
  if (typeof window === "undefined") return;
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return;
  window.addEventListener("error", (e) => {
    const el = e.target;
    if (!el || el.tagName !== "IMG" || el.dataset.fallbackFait) return;
    const src = el.getAttribute("src") || "";
    if (!src.startsWith("/img/")) return;
    el.dataset.fallbackFait = "1";
    el.src = `${base}/storage/v1/object/public/products/${src.slice(5)}`;
  }, true); // capture : les erreurs sur <img> ne remontent pas autrement
}

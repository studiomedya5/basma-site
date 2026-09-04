// ============================================================
// Proxy images — Cloudflare Pages Function
//
// Objectif : ne PLUS servir les photos produits directement depuis
// Supabase (bande passante limitée + facturée) mais depuis le CDN
// Cloudflare, gratuit et illimité.
//
// URL publique : https://basmaonlyshop.tn/img/<nom-du-fichier.jpg>
//
// Ordre de résolution :
//   1. Cache edge Cloudflare (le plus rapide, coût zéro)
//   2. Bucket R2 (si la liaison IMAGES est configurée) -> egress gratuit
//   3. Supabase Storage (origine historique) + copie automatique dans R2
//      => migration progressive : chaque photo n'est lue qu'UNE fois
//         depuis Supabase, ensuite elle vit dans Cloudflare.
//
// Variables d'environnement (Cloudflare Pages > Settings > Variables) :
//   IMG_ORIGIN  (optionnel) base des photos Supabase, sans slash final
// Liaison R2 (Cloudflare Pages > Settings > Functions > R2 bindings) :
//   Nom de la variable : IMAGES   ->   bucket : basma-images
// ============================================================

const DEFAULT_ORIGIN =
  "https://tpvumzwkekuyrggllffj.supabase.co/storage/v1/object/public/products";

// 1 an de cache navigateur : les noms de fichiers sont uniques (timestamp)
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const TYPES = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif", gif: "image/gif", svg: "image/svg+xml",
};

const contentType = (path) =>
  TYPES[(path.split(".").pop() || "").toLowerCase()] || "application/octet-stream";

export async function onRequestGet(context) {
  const { request, params, env, waitUntil } = context;

  // Chemin demandé : /img/1750-abc.jpg -> "1750-abc.jpg"
  const path = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
  if (!path || path.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  // ── 1. Cache edge ───────────────────────────────────────────
  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).origin + "/img/" + path, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const headers = {
    "Content-Type": contentType(path),
    "Cache-Control": CACHE_CONTROL,
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  };

  // ── 2. R2 (si configuré) ────────────────────────────────────
  if (env.IMAGES) {
    const obj = await env.IMAGES.get(path);
    if (obj) {
      const res = new Response(obj.body, {
        headers: { ...headers, "X-Img-Source": "r2" },
      });
      waitUntil(cache.put(cacheKey, res.clone()));
      return res;
    }
  }

  // ── 3. Supabase (origine) + copie dans R2 ───────────────────
  const origin = (env.IMG_ORIGIN || DEFAULT_ORIGIN).replace(/\/+$/, "");
  let upstream;
  try {
    upstream = await fetch(`${origin}/${encodeURIComponent(path)}`, {
      cf: { cacheTtl: 31536000, cacheEverything: true },
    });
  } catch (_) {
    return new Response("Image indisponible", { status: 502 });
  }
  if (!upstream.ok) {
    return new Response("Image introuvable", { status: upstream.status === 404 ? 404 : 502 });
  }

  const buf = await upstream.arrayBuffer();

  // Copie vers R2 pour ne plus jamais repasser par Supabase
  if (env.IMAGES) {
    waitUntil(
      env.IMAGES.put(path, buf, {
        httpMetadata: { contentType: headers["Content-Type"], cacheControl: CACHE_CONTROL },
      }).catch(() => {})
    );
  }

  const res = new Response(buf, { headers: { ...headers, "X-Img-Source": "supabase" } });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

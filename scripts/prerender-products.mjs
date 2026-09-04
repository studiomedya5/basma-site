// ============================================================
// Pré-génération des pages produits pour le partage social.
// Les robots de WhatsApp/Facebook ne lisent PAS le JavaScript :
// on génère donc, pour chaque produit, une page HTML statique
// avec les bonnes balises Open Graph (photo + nom du produit).
//
// Lancé automatiquement après "vite build" (voir package.json).
// Génère :
//   dist/produit/<clé>/index.html   -> page SPA + OG produit (liens existants, pubs FB)
//   dist/<slug>/index.html          -> jolie URL avec le nom, redirige vers la fiche
// ============================================================

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
const PUBLIC = join(__dirname, "..", "public");
const ORIGIN = "https://basmaonlyshop.tn";

// Clés Supabase (publiques — déjà présentes dans le bundle client)
const SUPABASE_URL = "https://tpvumzwkekuyrggllffj.supabase.co";
const SUPABASE_KEY = "sb_publishable_F1xoahP24AUPBtHvZs3TpQ_fwQzsMLR";

// Correspondance libellé catégorie (en base) -> id catégorie (dans les URLs)
const CAT_ID = {
  "Abaya": "3ibaya", "Écharpe": "echarpe", "Jiba": "jiba", "Kids": "kids",
  "Manteau": "manteau", "Burkini": "MDB", "Pyjama": "pyjama", "Robe": "Robe",
  "Sac": "Sac", "Set": "set",
  "Accessoires": "accessoires", "Cosmétique": "cosmetique", "Pack's": "pack",
};

// Réécrit une URL Supabase Storage vers le CDN Cloudflare (/img/<fichier>).
// Les robots Facebook/WhatsApp iront chercher la photo sur Cloudflare :
// bande passante Supabase économisée + photo servie même si Supabase tombe.
const cdn = (url) => {
  const m = /supabase\.co\/storage\/v1\/object\/public\/[^/]+\/(.+)$/.exec(url || "");
  return m ? `${ORIGIN}/img/${m[1]}` : url;
};

const slugify = (s) => (s || "")
  .toString().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Échappe une valeur destinée à un attribut HTML
const esc = (s) => (s || "").toString()
  .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\s+/g, " ").trim();

// Remplace le content="" d'une balise meta (og: ou twitter:) ciblée
function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  return html.replace(re, `$1${esc(value)}$2`);
}

async function main() {
  // 1. Récupère les produits actifs
  // ── Empreinte de la version deployee ──
  // Permet de verifier depuis l'exterieur QUELLE version est reellement en
  // ligne (Cloudflare fournit CF_PAGES_COMMIT_SHA pendant ses builds).
  const version = {
    build: new Date().toISOString(),
    commit: (process.env.CF_PAGES_COMMIT_SHA || "local").slice(0, 7),
    branche: process.env.CF_PAGES_BRANCH || "local",
  };
  await writeFile(join(DIST, "version.json"), JSON.stringify(version), "utf8");
  console.log(`[prerender] version : ${version.commit} (${version.build})`);

  let products = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (res.ok) products = await res.json();
    else console.warn(`[prerender] Supabase a répondu ${res.status}.`);
  } catch (e) {
    console.warn(`[prerender] Supabase injoignable : ${e.message}`);
  }

  // ── Instantané du catalogue (mode secours du site) ──
  // Si Supabase répond : on rafraîchit public/catalogue.json (versionné dans git)
  // Sinon : on réutilise le dernier instantané connu, le site reste vivant.
  if (Array.isArray(products) && products.length) {
    const json = JSON.stringify(products);
    await writeFile(join(PUBLIC, "catalogue.json"), json, "utf8");
    await writeFile(join(DIST, "catalogue.json"), json, "utf8");
    console.log(`[prerender] instantané catalogue : ${products.length} produit(s).`);
  } else {
    try {
      await copyFile(join(PUBLIC, "catalogue.json"), join(DIST, "catalogue.json"));
      const old = JSON.parse(await readFile(join(PUBLIC, "catalogue.json"), "utf8"));
      console.warn(`[prerender] ancien instantané conservé (${old.length} produit(s)).`);
      products = old;
    } catch (_) {
      console.warn("[prerender] aucun instantané disponible — pages produits non générées.");
      return;
    }
  }

  // 2. Lit le template index.html généré par Vite
  const template = await readFile(join(DIST, "index.html"), "utf8");

  let count = 0;
  for (const p of products) {
    const catId = CAT_ID[p.category];
    const image = Array.isArray(p.images) ? cdn(p.images[0]) : null;
    if (!catId || !image) continue; // catégorie inconnue ou pas de photo -> on saute

    const key = `${catId}--sb-${p.id}`;
    const slug = slugify(p.name);
    const title = `${p.name} — Basma Only Shop`;
    const desc = (p.description || "Découvrez cet article élégant sur Basma Only Shop. Livraison partout en Tunisie.")
      .replace(/\s+/g, " ").trim().slice(0, 200);
    const ficheUrl = `${ORIGIN}/produit/${key}`;
    const prettyUrl = `${ORIGIN}/${slug}`;

    // ── Page SPA avec OG produit (URL /produit/<clé>) ──
    let page = template;
    page = setMeta(page, "property", "og:type", "product");
    page = setMeta(page, "property", "og:title", title);
    page = setMeta(page, "property", "og:description", desc);
    page = setMeta(page, "property", "og:image", image);
    page = setMeta(page, "property", "og:url", ficheUrl);
    page = setMeta(page, "name", "twitter:title", title);
    page = setMeta(page, "name", "twitter:description", desc);
    page = setMeta(page, "name", "twitter:image", image);
    page = page.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    page = setMeta(page, "name", "description", desc);
    page = page.replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${esc(ficheUrl)}" />`
    );
    await mkdir(join(DIST, "produit", key), { recursive: true });
    await writeFile(join(DIST, "produit", key, "index.html"), page, "utf8");

    // ── Jolie URL /<slug> : OG produit + redirection vers la fiche ──
    const pretty = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(prettyUrl)}" />
<meta property="og:site_name" content="Basma Only Shop" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(image)}" />
<link rel="canonical" href="${esc(ficheUrl)}" />
<meta http-equiv="refresh" content="0;url=/produit/${esc(key)}" />
<script>location.replace("/produit/${key}");</script>
</head>
<body>Redirection vers l'article…</body>
</html>`;
    await mkdir(join(DIST, slug), { recursive: true });
    await writeFile(join(DIST, slug, "index.html"), pretty, "utf8");
    count++;
  }

  console.log(`[prerender] ${count} page(s) produit générée(s) (OG photo + nom).`);
}

main().catch((e) => { console.error("[prerender] erreur :", e); });

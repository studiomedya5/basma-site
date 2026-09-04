// ============================================================
// Préchauffage des photos vers Cloudflare (R2 + cache edge)
//
// À quoi ça sert :
// La Pages Function /img/<fichier> copie automatiquement dans R2
// chaque photo qu'on lui demande. Ce script demande TOUTES les
// photos du catalogue une par une : en une passe, l'intégralité
// de la boutique est copiée chez Cloudflare.
//
// Résultat :
//   - la bande passante Supabase retombe à zéro ;
//   - si Supabase tombe (ou est supprimé), les photos restent en ligne.
//
// Utilisation :
//   node scripts/prechauffer-images.mjs
//   node scripts/prechauffer-images.mjs https://basma-site.pages.dev
// ============================================================

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = (process.argv[2] || "https://basmaonlyshop.tn").replace(/\/+$/, "");

const SUPABASE_URL = "https://tpvumzwkekuyrggllffj.supabase.co";
const SUPABASE_KEY = "sb_publishable_F1xoahP24AUPBtHvZs3TpQ_fwQzsMLR";

// Nom du fichier dans le bucket, depuis une URL Supabase ou /img/
const cheminPhoto = (url) => {
  const m = /supabase\.co\/storage\/v1\/object\/public\/[^/]+\/(.+)$/.exec(url || "");
  if (m) return m[1];
  if ((url || "").startsWith("/img/")) return url.slice(5);
  return null;
};

async function listerPhotos() {
  // 1) On essaie Supabase (source de vérité)
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products?select=images`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (r.ok) {
      const rows = await r.json();
      const l = rows.flatMap((p) => p.images || []).map(cheminPhoto).filter(Boolean);
      if (l.length) return [...new Set(l)];
    }
  } catch (_) { /* on tente l'instantané */ }

  // 2) Sinon : l'instantané du catalogue versionné dans le dépôt
  const snap = JSON.parse(await readFile(join(__dirname, "..", "public", "catalogue.json"), "utf8"));
  return [...new Set(snap.flatMap((p) => p.images || []).map(cheminPhoto).filter(Boolean))];
}

async function main() {
  const photos = await listerPhotos();
  if (!photos.length) {
    console.error("Aucune photo trouvée (Supabase injoignable et instantané vide).");
    process.exit(1);
  }
  console.log(`${photos.length} photo(s) à préchauffer sur ${SITE} …`);

  let ok = 0, deja = 0, ko = 0;
  const lot = 6; // 6 requêtes en parallèle : suffisant, sans saturer
  for (let i = 0; i < photos.length; i += lot) {
    await Promise.all(photos.slice(i, i + lot).map(async (p) => {
      try {
        const r = await fetch(`${SITE}/img/${encodeURIComponent(p)}`);
        if (!r.ok) { ko++; console.warn(`  ✕ ${p} (${r.status})`); return; }
        await r.arrayBuffer();
        const src = r.headers.get("x-img-source");
        if (src === "r2") deja++; else ok++;
      } catch (e) {
        ko++; console.warn(`  ✕ ${p} (${e.message})`);
      }
    }));
    process.stdout.write(`\r  ${Math.min(i + lot, photos.length)}/${photos.length}`);
  }

  console.log(`\nTerminé : ${ok} copiée(s) vers Cloudflare, ${deja} déjà présente(s), ${ko} en erreur.`);
  if (ko) process.exitCode = 1;
}

main().catch((e) => { console.error("Erreur :", e); process.exit(1); });

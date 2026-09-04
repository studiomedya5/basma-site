// ============================================================
// Onglet « Santé » du back office
//
// Le tableau de bord à ouvrir AVANT de lancer une pub Facebook :
// il vérifie en un coup d'œil que la boutique est prête à vendre.
//
//   1. La base de données répond-elle ?
//   2. Les photos passent-elles bien par le CDN Cloudflare ?
//   3. Combien pèse le stockage des photos (quota Supabase) ?
//   4. Articles en ligne sans photo / en rupture / stock faible
//   5. Photos orphelines (plus utilisées) -> nettoyage en 1 clic
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { photoPath } from "../lib/images";

const GOLD = "#C9A84C";
const DARK = "#2C2A20";
const BUCKET = "products";
const QUOTA_MO = 1024; // offre gratuite Supabase : 1 Go de stockage

const jost = { fontFamily: "'Jost',sans-serif" };
const card = {
  background: "white", border: "1px solid #EDE8E0", borderRadius: 8,
  padding: 16, marginBottom: 14,
};

const mo = (octets) => (octets / 1048576).toFixed(1) + " Mo";

function Ligne({ etat, titre, detail, action }) {
  const couleurs = { ok: "#2E7D32", warn: "#B8860B", ko: "#C62828", info: "#777" };
  const icones = { ok: "✓", warn: "!", ko: "✕", info: "•" };
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0",
      borderBottom: "1px solid #F2EEE6",
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: couleurs[etat] + "1A", color: couleurs[etat],
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, ...jost,
      }}>{icones[etat]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...jost, fontSize: 13, color: DARK, fontWeight: 500 }}>{titre}</div>
        {detail && <div style={{ ...jost, fontSize: 12, color: "#999", marginTop: 2 }}>{detail}</div>}
      </div>
      {action}
    </div>
  );
}

const btn = {
  ...jost, fontSize: 11, padding: "7px 12px", borderRadius: 6, cursor: "pointer",
  border: "1px solid " + GOLD, background: "white", color: GOLD,
  whiteSpace: "nowrap", flexShrink: 0,
};

export default function AdminSante({ isMobile }) {
  const [chargement, setChargement] = useState(true);
  const [produits, setProduits] = useState([]);
  const [erreurBase, setErreurBase] = useState(null);
  const [cdn, setCdn] = useState(null);        // { ok, source }
  const [stockage, setStockage] = useState(null); // { fichiers, octets, orphelins[] }
  const [message, setMessage] = useState(null);
  const [occupe, setOccupe] = useState(false);

  const analyser = useCallback(async () => {
    setChargement(true);
    setMessage(null);

    // 1. Base de données
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, images, stock, is_active, variants");
    setErreurBase(error ? (error.message || "erreur inconnue") : null);
    const liste = data || [];
    setProduits(liste);

    // 2. CDN Cloudflare : on demande la première photo via /img/ et on lit
    //    l'en-tête X-Img-Source (r2 = déjà migrée, supabase = première lecture)
    const premiere = liste.flatMap((p) => p.images || []).find(Boolean);
    const chemin = photoPath(premiere);
    if (chemin) {
      try {
        const r = await fetch("/img/" + chemin, { method: "GET", cache: "no-store" });
        // On vérifie que c'est bien une image : si la Function n'est pas routée,
        // Cloudflare renverrait index.html avec un code 200 trompeur.
        const type = r.headers.get("Content-Type") || "";
        setCdn({
          ok: r.ok && type.startsWith("image/"),
          source: r.headers.get("X-Img-Source") || "cache",
        });
      } catch (_) {
        setCdn({ ok: false, source: null });
      }
    } else {
      setCdn(null);
    }

    // 3 + 5. Stockage : poids total et fichiers orphelins
    try {
      let page = 0, tous = [];
      while (page < 20) {
        const { data: f, error: e } = await supabase.storage.from(BUCKET)
          .list("", { limit: 100, offset: page * 100, sortBy: { column: "name", order: "asc" } });
        if (e || !f || !f.length) break;
        tous = tous.concat(f);
        if (f.length < 100) break;
        page++;
      }
      const utilises = new Set(
        liste.flatMap((p) => p.images || []).map(photoPath).filter(Boolean)
      );
      const octets = tous.reduce((s, f) => s + (f.metadata?.size || 0), 0);
      const orphelins = tous.filter((f) => !utilises.has(f.name));
      setStockage({ fichiers: tous.length, octets, orphelins });
    } catch (_) {
      setStockage(null);
    }

    setChargement(false);
  }, []);

  useEffect(() => { analyser(); }, [analyser]);

  // Stock réel d'un produit : somme des variantes si elles existent
  const stockReel = (p) => Array.isArray(p.variants) && p.variants.length
    ? p.variants.reduce((s, v) => s + (Number(v?.stock) || 0), 0)
    : Number(p.stock || 0);

  const actifs      = produits.filter((p) => p.is_active);
  const sansPhoto   = actifs.filter((p) => !Array.isArray(p.images) || !p.images.length);
  const ruptures    = actifs.filter((p) => stockReel(p) <= 0);
  const stockFaible = actifs.filter((p) => stockReel(p) > 0 && stockReel(p) <= 3);

  // Retire de la vitrine les articles en rupture : on ne paie pas de la pub
  // pour envoyer les clientes vers un article qu'on ne peut pas livrer.
  const desactiverRuptures = async () => {
    if (!ruptures.length || occupe) return;
    if (!window.confirm("Retirer " + ruptures.length + " article(s) en rupture de la boutique ?")) return;
    setOccupe(true);
    const { error } = await supabase.from("products")
      .update({ is_active: false })
      .in("id", ruptures.map((p) => p.id));
    setMessage(error ? "Échec : " + error.message : ruptures.length + " article(s) retiré(s) de la vitrine.");
    setOccupe(false);
    analyser();
  };

  const supprimerOrphelins = async () => {
    const orph = stockage?.orphelins || [];
    if (!orph.length || occupe) return;
    const poids = orph.reduce((s, f) => s + (f.metadata?.size || 0), 0);
    if (!window.confirm(
      "Supprimer définitivement " + orph.length + " photo(s) inutilisée(s) (" + mo(poids) + ") ?\n\n" +
      "Ces fichiers ne sont liés à aucun article."
    )) return;
    setOccupe(true);
    const { error } = await supabase.storage.from(BUCKET).remove(orph.map((f) => f.name));
    setMessage(error ? "Échec : " + error.message : orph.length + " photo(s) supprimée(s), " + mo(poids) + " libérés.");
    setOccupe(false);
    analyser();
  };

  const poidsMoyen = stockage && stockage.fichiers
    ? stockage.octets / stockage.fichiers : 0;
  const pourcentQuota = stockage ? (stockage.octets / 1048576 / QUOTA_MO) * 100 : 0;

  const titre = {
    ...jost, fontSize: 13, color: DARK, margin: "0 0 6px",
    letterSpacing: "1px", textTransform: "uppercase",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <h2 style={{ ...jost, fontSize: 15, color: DARK, margin: 0 }}>
          Prêt à lancer la pub ?
        </h2>
        <div style={{ flex: 1 }} />
        <button onClick={analyser} disabled={chargement} style={{
          ...btn, background: DARK, color: GOLD, borderColor: DARK,
          opacity: chargement ? 0.6 : 1,
        }}>{chargement ? "Analyse…" : "Relancer l'analyse"}</button>
      </div>

      {message && (
        <div style={{
          ...jost, fontSize: 12, padding: "10px 14px", borderRadius: 6, marginBottom: 14,
          background: "#F5F1E8", color: DARK, border: "1px solid " + GOLD,
        }}>{message}</div>
      )}

      {/* ── Vérifications ── */}
      <div style={card}>
        <h3 style={titre}>Vérifications</h3>

        <Ligne
          etat={erreurBase ? "ko" : "ok"}
          titre={erreurBase ? "Base de données injoignable" : "Base de données : OK"}
          detail={erreurBase
            ? erreurBase + " — les clientes ne peuvent PAS commander. Vérifiez le projet sur supabase.com."
            : produits.length + " article(s) en base, " + actifs.length + " en ligne."}
        />

        <Ligne
          etat={!cdn ? "info" : cdn.ok ? "ok" : "warn"}
          titre={!cdn ? "Photos : aucune photo à tester"
            : cdn.ok ? "Photos servies par Cloudflare : OK" : "Le CDN photos ne répond pas"}
          detail={!cdn ? "Ajoutez un article avec photo."
            : cdn.ok
              ? (cdn.source === "r2"
                ? "Servies depuis Cloudflare R2 — bande passante Supabase : zéro."
                : "Première lecture depuis Supabase, puis mise en cache Cloudflare.")
              : "En local (npm run dev) c'est normal : les Functions Cloudflare ne tournent qu'en ligne."}
        />

        <Ligne
          etat={pourcentQuota > 80 ? "ko" : pourcentQuota > 50 ? "warn" : "ok"}
          titre={stockage
            ? "Stockage photos : " + mo(stockage.octets) + " (" + pourcentQuota.toFixed(0) + " % du gratuit)"
            : "Stockage photos : non mesurable"}
          detail={stockage
            ? stockage.fichiers + " fichier(s), " + mo(poidsMoyen) + " en moyenne."
              + (poidsMoyen > 400000 ? " ⚠ Photos trop lourdes : réenvoyez-les, elles seront compressées automatiquement." : "")
            : "Connectez-vous puis relancez l'analyse."}
        />

        <Ligne
          etat={sansPhoto.length ? "warn" : "ok"}
          titre={sansPhoto.length ? sansPhoto.length + " article(s) en ligne sans photo" : "Toutes les fiches ont une photo"}
          detail={sansPhoto.slice(0, 4).map((p) => p.name).join(", ") || null}
        />

        <Ligne
          etat={ruptures.length ? "warn" : "ok"}
          titre={ruptures.length ? ruptures.length + " article(s) en ligne mais en rupture" : "Aucune rupture en vitrine"}
          detail={ruptures.length
            ? "Payer de la pub vers un article indisponible = argent perdu. " + ruptures.slice(0, 4).map((p) => p.name).join(", ")
            : null}
          action={ruptures.length ? (
            <button style={btn} onClick={desactiverRuptures} disabled={occupe}>Retirer</button>
          ) : null}
        />

        <Ligne
          etat={stockFaible.length ? "warn" : "ok"}
          titre={stockFaible.length ? stockFaible.length + " article(s) en stock faible (≤ 3)" : "Stocks confortables"}
          detail={stockFaible.map((p) => p.name + " (" + stockReel(p) + ")").slice(0, 6).join(", ") || null}
        />

        <Ligne
          etat={stockage && stockage.orphelins.length ? "warn" : "ok"}
          titre={stockage && stockage.orphelins.length
            ? stockage.orphelins.length + " photo(s) inutilisée(s) occupent de la place"
            : "Aucune photo inutilisée"}
          detail={stockage && stockage.orphelins.length
            ? "Poids récupérable : " + mo(stockage.orphelins.reduce((s, f) => s + (f.metadata?.size || 0), 0))
            : null}
          action={stockage && stockage.orphelins.length ? (
            <button style={btn} onClick={supprimerOrphelins} disabled={occupe}>Nettoyer</button>
          ) : null}
        />

        <Ligne
          etat={typeof window !== "undefined" && window.fbq ? "ok" : "warn"}
          titre={typeof window !== "undefined" && window.fbq ? "Pixel Facebook actif" : "Pixel Facebook non détecté"}
          detail="Le suivi des achats se fait côté serveur (CAPI) au passage d'une commande en « confirmée »."
        />
      </div>

      {/* ── Rappel des bonnes pratiques ── */}
      <div style={{ ...card, background: "#FBF9F4" }}>
        <h3 style={titre}>À faire avant chaque campagne</h3>
        <ul style={{ ...jost, fontSize: 12.5, color: "#666", lineHeight: 1.9, margin: 0, paddingLeft: 18 }}>
          <li>Vérifier que tous les voyants ci-dessus sont au vert.</li>
          <li>Tester une commande de bout en bout (navigation privée) et la supprimer ensuite.</li>
          <li>Vérifier le stock des articles mis en avant dans la pub.</li>
          <li>Répondre aux commandes « en attente » : une confirmation rapide fait baisser les annulations.</li>
        </ul>
      </div>
    </div>
  );
}

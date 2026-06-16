# 📊 Suivi des achats Meta — Conversions API (CAPI)

> **Statut : ✅ EN PRODUCTION** — testé et fonctionnel le 16/06/2026.
> Le suivi des achats se fait **côté serveur** (CAPI), pas via le pixel navigateur.

---

## 🎯 En résumé (pour Basma / non-technique)

À chaque fois qu'une commande passe en **« Confirmée »** dans l'admin, le site
envoie **tout seul** l'achat à Meta (Facebook/Instagram), **côté serveur**.
Résultat : un suivi des ventes **fiable**, qui ne se perd pas si le client a un
bloqueur de pub, et qui **ne casse jamais** une commande.

| Ce qui marche, automatiquement | ✅ |
|---|---|
| Achat envoyé à Meta quand commande → *Confirmée* | ✅ |
| Déduplication avec le pixel (pas de double comptage) | ✅ |
| Idempotent (même en cas de réessai → 1 seul envoi) | ✅ |
| Non bloquant (si Meta est lent/en panne, la commande passe quand même) | ✅ |
| Données client **hachées** (SHA-256), montant en **TND** | ✅ |
| Bouton de secours « ↻ Renvoyer à Meta (CAPI) » dans le détail commande | ✅ |

---

## ⚙️ Comment ça marche (technique)

```
Commande passe à "confirmée" (admin)
        │
        ▼
Database Webhook Supabase  (trigger: trg_orders_capi)
        │  POST + header x-webhook-secret
        ▼
Edge Function  meta-capi-purchase  (Deno, serveur)
        │  1. vérifie le secret partagé
        │  2. claim atomique (capi_sent_at) → idempotence
        │  3. relit la commande en base (value, PII)
        │  4. hache les données client (SHA-256)
        │  5. POST vers Meta Graph API
        ▼
Meta Events Manager  →  événement "Purchase" (Server)
```

**Fichiers du code :**
- `supabase/functions/meta-capi-purchase/index.ts` — le handler serveur
- `supabase/functions/meta-capi-purchase/lib.ts` — hachage + construction de l'événement
- `supabase/functions/meta-capi-purchase/lib_test.ts` — tests unitaires
- `supabase-capi.sql` — colonnes + déclencheur (Database Webhook)
- `src/components/OrderModal.jsx` — le `Purchase` navigateur a été **retiré** (CAPI = source unique)
- `src/components/AdminPage.jsx` — bouton « ↻ Renvoyer à Meta (CAPI) »

**Clés techniques :**
- **Déduplication / idempotence** : `event_id = purchase_<id_commande>` (toujours le même pour une commande).
- **Colonnes ajoutées** à la table `orders` :
  - `capi_sent_at` → marque l'envoi (empêche les doublons)
  - `capi_resend_at` → permet un renvoi manuel (bouton admin)
- **Données envoyées à Meta** (toutes hachées sauf le montant) : téléphone, prénom, nom,
  ville (délégation), région (gouvernorat), pays (`tn`) + montant (TND), `content_ids`, quantité.

---

## 🔑 Secrets (Supabase → Edge Functions → Secrets)

> ⚠️ **Jamais dans le code ni dans Git.** Uniquement dans les Secrets Supabase.

| Nom du secret | Rôle |
|---|---|
| `META_CAPI_TOKEN` | Jeton d'accès Conversions API (Meta) |
| `META_PIXEL_ID` | `910367875151073` |
| `META_WEBHOOK_SECRET` | Mot de passe partagé entre la base et la fonction (sécurité) |
| `META_CAPI_ENABLED` | `true` = actif / `false` = désactivé |
| `META_TEST_EVENT_CODE` | **Uniquement pour tester** (mode test Meta) — **retiré en prod** |

---

## 🧪 Comment tester (si besoin un jour)

1. Meta **Events Manager** → Pixel Basma → onglet **« Test events »** → canal **Website**
   → section **« server »** → copier le code `TEST…`.
2. Supabase → **Secrets** → ajouter `META_TEST_EVENT_CODE` = le code test.
3. Admin → détail d'une commande confirmée → bouton **« ↻ Renvoyer à Meta (CAPI) »**.
4. L'événement **Purchase (Server)** apparaît dans « Test events » sous ~10 s.
5. ⚠️ **Supprimer `META_TEST_EVENT_CODE`** après le test (sinon les vrais achats
   restent en mode test et ne comptent pas).

**Test direct (avancé) :**
```
POST https://tpvumzwkekuyrggllffj.supabase.co/functions/v1/meta-capi-purchase
Header : x-webhook-secret: <valeur META_WEBHOOK_SECRET>
Body   : {"order_id": 40}
→ réponse attendue : {"sent":true,"order_id":40,"event_id":"purchase_40"}
```

---

## 🚀 Déploiement / maintenance

```powershell
# Se connecter (le jeton expire vite, à refaire si erreur 401)
npx supabase login

# Déployer la fonction après modification du code
npx supabase functions deploy meta-capi-purchase --project-ref tpvumzwkekuyrggllffj
```

**Pièges connus :**
- La saisie d'un secret dans le Dashboard peut capter un **retour-ligne invisible**
  (copier-coller sous Windows) → la fonction fait désormais `.trim()` pour tolérer ça.
- Le **login CLI** permet de **déployer** mais **PAS de gérer les secrets** (erreur 401)
  → gérer les secrets **dans le Dashboard**, pas en ligne de commande.

---

## 🔐 À faire dès que possible (sécurité)

Le **token CAPI** (`META_CAPI_TOKEN`) est passé dans une capture d'écran pendant la
configuration → **le régénérer** :
1. Meta **Events Manager** → Pixel → **Settings** → *Conversions API* → **« Generate access token »**
2. Remplacer la valeur dans Supabase → **Secrets** → `META_CAPI_TOKEN` (copier-coller).

*(Pas urgent, ça ne casse rien — simple bonne hygiène.)*

---

*Document généré par Claude Code — 16/06/2026.*

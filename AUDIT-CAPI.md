# Audit — Suivi des achats Meta (Pixel + Conversions API)

> **Objectif du document :** état des lieux technique avant la mise en place de la
> Conversions API (CAPI) Meta côté serveur, dédupliquée avec le pixel navigateur.
> **Aucun code n'a été modifié** à ce stade — ceci est un rapport d'audit.

Site : **Basma Only Shop** — https://basmaonlyshop.tn
Modèle de vente : **paiement à la livraison (COD)** en Tunisie · Devise : **TND**.

---

## 1. Stack détectée

| Élément | Détail |
|---|---|
| **Langage front** | JavaScript (JSX) — **pas de TypeScript côté front** |
| **Framework front** | **React 18 + Vite** (SPA), CSS vanilla (pas de Tailwind) |
| **Base de données** | **Supabase (PostgreSQL)** |
| **Fonctions / endpoints serveur** | **Supabase Edge Functions** (runtime **Deno** + TypeScript). Une fonction existe déjà : `supabase/functions/send-order-email/index.ts` |
| **Hébergement** | **Cloudflare Pages** (build statique du dossier `dist/`) + Supabase (DB, Auth, Storage, Edge Functions) |
| **Analytics déjà en place** | Meta Pixel `910367875151073`, Google Analytics 4 `G-5ECHXK14GV` |

> ⚠️ **Le projet n'est PAS en .NET / Blazor.** Toute implémentation serveur doit être
> faite en **Edge Function Supabase (Deno/TypeScript)**, qui est le mécanisme serveur
> idiomatique de cette stack (mêmes conventions que `send-order-email`).

### Arborescence pertinente
```
index.html                              → init Pixel Meta (fbq) + PageView + GA4
src/lib/pixel.js                        → helper fbTrack (Pixel + GA4)
src/components/OrderModal.jsx           → tunnel de commande (insert orders, Purchase pixel)
src/components/AdminPage.jsx            → back-office /admin (liste commandes, changement de statut)
src/lib/supabase.js                     → client Supabase (clé anon publique)
supabase/functions/send-order-email/    → Edge Function existante (Deno) — modèle de référence
supabase/config.toml                    → config Supabase CLI
.env                                    → VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (public)
```

---

## 2. Passage d'une commande au statut « Confirmée »

- **Il n'existe aucun endpoint / handler serveur** pour ce changement.
- Le statut est modifié **directement depuis le navigateur de l'admin** (`/admin`), via le
  client Supabase :
  - `src/components/AdminPage.jsx` (~ligne 402) :
    ```js
    const { error } = await supabase.from("orders").update({ status: newStatut }).eq("id", orderId);
    ```
  - Composant `StatutSelect` (menu déroulant) + édition dans `EditOrderModal`.
- **Les statuts sont un type `enum` PostgreSQL AVEC accents** :
  `en_attente`, `confirmée`, `livrée`, `annulée`.
  - Donc « **Confirmée** » correspond à la valeur enum **`confirmée`** (important pour tout
    déclencheur SQL — un litéral sans accent `confirmee` serait rejeté par l'enum).
- Conséquence pour la CAPI : le déclenchement « à la confirmation » devra se baser sur la
  **transition `status` → `confirmée`** (idéalement via un **Database Webhook Supabase**
  ou un trigger Postgres, côté serveur, découplé du navigateur admin).

---

## 3. État actuel du Pixel Meta et du déclenchement « Purchase »

### Pose du pixel
- `index.html` : initialisation standard `fbq('init','910367875151073')` + `fbq('track','PageView')`,
  plus un `<noscript>` de repli. Le tag GA4 est aussi présent.
- `src/lib/pixel.js` : helper **`fbTrack(event, data)`** qui envoie **à la fois** au Pixel Meta
  (`window.fbq`) et à GA4 (`window.gtag`), avec `currency: "TND"` par défaut. Il est **silencieux**
  si `fbq`/`gtag` sont absents (ex. bloqueur de pub).

### Déclenchement « Purchase » aujourd'hui
- Fichier : `src/components/OrderModal.jsx` (~ligne 157), **après l'insertion réussie de la commande** :
  ```js
  fbTrack("Purchase", {
    value: totalPrice,
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
  });
  ```
- **Timing** : au **moment où la cliente valide sa commande** (écran de succès), **pas** au passage
  en « Confirmée ».
- **Pas de `eventID`** transmis → **aucune déduplication** possible aujourd'hui avec un futur event serveur.
- Autres events du tunnel (via `fbTrack`) : `ViewContent`, `AddToCart`, `InitiateCheckout`.

### Pourquoi le Pixel sous-compte les achats (3 remontés / 4 réels)
- **`fbq` est bloqué** chez une partie des clientes : bloqueurs de pub, protection anti-tracking
  (iOS/Safari, Brave, extensions). Le beacon `Purchase` n'est alors **jamais envoyé**.
  *(Comportement déjà observé sur le navigateur du gérant lors de tests précédents.)*
- **Navigation type SPA** + fermeture d'onglet juste après la commande → beacon perdu.
- **Un seul appareil / navigateur** : si l'événement échoue là, il est définitivement perdu (pas de repli serveur).
- C'est exactement le cas d'usage que la **CAPI côté serveur** corrige : l'achat est envoyé depuis
  le serveur (fiable, non bloquable), et **dédupliqué** avec le pixel via un `event_id` commun.

---

## 4. Modèle « Commande » (table Supabase `orders`)

Une ligne `orders` = **une commande contenant UN seul produit** (il n'y a pas de table de lignes /
`order_items` ; pas de tableau de produits par commande).

| Champ | Type | Rôle / note |
|---|---|---|
| `id` | bigint (identity) | Identifiant de commande → base du futur `event_id = "purchase_{id}"` |
| `product_id` | bigint (nullable) | FK vers `products.id` |
| `product_name` | text | Nom du produit (en français, tel que stocké) |
| `size` | text | Taille choisie (ex. `TU`, `M`, `42`) |
| `quantity` | int | Quantité |
| `total_price` | numeric | **Total payé en TND** (sous-total + livraison). Devise **implicite TND**, aucune colonne devise |
| `customer_name` | text | Nom complet (à splitter en prénom/nom pour `user_data`) |
| `customer_phone` | text | Téléphone (souvent saisi `+216…`) → à normaliser en E.164 **sans `+`** |
| `customer_email` | text (nullable) | Email (optionnel) |
| `address` | text | Adresse |
| `governorate` | text | Gouvernorat (ex. `Manouba`) → utilisable comme `ct`/région |
| `delegation` | text (nullable) | Délégation (ville plus précise, ex. `Borj El Amri`) |
| `color_index` | int (nullable) | Index de la couleur/variante choisie |
| `color_label` | text (nullable) | Libellé couleur (ex. `Couleur 1`) |
| `promo_code` | text (nullable) | Code promo appliqué (livraison gratuite) |
| `status` | enum `order_status` | `en_attente` / `confirmée` / `livrée` / `annulée` |
| `created_at` | timestamptz | Date de création |

> **Devise :** toujours **TND**, jamais reconvertie côté code. Le compte publicitaire Meta étant en
> USD, Meta convertit lui-même — on enverra donc `value = total_price` et `currency = "TND"`.

> **Champs exploitables pour `user_data` (à hasher SHA-256)** : `customer_email` (em),
> `customer_phone` (ph, E.164 sans `+`), prénom/nom issus de `customer_name` (fn/ln),
> ville `delegation`/`governorate` (ct), pays `tn` (country). **Aucune colonne `capi_sent_at`
> n'existe encore** — elle sera à ajouter pour l'idempotence.

---

## 5. Gestion actuelle de la configuration et des secrets

| Contexte | Mécanisme | Exemples |
|---|---|---|
| **Front (public, dans le bundle)** | Variables Vite `import.meta.env.VITE_*`, fichier `.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **Serveur (Edge Functions)** | **Secrets Supabase** lus via `Deno.env.get("…")` | `RESEND_API_KEY` (déjà utilisé dans `send-order-email`) |
| **Identifiants publics** | En dur (non sensibles) | Pixel `910367875151073`, GA4 `G-5ECHXK14GV` dans `index.html` |
| **Déploiement** | Cloudflare Pages sert `dist/` commité ; secrets serveur **hors Git** | — |

- **Aucune config .NET** (pas de `appsettings.json`, pas de `IConfiguration`, pas de Key Vault).
- Les clés `Meta:CapiAccessToken` / `Meta:PixelId` évoquées dans la consigne **n'existent pas** ici.
- **Emplacement cible pour le token CAPI** : **secrets des Edge Functions Supabase**
  (Dashboard → *Project Settings → Edge Functions → Secrets*, ou `supabase secrets set …`),
  lus via `Deno.env.get(...)`. Jamais hardcodés, jamais loggés, jamais commités.

### Variables d'environnement à prévoir (serveur)
- `META_CAPI_TOKEN` — **token CAPI** (secret).
- `META_PIXEL_ID` — `910367875151073`.
- `META_TEST_EVENT_CODE` — vide en prod, rempli pour *Test Events*.
- `META_CAPI_ENABLED` — flag d'activation globale.
- `GRAPH_API_VERSION` — version stable de la Graph API (à confirmer au moment du code).
- (déjà fournis automatiquement aux Edge Functions : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## Synthèse / implications pour la CAPI

1. **Serveur = Edge Function Supabase (Deno/TS)** — pas de .NET.
2. **Déclenchement « Confirmée »** : transition `status → confirmée` (enum accentué), idéalement via
   **Database Webhook Supabase** → Edge Function (découplé, non bloquant, réessayable).
3. **Déduplication** : ajouter un `eventID = "purchase_{id}"` au Purchase navigateur (aujourd'hui absent)
   et utiliser le **même** `event_id` côté CAPI.
4. **Idempotence** : ajouter la colonne **`orders.capi_sent_at`** (claim atomique avant envoi) + backfill manuel.
5. **Secrets** : token CAPI dans les **secrets Edge Functions Supabase**, lus via `Deno.env.get`.
6. **PII** : email/téléphone/nom/ville **hashés SHA-256** (normalisés) ; `value`/`currency`/`order_id` non hashés.

---

*Rapport d'audit — étape 1. Aucune modification de code effectuée. En attente de validation du plan
avant implémentation (Édge Function CAPI, déduplication, idempotence, tests, vérification).*

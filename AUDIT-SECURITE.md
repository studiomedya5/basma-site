# 🔒 Audit de sécurité Supabase — Basma Only Shop

> **Étape 1 — Audit uniquement (aucune modification appliquée).**
> Date : 17/06/2026. À valider avant d'appliquer les correctifs (étapes 2→6).

---

## 🧭 Constat central

Le back-office **/admin n'a PAS de vraie authentification**. Il est protégé par un
**simple mot de passe écrit en clair dans le code front** (`PASSWORD = "basma2024"`
dans `AdminPage.jsx`) qui ne fait que basculer un état React. **Toutes** les
opérations (lire/modifier/supprimer commandes, produits, codes promo) passent par la
**clé `anon`** — la même clé **publique** visible dans le JavaScript du site.

➡️ Conséquence : **tout ce que l'admin peut faire, n'importe quel visiteur peut le
faire** en réutilisant la clé publique. Les RLS sont en mode « tout ouvert »
(`USING (true)` / `WITH CHECK (true)`) pour compenser ce choix.

---

## 🔴 Failles confirmées en direct (preuves)

| # | Faille | Preuve | Gravité |
|---|---|---|---|
| 1 | **Fuite des données clientes** : `anon` lit toutes les commandes (noms, téléphones, adresses) | `GET /rest/v1/orders` avec la clé publique → renvoie les commandes | 🔴 Critique (RGPD/vie privée) |
| 2 | **Modif/suppression de commandes** par n'importe qui | policies `orders_anon_update` / `orders_anon_delete` en `USING (true)` | 🔴 Critique |
| 3 | **Manipulation du stock** par n'importe qui | `POST /rest/v1/rpc/apply_stock_delta` en `anon` → **HTTP 204** (autorisé). Un `p_delta` négatif/positif modifie le stock de n'importe quel produit | 🔴 Critique |
| 4 | **Vol / création / suppression de codes promo** | `GET /promo_codes` renvoie `BASMA2026` ; policies `promo_anon_*` toutes en `true` | 🟠 Élevé |
| 5 | **Écriture libre sur les produits** (prix, stock, textes) | l'admin édite les produits via `anon` → `anon` a les droits d'écriture | 🟠 Élevé |

---

## 📋 Détail par table

### `orders` (fichier `supabase-rls-orders.sql`)
- **RLS** : activé.
- **Policies** (toutes `to anon`) :
  - `orders_anon_insert` — `WITH CHECK (true)` → ✅ utile (client passe commande) **mais sans aucun garde-fou** (statut/montant arbitraires possibles).
  - `orders_anon_select` — `USING (true)` → 🔴 fuite PII.
  - `orders_anon_update` — `USING (true) WITH CHECK (true)` → 🔴.
  - `orders_anon_delete` — `USING (true)` → 🔴.
- **Dépendances front à connaître** (sinon on casse le checkout en révoquant) :
  - `OrderModal.jsx:48` lit `promo_codes` pour valider un code.
  - `OrderModal.jsx:117-118` lit `orders` (par téléphone + code) pour la règle « 1 seule utilisation par numéro ».
  - `OrderModal.jsx:143` / `Cart.jsx:62` : `INSERT` de la commande (à préserver).

### `promo_codes` (fichier `supabase-promo-codes.sql`)
- **RLS** : activé.
- **Policies** (toutes `to anon`, `using/check (true)`) : `select`, `insert`, `update`, `delete` → 🔴 tout ouvert.

### `products`
- **RLS** : pas de fichier RLS dans le repo. `anon` peut **lire** (catalogue, normal ✅) **et écrire** (l'admin passe par `anon`) → 🟠 à verrouiller. *(État exact des policies à confirmer dans le Dashboard.)*

---

## 🧩 Fonctions `SECURITY DEFINER`

| Fonction | Rôle | Problème | Action prévue |
|---|---|---|---|
| `apply_stock_delta(bigint,int,int)` | applique un delta de stock | **`EXECUTE` ouvert à `anon`** (prouvé : RPC → 204) | 🔴 `REVOKE EXECUTE` à `anon`/`authenticated`/`PUBLIC` |
| `adjust_product_stock()` | fonction de trigger (stock auto) | non appelable en RPC (404) mais `EXECUTE` à révoquer par hygiène | `REVOKE EXECUTE` |
| `rls_auto_enable` | signalée par le linter | **absente du repo** → définition à inspecter dans la base | inspecter puis `REVOKE EXECUTE` |

> ✅ **Bonne nouvelle** : révoquer `EXECUTE` à `anon` **ne casse PAS** le trigger de stock.
> Une fonction de trigger s'exécute avec les droits du *définisseur*, sans vérifier le
> droit `EXECUTE` de la personne qui insère la commande. Le stock continuera de se gérer tout seul.

---

## 🟢 Ce qui ne bougera pas (rassurant)

- **Webhook CAPI** (`meta-capi-purchase`) : utilise la **`service_role`** → **bypasse les RLS**.
  Le durcissement des RLS **n'a aucun impact** sur le suivi des achats Meta. ✅
- **Catalogue public** : `anon` garde le `SELECT` sur `products`. ✅
- **Passage de commande public** : `anon` garde l'`INSERT` sur `orders` (avec garde-fous ajoutés). ✅

---

## 🗺️ Plan proposé (étapes 2 → 6) — à valider

### Étape 2 — Vraie authentification admin (Supabase Auth)
- Activer **Auth email/mot de passe**, **désactiver les inscriptions publiques** (1 seul compte admin).
- Créer **un compte admin** (email + mot de passe) dans le Dashboard.
- Front : remplacer l'écran mot-de-passe en dur par `supabase.auth.signInWithPassword`,
  session persistée, `signOut` au bouton Déconnexion. → l'admin agit désormais en rôle **`authenticated`**.

### Étape 3 — RLS propres (migration SQL versionnée + rollback)
- **products** : `anon` = `SELECT` seulement ; `INSERT/UPDATE/DELETE` = `authenticated`.
- **orders** : `anon` = `INSERT` seulement, avec **`WITH CHECK` strict** (statut forcé `en_attente`,
  `quantity > 0`, `total_price >= 0`). **Aucun** `SELECT/UPDATE/DELETE` pour `anon`.
  `SELECT/UPDATE/DELETE` = `authenticated`.
- **promo_codes** : **aucun** droit `anon`. Lecture/écriture = `authenticated`.
  Validation au checkout via une **fonction `SECURITY DEFINER` dédiée**
  `validate_promo_code(p_code, p_phone)` qui renvoie `{valide, livraison_gratuite, raison}`
  (vérifie actif + expiration + « déjà utilisé par ce numéro ») **sans exposer la table**.
- **`REVOKE SELECT`** à `anon` sur `orders` et `promo_codes` (retire ces tables de l'API publique).

### Étape 4 — Fonctions SECURITY DEFINER
- `REVOKE EXECUTE` à `anon`/`authenticated`/`PUBLIC` sur `apply_stock_delta`, `adjust_product_stock`,
  `rls_auto_enable`. (Le trigger continue de fonctionner.)

### Étape 5 — Storage (bucket `products`)
- Garder la **lecture publique des images par URL** (les `<img>` continuent de marcher).
- Retirer la policy qui permet de **LISTER** tous les fichiers du bucket.

### Étape 6 — Tests (procédure + exécution)
- En `anon` : commande ✅ / catalogue ✅ / lire commandes ❌ / supprimer commande ❌ /
  créer code promo ❌ / `apply_stock_delta` ❌.
- En **admin authentifié** : tout gérer ✅.
- **CAPI** : un renvoi `meta-capi-purchase` doit toujours répondre `{"sent":true}` ✅.

### Changements front nécessaires (pour ne rien casser)
- `AdminPage.jsx` → login Supabase Auth (au lieu du mot de passe en dur).
- `OrderModal.jsx` → validation promo via `validate_promo_code` (remplace les lectures directes `promo_codes` + `orders`).
- `supabase.js` → inchangé (la session Auth se gère via le même client).

### Réversibilité
- Migration livrée avec un **bloc rollback** (recrée les anciennes policies / re-grant) au cas où.

---

## ⚠️ Point d'attention avant de coder
Une fois les RLS durcies, **l'admin ne fonctionnera plus avec la clé `anon`** : l'étape 2
(login Supabase Auth) est donc un **prérequis** à l'étape 3. On les applique **ensemble**.

*Audit généré par Claude Code — en attente de validation pour appliquer les étapes 2→6.*

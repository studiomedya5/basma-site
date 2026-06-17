# 🔒 Sécurisation Supabase — RÉCAP (terminé le 17/06/2026)

> Objectif atteint : base sécurisée **sans rien casser** (commande publique,
> catalogue, back-office /admin, webhook CAPI tous fonctionnels).

---

## 🎯 Le changement majeur
Avant, **/admin n'avait pas de vraie authentification** : un simple mot de passe en
clair (`basma2024`) et **toutes** les opérations passaient par la clé `anon` publique.
Maintenant, **/admin utilise un vrai login Supabase Auth** (email + mot de passe), et
l'`anon` n'a plus que le strict nécessaire.

### 🔑 Nouveau login admin
- URL : **basmaonlyshop.tn/admin**
- Email : **studiomedya5@gmail.com**
- Mot de passe : celui défini dans **Supabase → Authentication → Users**
  (l'ancien `basma2024` ne marche plus).
- Inscriptions publiques **désactivées** (un seul admin).

---

## ✅ Ce qui est verrouillé (prouvé par tests en direct)

| Action d'un visiteur (clé anon) | Avant | Après |
|---|---|---|
| Lire les commandes (noms, tél, adresses) | 🔴 ouvert | ❌ `permission denied` |
| Modifier / supprimer une commande | 🔴 ouvert | ❌ bloqué |
| Créer une commande **truquée** (faux montant/statut) | 🔴 passait | ❌ `violates RLS` |
| Voir / créer / supprimer des **codes promo** | 🔴 ouvert | ❌ bloqué |
| Manipuler le **stock** (`apply_stock_delta` en RPC) | 🔴 `204` | ❌ `permission denied` |
| **Lister / uploader / supprimer** les images du storage | 🔴 public | ❌ admin only |

## ✅ Ce qui marche toujours (préservé)
- Passer une **vraie commande** (anon = INSERT avec garde-fous : statut `en_attente`, quantité > 0, montant ≥ 0). ✅
- Voir le **catalogue** (anon = SELECT sur products). ✅
- **Login admin** + gestion complète (commandes, produits, codes promo) via session Auth. ✅
- **Images produits** affichées par URL publique. ✅
- **Webhook CAPI** (achats Meta) — utilise la `service_role`, non impacté. ✅
- Validation des **codes promo au checkout** via la fonction serveur `validate_promo_code`. ✅

---

## 🧩 Ce qui a été fait (technique)

### Front
- `AdminPage.jsx` : login **Supabase Auth** (`signInWithPassword`), session réelle, `signOut`.
- `OrderModal.jsx` : validation promo via **RPC `validate_promo_code`** (la table n'est plus exposée).

### Base de données (migrations SQL versionnées + rollback)
- `supabase-securite-phaseA.sql` — additive : fonction `validate_promo_code` (SECURITY DEFINER) + droits `authenticated`.
- `supabase-securite-phaseC.sql` — verrouillage : RLS strictes, révocation `anon`, révocation `EXECUTE` sur les fonctions de stock.
- `supabase-securite-phaseC-fix.sql` — nettoyage des policies « fantômes » d'`orders` (créées via le Dashboard) + garde-fous d'INSERT.
- `supabase-securite-storage.sql` — bucket `products` : gestion réservée à `authenticated`, lecture publique conservée.
- `supabase-securite-rollback.sql` — filet de sécurité pour rétablir l'accès `anon` en cas d'urgence.

### Détails RLS
- **orders** : anon = INSERT only (`with check status='en_attente' and quantity>0 and total_price>=0 and product_name is not null`) ; SELECT/UPDATE/DELETE = authenticated.
- **promo_codes** : aucun droit anon ; validation via la fonction ; gestion = authenticated.
- **products** : anon = SELECT ; INSERT/UPDATE/DELETE = authenticated.
- **fonctions** `apply_stock_delta`, `adjust_product_stock` : `EXECUTE` révoqué pour anon/authenticated (les triggers marchent quand même).
- **storage.objects** (bucket products) : 4 policies `authenticated` (select/insert/update/delete) ; lecture publique par le flag « public » du bucket.

---

## 🔁 En cas de pépin
- Pour rétablir l'accès `anon` en urgence : exécuter **`supabase-securite-rollback.sql`**.
- Le login Auth et la fonction `validate_promo_code` restent en place (inoffensifs).

---

## 📌 À surveiller
- Si tu uploades une photo produit dans /admin et que ça refuse : vérifie que tu es bien
  **connecté** (session Auth) — l'upload exige désormais le rôle `authenticated`.
- Pense toujours à régénérer le **token CAPI** exposé en capture (voir `CAPI-META-RECAP.md`).

*Sécurisation réalisée et testée par Claude Code — 17/06/2026.*

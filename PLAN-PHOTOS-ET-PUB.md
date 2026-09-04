# Photos Cloudflare + boutique prête pour la pub

_Rédigé le 4 septembre 2026._

---

## 1. Diagnostic — à lire en premier

**Le backend Supabase du site n'existe plus en ligne.**

```
$ nslookup tpvumzwkekuyrggllffj.supabase.co 8.8.8.8
*** Non-existent domain
```

Le nom de domaine du projet Supabase (`tpvumzwkekuyrggllffj.supabase.co`) ne résout
plus, ni depuis le PC, ni depuis les serveurs DNS publics de Google. Ce n'est pas un
problème de cache navigateur ni de Cloudflare : **le projet Supabase est en pause ou
supprimé.**

Conséquences aujourd'hui :

| Élément | État |
|---|---|
| Site (HTML, CSS, JS) sur Cloudflare Pages | ✅ en ligne (HTTP 200) |
| Catalogue produits | ❌ vide (la base ne répond pas) |
| Photos produits | ❌ invisibles (stockées dans Supabase Storage) |
| Prise de commande | ❌ impossible |
| Panel admin `/admin` | ❌ connexion impossible |

> ⚠️ **Ne lance aucune campagne Facebook tant que ce point n'est pas réglé.**
> Une pub « Ventes » qui envoie du trafic vers une boutique vide brûle le budget et,
> pire, apprend à l'algorithme Meta que ton site ne convertit pas — ce mauvais
> apprentissage se paye ensuite pendant des semaines.

### Ce qu'il faut faire, dans l'ordre

1. Se connecter sur **https://supabase.com/dashboard** avec le compte du projet.
2. Regarder l'état du projet `tpvumzwkekuyrggllffj` :
   - **« Paused »** → bouton **Restore** / **Resume**. Le projet revient avec ses
     données ET ses photos. C'est le bon scénario.
   - **Projet absent de la liste** → il a été supprimé. Vérifier l'onglet
     _Organization → Projects_ et la corbeille éventuelle, puis contacter le support
     Supabase **rapidement** (les sauvegardes ne sont pas conservées indéfiniment).
3. Vérifier la facturation / les quotas : offre gratuite = 500 Mo de base,
   **1 Go de photos**, **5 Go de bande passante par mois**. La boutique dépassait
   très probablement le quota de bande passante (photos non compressées de 3–6 Mo
   servies directement depuis Supabase).
4. Une fois le projet de nouveau en ligne : **appliquer la suite de ce document**
   pour que le problème ne se reproduise jamais.

---

## 2. La solution photos : Cloudflare devant Supabase

### Le principe

```
Navigatrice
    │
    ▼
basmaonlyshop.tn/img/photo.webp        ← Cloudflare Pages Function
    │
    ├─ 1. Cache edge Cloudflare        ← 99 % des visites s'arrêtent ici
    ├─ 2. Bucket R2 (Cloudflare)       ← stockage permanent, egress gratuit
    └─ 3. Supabase Storage             ← lu UNE seule fois par photo,
                                          puis copié automatiquement dans R2
```

Autrement dit : **chaque photo n'est lue qu'une seule fois depuis Supabase**. Ensuite
elle vit chez Cloudflare, dont la bande passante est illimitée et gratuite.
La migration se fait toute seule, au fil des visites — aucun export/import manuel.

### Ce qui a été codé

| Fichier | Rôle |
|---|---|
| `functions/img/[[path]].js` | La Pages Function : cache edge → R2 → Supabase + recopie |
| `src/lib/images.js` | Réécrit toutes les URL Supabase vers `/img/…` |
| `src/lib/catalog.js` | Chargement du catalogue avec mode secours |
| `scripts/prechauffer-images.mjs` | Copie toutes les photos vers R2 en une passe |
| `scripts/prerender-products.mjs` | Génère `public/catalogue.json` + OG images via le CDN |

### Configuration à faire une seule fois (10 minutes)

1. **Cloudflare → R2 → Create bucket** : nom `basma-images`. _(offre gratuite : 10 Go
   de stockage, sortie de données gratuite — largement suffisant)_
2. **Cloudflare → Workers & Pages → basma-site → Settings → Functions → R2 bindings**
   → _Add binding_ :
   - Variable name : `IMAGES`
   - R2 bucket : `basma-images`
3. Redéployer (un simple `git push` suffit).
4. Une fois Supabase de retour, lancer une passe complète :
   ```
   npm run prechauffer
   ```
   Toutes les photos sont alors copiées chez Cloudflare.
5. Dans `/admin` → onglet **Santé**, la ligne « Photos servies par Cloudflare » doit
   afficher **« Servies depuis Cloudflare R2 »**.

> Tant que la liaison R2 n'est pas créée, tout fonctionne quand même : la Function
> se contente de mettre en cache les photos au bord du réseau Cloudflare, ce qui
> réduit déjà la bande passante Supabase d'environ 95 %.

### Photos compressées à l'envoi

Le vrai déclencheur du problème : les photos partaient telles quelles depuis le
téléphone (3 à 6 Mo chacune). Désormais, dans `/admin` → Produits, chaque photo est
**redimensionnée à 1600 px et convertie en WebP** avant l'envoi :

| | Avant | Après |
|---|---|---|
| Poids d'une photo | 3–6 Mo | 150–250 Ko |
| 100 produits × 4 photos | ~1,6 Go | ~80 Mo |
| Chargement fiche produit en 4G | 3–6 s | < 1 s |

Effet secondaire très utile pour la pub : **une page qui charge vite convertit
beaucoup mieux** (Meta pénalise les pages lentes dans le classement des enchères).

---

## 3. Le site ne doit plus jamais « bloquer »

### Mode secours automatique

À chaque build réussi, un instantané complet du catalogue est écrit dans
`public/catalogue.json` (versionné dans Git, servi par Cloudflare).

Si Supabase ne répond pas :

- le site affiche quand même **tout le catalogue** (photos incluses, via `/img/`) ;
- une barre apparaît en bas : _« Commande en ligne momentanément indisponible —
  commandez par WhatsApp »_ ;
- si l'enregistrement d'une commande échoue, l'écran d'erreur propose un bouton
  **WhatsApp avec la commande déjà rédigée** (article, taille, couleur, quantité,
  total, nom, téléphone, adresse). La vente n'est pas perdue.

C'est le filet de sécurité indispensable pendant une campagne payante.

---

## 4. Nouveautés du back office

### Onglet « Statistiques »

- Chiffre d'affaires, panier moyen, taux de confirmation, **taux d'annulation**
  (alerte au-dessus de 30 %) — sur 7, 30 ou 90 jours.
- Courbe du chiffre d'affaires par jour.
- Top 5 des articles vendus.
- Répartition des ventes par catégorie (anneau).
- Top gouvernorats — pour anticiper la livraison.
- **Export pour Excel** : bouton unique, fichier `commandes-AAAA-MM-JJ.csv`
  (séparateur `;` + BOM UTF-8, s'ouvre directement dans Excel avec les accents).

_Aucune librairie ajoutée_ : les graphiques sont en SVG. Le site reste léger, ce qui
compte quand 90 % des visiteuses viennent de Facebook en 4G.

### Onglet « Santé » — la check-list avant chaque pub

Vérifie en un clic :

- la base de données répond ;
- les photos passent bien par Cloudflare (et si elles sont déjà dans R2) ;
- le poids total du stockage photos et le % du quota gratuit consommé ;
- les articles en ligne **sans photo** ;
- les articles en ligne **en rupture** → bouton _Retirer_ pour les sortir de la
  vitrine en une fois ;
- les articles en **stock faible (≤ 3)** ;
- les **photos orphelines** (plus liées à aucun article) → bouton _Nettoyer_ pour
  libérer de la place ;
- la présence du Pixel Facebook.

### Ailleurs

- Badge **« Plus que X ! »** sur les fiches produits (FR + AR) quand il reste 3
  articles ou moins — levier d'urgence classique et honnête, puisqu'il reflète le
  stock réel.
- Badges **stock faible** dans la liste des produits du back office.

---

## 5. Check-list avant de lancer la campagne « Ventes »

- [ ] Projet Supabase restauré et accessible.
- [ ] `git push` fait, déploiement Cloudflare Pages terminé.
- [ ] Liaison R2 `IMAGES` créée + `npm run prechauffer` exécuté.
- [ ] `/admin` → **Santé** : tous les voyants au vert.
- [ ] Commande test passée de bout en bout en navigation privée, puis supprimée.
- [ ] Stock vérifié sur les articles mis en avant dans les visuels de la pub.
- [ ] Pixel + CAPI : une commande passée en « confirmée » remonte bien dans
      Meta Events Manager (voir `CAPI-META-RECAP.md`).
- [ ] Sitemap et pages produits régénérés (automatique au build).

---

## 6. Quelle offre choisir ?

| Besoin | Solution | Coût |
|---|---|---|
| Base de données + commandes | Supabase Free (500 Mo) | 0 € |
| Photos (stockage + diffusion) | **Cloudflare R2 + Pages** | 0 € jusqu'à 10 Go |
| Site | Cloudflare Pages | 0 € |
| Si le trafic de la pub fait exploser la base | Supabase Pro | 25 $/mois |

Avec les photos sorties de Supabase et compressées, l'offre gratuite Supabase
redevient très largement suffisante : il n'y reste que du texte (produits,
commandes), soit quelques Mo. **Le passage à Supabase Pro (25 $/mois) reste malgré
tout recommandé pendant une campagne payante** : il supprime la mise en pause
automatique et donne des sauvegardes quotidiennes. C'est une assurance à 25 $ sur
un budget pub bien plus élevé.

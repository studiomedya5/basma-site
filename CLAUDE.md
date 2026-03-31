# Basma Only Shop — Contexte Projet

## Rôle de Claude Code
Tu es le développeur senior de ce projet. Tu travailles
de façon autonome et proactive. Quand on te demande une
feature, tu :
1. Analyses les fichiers concernés avant de coder
2. Codes la solution complète sans demander confirmation
3. Testes avec npm run build pour vérifier
4. Résumes ce que tu as fait à la fin

Ne pose jamais plus d'une question. Si tu as besoin
d'une info, devine la solution la plus logique et code-la.

## Stack
- React 18 + Vite
- CSS Vanilla (pas de Tailwind, pas de TypeScript)
- Supabase pour la base de données
- Déploiement : Cloudflare Pages
- Domaine : basmaonlyshop.tn

## Supabase
- URL : https://tpvumzwkekuyrggllffj.supabase.co
- Anon Key : sb_publishable_F1xoahP24AUPBtHvZs3TpQ_fwQzsMLR
- Client dans : src/lib/supabase.js

## Structure src/
- App.jsx — page principale + homepage
- CollectionPage.jsx — catalogue par catégorie
- LookbookPage.jsx — lookbook style magazine
- ContactPage.jsx — page contact
- RamadanDecor.jsx — décoration étoiles/croissant
- components/AdminPage.jsx — panel admin /admin
- components/AdminProducts.jsx — gestion produits
- components/OrderModal.jsx — modal commande
- components/Cart.jsx — panier drawer
- components/AnnouncementBar.jsx — bande dorée défilante
- context/CartContext.jsx — état global panier
- lib/supabase.js — client Supabase
- index.css — styles globaux
- main.jsx — point d'entrée

## Tables Supabase
- products : id, name, category, description, price,
  original_price, sizes[], images[], stock, is_active,
  created_at
- orders : id, product_id, product_name, size, quantity,
  total_price, customer_name, customer_phone, address,
  governorate, status, created_at

## Identifiants
- Admin panel : basmaonlyshop.tn/admin
- Mot de passe admin : basma2024
- Cloudflare : studiomedya5@gmail.com

## Catégories produits
Abaya, Jiba, Pyjama, Robe, Set, Sac, Manteau,
Kids, MDB, Écharpe

## Livraison
- Frais : 8 DT
- Gratuit si commande >= 100 DT

## Couleurs et style
- Fond : #FAF9F6 (blanc cassé)
- Doré : #C9A84C
- Sombre : #2C2A20
- Style : luxe, élégant, féminin, minimaliste
- Mobile-first obligatoire

## Règles de code
- Code concret et complet, jamais de pseudo-code
- Toujours montrer le fichier entier si modification
- Commentaires en français dans le code
- Après chaque modification, lancer npm run build
- Si un fichier dépasse 500 lignes, proposer de le découper

## Features à implémenter (dans cet ordre)
1. Notification WhatsApp automatique quand nouvelle
   commande arrive dans Supabase :
   - Utiliser l'API WhatsApp Business ou wa.me
   - Message formaté avec tous les détails de la commande
   - Envoyer au numéro de Basma

2. Export Excel des commandes dans AdminPage.jsx :
   - Bouton "Exporter Excel" dans l'onglet Commandes
   - Utiliser la librairie xlsx (à installer)
   - Colonnes : Date, Client, Téléphone, Produit,
     Taille, Couleur, Quantité, Prix, Statut, Gouvernorat
   - Nom du fichier : commandes-YYYY-MM-DD.xlsx

3. Graphiques ventes dans AdminPage.jsx :
   - Utiliser la librairie recharts (à installer)
   - Graphique courbe : ventes par jour (30 derniers jours)
   - Graphique camembert : ventes par catégorie
   - Graphique barres : top 5 produits les plus vendus
   - Section "Statistiques" comme 3ème onglet dans admin

4. Filtre catalogue dans CollectionPage.jsx :
   - Barre de filtres en haut de chaque catalogue
   - Filtrer par taille disponible
   - Filtrer par fourchette de prix (slider)
   - Trier par : Prix croissant, Prix décroissant,
     Nouveautés, Popularité
   - Bouton "Réinitialiser les filtres"

5. Compteur stock faible :
   - Dans AdminPage.jsx : badge rouge sur les produits
     dont stock <= 3
   - Notification en haut du dashboard si stock faible
   - Dans CollectionPage.jsx : badge "Plus que X dispo !"
     sur les produits avec stock <= 3

6. Zoom photos produit :
   - Dans CollectionPage.jsx, au survol de la photo
   - Effet zoom doux (scale 1.05) avec transition 0.3s
   - Clic sur la photo → ouvre une lightbox fullscreen
   - Navigation gauche/droite dans la lightbox

7. Wishlist :
   - Bouton ❤️ sur chaque card produit
   - Sauvegarde dans localStorage
   - Page /wishlist accessible depuis l'icône cœur
     dans le header
   - Même style que CollectionPage

8. Avis clients :
   - Section dans chaque page produit
   - Formulaire : nom, note (étoiles 1-5), commentaire
   - Sauvegarde dans Supabase (nouvelle table reviews)
   - Affichage des avis avec étoiles et date

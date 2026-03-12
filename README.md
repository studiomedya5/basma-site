# 🌹 Basma Only Shop — Site E-commerce

## 📦 Installation (3 étapes)

### 1. Ouvrir le projet dans VS Code
- Dézippe le dossier `basma-site`
- Ouvre VS Code → **Fichier > Ouvrir le dossier** → sélectionne `basma-site`

### 2. Installer les dépendances
Ouvre le terminal dans VS Code (`Ctrl + ù` ou `Terminal > Nouveau terminal`) et tape :

```bash
npm install
```

### 3. Lancer le site
```bash
npm run dev
```

Le site s'ouvre automatiquement dans ton navigateur à **http://localhost:3000** 🎉

---

## 🛠 Technologies utilisées
- **Vite** — Bundler ultra-rapide
- **React 18** — UI components
- **CSS Vanilla** — Styles personnalisés

## 📁 Structure du projet
```
basma-site/
├── public/
│   └── images/          ← Tes photos de produits
│       ├── logo.png
│       ├── abaya-bleu-nuit.jpg
│       ├── abaya-bordeaux.jpg
│       └── ...
├── src/
│   ├── App.jsx          ← Composant principal
│   ├── index.css        ← Styles globaux
│   └── main.jsx         ← Point d'entrée
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 Prochaines étapes avec Claude Code
- Ajouter un backend (API pour les produits)
- Intégrer un système de paiement (Stripe)
- Ajouter l'authentification clients
- Dashboard admin pour gérer les produits
- Déployer sur Vercel ou Netlify

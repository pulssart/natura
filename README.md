# Natura - Application Web Botanique

Application web pour générer des illustrations botaniques style naturaliste avec légendes, à partir de photos ou de descriptions textuelles, utilisant GPT-5.2 et GPT Image 1.5 d'OpenAI.

## 🌿 Fonctionnalités

- **Génération d'illustrations botaniques** : Créez de magnifiques illustrations au format A4 style botaniste
- **Analyse intelligente** : Identification automatique des espèces (plantes, insectes, animaux) via GPT-5.2
- **Deux modes d'input** : Description textuelle ou upload de photo
- **Galerie de favoris** : Sauvegarde automatique de toutes vos créations
- **Impression et partage** : Impression format A4 et partage natif

## 🚀 Déploiement sur Netlify

### Méthode 1 : Déploiement automatique via Git

1. **Pousser le code sur GitHub** :
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git push -u origin main
   ```

2. **Connecter à Netlify** :
   - Allez sur [Netlify](https://www.netlify.com)
   - Cliquez sur "Add new site" > "Import an existing project"
   - Connectez votre dépôt GitHub `pulssart/natura`
   - Netlify détectera automatiquement la configuration dans `netlify.toml`

3. **Configuration automatique** :
   - **Build command** : `npm run build:web`
   - **Publish directory** : `web-build`
   - Ces valeurs sont déjà configurées dans `netlify.toml`

4. **Déployer** :
   - Cliquez sur "Deploy site"
   - Votre application sera disponible sur une URL Netlify (ex: `natura.netlify.app`)

### Méthode 2 : Déploiement manuel

1. **Build local** :
   ```bash
   npm install
   npm run build:web
   ```

2. **Déployer** :
   - Allez sur Netlify
   - Glissez-déposez le dossier `web-build` dans Netlify
   - Ou utilisez Netlify CLI :
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=web-build
     ```

## 🛠️ Développement local

### Prérequis

- Node.js 20.19.4 ou supérieur
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start

# Ou directement pour le web
npm run web
```

L'application sera accessible sur `http://localhost:8081` (ou le port indiqué)

## 📝 Configuration

### Clé API OpenAI

1. Ouvrez l'application
2. Cliquez sur l'icône ⚙️ (réglages) en haut à droite
3. Entrez votre clé API OpenAI (format : `sk-...`)
4. Cliquez sur "Sauvegarder"

La clé est stockée localement dans le navigateur (localStorage) et n'est jamais envoyée ailleurs qu'à l'API OpenAI.

## 🎨 Utilisation

1. **Générer une illustration** :
   - Entrez une description textuelle (ex: "Une rose rouge avec des épines")
   - Ou cliquez sur "Galerie" ou "Photo" pour uploader une image
   - Cliquez sur "Générer l'illustration"
   - Attendez la génération (10-30 secondes)

2. **Voir vos créations** :
   - Allez dans l'onglet "Favoris"
   - Toutes vos créations sont sauvegardées automatiquement
   - Cliquez sur une création pour la voir en grand

3. **Imprimer ou partager** :
   - Dans la vue détaillée, utilisez les boutons "Imprimer" et "Partager"
   - L'impression est optimisée pour le format A4

## 🏗️ Structure du projet

```
Natura/
├── app/                    # Pages et navigation (expo-router)
│   ├── (tabs)/             # Navigation par onglets
│   │   ├── index.tsx       # Écran d'accueil
│   │   └── favorites.tsx   # Galerie de favoris
│   └── detail.tsx          # Vue détaillée
├── components/             # Composants réutilisables
│   └── ApiKeyModal.tsx    # Modal de réglages
├── services/              # Services métier
│   ├── openai.ts          # API OpenAI
│   └── storage.ts         # Stockage local
├── types/                 # Types TypeScript
├── utils/                 # Constantes et utilitaires
├── netlify.toml           # Configuration Netlify
└── package.json
```

## 🔧 Technologies

- **Expo** : Framework React Native pour le web
- **expo-router** : Navigation basée sur les fichiers
- **TypeScript** : Typage statique
- **OpenAI API** : GPT-5.2 et GPT Image 1.5

## 📄 Licence

Ce projet est privé.

## 🤝 Contribution

Ce projet est actuellement privé. Pour toute question, contactez le propriétaire du dépôt.


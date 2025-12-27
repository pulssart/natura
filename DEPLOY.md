# Guide de déploiement - Natura sur Netlify

## 🚀 Déploiement rapide

### Étape 1 : Préparer le code

```bash
# Vérifier que tout est à jour
npm install

# Tester le build localement
npm run build:web
```

Si le build fonctionne, vous verrez un dossier `web-build/` créé.

### Étape 2 : Pousser sur GitHub

```bash
# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Initial commit - Application Natura"

# Pousser sur GitHub
git branch -M main
git push -u origin main
```

### Étape 3 : Déployer sur Netlify

#### Option A : Via l'interface Netlify (Recommandé)

1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Cliquez sur **"Add new site"** > **"Import an existing project"**
3. Choisissez **GitHub** et autorisez Netlify
4. Sélectionnez le dépôt **`pulssart/natura`**
5. Netlify détectera automatiquement :
   - **Build command** : `npm run build:web`
   - **Publish directory** : `web-build`
6. Cliquez sur **"Deploy site"**

#### Option B : Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Dans le dossier du projet
cd /Users/adriendonot/Documents/Projetcs/Webapp/Natura

# Initialiser le site
netlify init

# Déployer
netlify deploy --prod
```

### Étape 4 : Configuration (optionnel)

Si vous voulez un nom de domaine personnalisé :

1. Allez dans **Site settings** > **Domain management**
2. Cliquez sur **"Add custom domain"**
3. Suivez les instructions pour configurer votre domaine

## 🔄 Déploiements automatiques

Une fois connecté à GitHub, Netlify déploiera automatiquement :
- À chaque push sur `main` → Déploiement en production
- À chaque pull request → Déploiement de prévisualisation

## 🐛 Dépannage

### Le build échoue

1. Vérifiez les logs dans Netlify
2. Testez localement : `npm run build:web`
3. Vérifiez que toutes les dépendances sont dans `package.json`

### L'application ne se charge pas

1. Vérifiez que `netlify.toml` est présent
2. Vérifiez que le dossier `web-build` est bien créé après le build
3. Vérifiez les redirections dans `netlify.toml`

### Variables d'environnement

Si vous avez besoin de variables d'environnement :

1. Allez dans **Site settings** > **Environment variables**
2. Ajoutez vos variables (ex: `OPENAI_API_KEY`)
3. ⚠️ **Attention** : Ne mettez JAMAIS votre clé API OpenAI dans les variables d'environnement publiques. Les utilisateurs doivent entrer leur propre clé dans l'application.

## 📊 Monitoring

Netlify fournit :
- **Analytics** : Statistiques de visite
- **Functions** : Si vous ajoutez des fonctions serverless
- **Forms** : Gestion de formulaires (si nécessaire)

## 🔒 Sécurité

- Les clés API sont stockées côté client (localStorage)
- Aucune donnée sensible n'est stockée sur Netlify
- Les requêtes API se font directement depuis le navigateur vers OpenAI

## 📝 Notes importantes

- Le build peut prendre 2-5 minutes la première fois
- Les builds suivants sont plus rapides grâce au cache
- Netlify offre un plan gratuit généreux pour les projets personnels


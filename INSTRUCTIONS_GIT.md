# Instructions pour pousser sur Git

## ⚠️ Problème détecté

Git est actuellement bloqué car la licence Xcode n'a pas été acceptée.

## 🔧 Solution

### Étape 1 : Accepter la licence Xcode

Ouvrez un terminal et exécutez :

```bash
sudo xcodebuild -license
```

Lisez la licence et tapez `agree` pour l'accepter.

### Étape 2 : Pousser le code

Une fois la licence acceptée, vous avez deux options :

#### Option A : Utiliser le script automatique

```bash
cd /Users/adriendonot/Documents/Projetcs/Webapp/Natura
./push-to-git.sh
```

#### Option B : Commandes manuelles

```bash
cd /Users/adriendonot/Documents/Projetcs/Webapp/Natura

# Initialiser Git (si pas déjà fait)
git init

# Configurer le remote
git remote add origin https://github.com/pulssart/natura.git
# ou si déjà existant :
git remote set-url origin https://github.com/pulssart/natura.git

# Ajouter tous les fichiers
git add .

# Créer le commit
git commit -m "Initial commit - Application Natura web ready for Netlify deployment"

# Créer la branche main
git branch -M main

# Pousser sur GitHub
git push -u origin main
```

## ✅ Vérification

Une fois le push terminé, allez sur :
**https://github.com/pulssart/natura**

Vous devriez voir tous vos fichiers.

## 🚀 Prochaine étape : Déployer sur Netlify

Une fois le code sur GitHub, suivez les instructions dans `QUICK_START.md` ou `DEPLOY.md` pour déployer sur Netlify.


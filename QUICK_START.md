# 🚀 Démarrage rapide - Déploiement sur Netlify

## Étape 1 : Initialiser Git (si pas déjà fait)

```bash
cd /Users/adriendonot/Documents/Projetcs/Webapp/Natura

# Initialiser git (si nécessaire)
git init

# Ajouter le remote
git remote add origin https://github.com/pulssart/natura.git
# ou si déjà existant :
git remote set-url origin https://github.com/pulssart/natura.git
```

## Étape 2 : Tester le build localement

```bash
# Installer les dépendances
npm install

# Tester le build
npm run build:web
```

Si tout fonctionne, vous verrez un dossier `web-build/` créé.

## Étape 3 : Pousser sur GitHub

```bash
# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Application Natura web"

# Créer la branche main et pousser
git branch -M main
git push -u origin main
```

## Étape 4 : Déployer sur Netlify

1. **Allez sur [app.netlify.com](https://app.netlify.com)**

2. **Cliquez sur "Add new site" > "Import an existing project"**

3. **Connectez GitHub** et sélectionnez le dépôt `pulssart/natura`

4. **Netlify détectera automatiquement** :
   - Build command: `npm run build:web`
   - Publish directory: `web-build`

5. **Cliquez sur "Deploy site"**

6. **Attendez 2-5 minutes** pour le premier déploiement

7. **Votre app sera disponible** sur une URL comme `natura-xxxxx.netlify.app`

## ✅ C'est tout !

Votre application est maintenant déployée et accessible via une URL publique.

### Prochaines étapes

- **Personnaliser l'URL** : Dans Netlify > Site settings > Domain management
- **Déploiements automatiques** : Chaque push sur `main` redéploiera automatiquement
- **Variables d'environnement** : Si nécessaire, dans Site settings > Environment variables

## 🐛 Problèmes courants

### "Build failed"
- Vérifiez que `npm run build:web` fonctionne localement
- Vérifiez les logs dans Netlify pour voir l'erreur exacte

### "Page not found"
- Vérifiez que `netlify.toml` est présent à la racine
- Vérifiez que les redirections sont configurées

### Git ne fonctionne pas
- Si vous voyez une erreur Xcode, acceptez la licence :
  ```bash
  sudo xcodebuild -license
  ```
- Puis réessayez les commandes git


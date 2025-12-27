# 🔍 Guide de débogage Netlify

## ✅ Configuration actuelle

### netlify.toml
```toml
[build]
  command = "npm ci && npm run build:web"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20.19.4"
```

### .nvmrc
```
20.19.4
```

### package.json scripts
```json
"build:web": "npx expo export --platform web"
```

## 🧪 Test local

Pour reproduire le build Netlify localement :

```bash
# Nettoyer
rm -rf node_modules dist

# Installer les dépendances (comme Netlify)
npm ci

# Build (comme Netlify)
npm run build:web
```

## 🔧 Vérifications à faire sur Netlify

1. **Vérifier la version de Node.js** :
   - Dans Netlify Dashboard → Site settings → Build & deploy → Environment
   - Assurez-vous que Node.js 20.19.4 est sélectionné
   - Ou ajoutez `NODE_VERSION=20.19.4` dans les variables d'environnement

2. **Vérifier la commande de build** :
   - Doit être : `npm ci && npm run build:web`

3. **Vérifier le dossier de publication** :
   - Doit être : `dist`

4. **Vérifier les fichiers commités** :
   - Tous les fichiers nécessaires doivent être dans le repo
   - Pas de fichiers manquants dans `.gitignore`

## 🐛 Problèmes courants

### Erreur : Module not found
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que `package-lock.json` est commité
- Netlify doit exécuter `npm ci` (pas `npm install`)

### Erreur : Build timeout
- Le build peut prendre du temps
- Vérifiez les logs complets dans Netlify

### Erreur : Cannot find module
- Vérifiez que les fichiers sont bien commités
- Vérifiez que `.gitignore` n'exclut pas des fichiers nécessaires

## 📋 Checklist avant déploiement

- [ ] `.nvmrc` présent avec la bonne version
- [ ] `netlify.toml` configuré correctement
- [ ] `package.json` contient toutes les dépendances
- [ ] `package-lock.json` est commité
- [ ] Tous les fichiers nécessaires sont commités
- [ ] Le build fonctionne localement avec `npm ci && npm run build:web`

## 📝 Logs à fournir

Si le build échoue toujours, fournissez :
1. Les **50 premières lignes** d'erreur du log Netlify
2. La **commande exacte** qui échoue
3. Le **message d'erreur complet**


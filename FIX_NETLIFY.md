# 🔧 Corrections apportées pour Netlify

## Problèmes identifiés et corrigés

### 1. ❌ Commande de build incorrecte
**Problème** : `expo export:web` n'existe pas  
**Solution** : Remplacé par `npx expo export --platform web`

### 2. ❌ Dépendances web manquantes
**Problème** : `react-dom` et `react-native-web` manquants  
**Solution** : Installés via `npx expo install react-dom react-native-web`

### 3. ❌ Dossier de publication incorrect
**Problème** : `netlify.toml` pointait vers `web-build` mais Expo crée `dist`  
**Solution** : Mis à jour `netlify.toml` pour pointer vers `dist`

## ✅ Configuration finale

### package.json
```json
"build:web": "npx expo export --platform web"
```

### netlify.toml
```toml
[build]
  command = "npm run build:web"
  publish = "dist"
```

### Dépendances ajoutées
- `react-dom@19.1.0`
- `react-native-web@^0.21.0`

## 🧪 Test local réussi

Le build fonctionne maintenant localement :
```bash
npm run build:web
```

Créé le dossier `dist/` avec :
- `index.html` ✅
- Tous les fichiers statiques ✅
- Assets et bundles ✅

## 🚀 Prochaines étapes

1. **Pousser les changements sur GitHub** :
   ```bash
   git add .
   git commit -m "Fix Netlify build: add web dependencies and correct build command"
   git push
   ```

2. **Netlify redéploiera automatiquement** ou vous pouvez déclencher un nouveau déploiement manuellement

3. **Vérifier le déploiement** sur votre dashboard Netlify

## 📝 Notes

- Le build prend environ 10-15 secondes
- Le dossier `dist/` est dans `.gitignore` (ne sera pas commité)
- Netlify le générera à chaque déploiement


# ✅ Vérification des icônes

## 📋 Fichiers présents

### ✅ Dans `assets/` (pour Expo)
- ✅ `apple-touch-icon.png` (76K) - **NOUVEAU** - Pour iOS
- ⚠️ `icon.png` (22K) - **ANCIEN** - À remplacer par votre icône 1024x1024
- ⚠️ `favicon.png` (1.4K) - **ANCIEN** - À remplacer par votre icône 48x48
- ⚠️ `splash-icon.png` (17K) - **ANCIEN** - À remplacer par votre icône 1024x1024
- ⚠️ `adaptive-icon.png` (17K) - **ANCIEN** - À remplacer par votre icône 1024x1024
- ✅ `favicon-96x96.png` (22K) - **NOUVEAU**
- ✅ `web-app-manifest-192x192.png` (85K) - **NOUVEAU**
- ✅ `web-app-manifest-512x512.png` (576K) - **NOUVEAU**

### ✅ Dans `public/` (pour le web)
- ✅ `apple-touch-icon.png` (76K) - **NOUVEAU**
- ✅ `favicon-96x96.png` (22K) - **NOUVEAU**
- ✅ `favicon.ico` - **NOUVEAU**
- ✅ `web-app-manifest-192x192.png` (85K) - **NOUVEAU**
- ✅ `web-app-manifest-512x512.png` (576K) - **NOUVEAU**

## 🔧 Actions nécessaires

Pour que l'icône apparaisse partout, vous devez **remplacer** les fichiers anciens dans `assets/` :

1. **`assets/icon.png`** → Remplacez par votre icône 1024x1024px
2. **`assets/favicon.png`** → Remplacez par votre icône 48x48px (ou utilisez favicon-96x96.png)
3. **`assets/splash-icon.png`** → Remplacez par votre icône 1024x1024px
4. **`assets/adaptive-icon.png`** → Remplacez par votre icône 1024x1024px

## 📝 Option rapide

Si vous avez votre icône source en haute résolution (1024x1024), vous pouvez :

```bash
# Copier votre icône source vers les fichiers nécessaires
cp votre-icon-source.png assets/icon.png
cp votre-icon-source.png assets/splash-icon.png
cp votre-icon-source.png assets/adaptive-icon.png

# Pour le favicon, redimensionner à 48x48
# (utilisez un outil en ligne ou ImageMagick)
```

## ✅ Après remplacement

1. **Rebuild l'application** :
   ```bash
   npm run build:web
   ```

2. **Commit et push** :
   ```bash
   git add assets/
   git commit -m "Update app icons with new design"
   git push
   ```

3. **Vérifier** :
   - L'icône devrait apparaître dans l'onglet du navigateur
   - Sur iOS, l'icône devrait apparaître lors de l'ajout au home screen
   - L'icône devrait apparaître dans les paramètres de l'app

## 🎯 Fichiers déjà configurés

- ✅ `app.json` - Pointe vers les bons fichiers
- ✅ `public/manifest.json` - Utilise web-app-manifest-192x192.png et 512x512.png
- ✅ `app/+html.tsx` - Meta tags iOS configurés
- ✅ `apple-touch-icon.png` - Présent dans assets/ et public/

Il ne reste plus qu'à remplacer les 4 fichiers principaux dans `assets/` !


# 🎨 Guide rapide : Ajouter votre icône

## Étape 1 : Préparer votre icône

1. **Placez votre icône source** (format PNG, carrée, minimum 1024x1024px) à la racine du projet
   - Nommez-la `icon-source.png` (ou gardez son nom actuel)

## Étape 2 : Générer toutes les tailles

### Option A : Avec le script automatique (Recommandé)

1. **Installer sharp** (si pas déjà fait) :
   ```bash
   npm install --save-dev sharp
   ```

2. **Générer les icônes** :
   ```bash
   node scripts/generate-icons.js icon-source.png
   ```
   (Remplacez `icon-source.png` par le nom de votre fichier)

### Option B : Avec un outil en ligne (Plus simple)

1. Allez sur **https://realfavicongenerator.net/**
2. Uploadez votre icône
3. Téléchargez le package généré
4. Placez les fichiers :
   - Dans `assets/` : `icon.png`, `favicon.png`, `apple-touch-icon.png`
   - Dans `public/` : `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `favicon-16x16.png`, `favicon-32x32.png`

### Option C : Manuellement avec ImageMagick

```bash
# Installer ImageMagick
brew install imagemagick

# Générer les icônes
convert votre-icon.png -resize 1024x1024 assets/icon.png
convert votre-icon.png -resize 1024x1024 assets/splash-icon.png
convert votre-icon.png -resize 1024x1024 assets/adaptive-icon.png
convert votre-icon.png -resize 180x180 assets/apple-touch-icon.png
convert votre-icon.png -resize 48x48 assets/favicon.png

# Pour public/
convert votre-icon.png -resize 180x180 public/apple-touch-icon.png
convert votre-icon.png -resize 192x192 public/icon-192.png
convert votre-icon.png -resize 512x512 public/icon-512.png
convert votre-icon.png -resize 16x16 public/favicon-16x16.png
convert votre-icon.png -resize 32x32 public/favicon-32x32.png
```

## Étape 3 : Vérifier les fichiers

Assurez-vous que ces fichiers existent :

**Dans `assets/` :**
- ✅ `icon.png` (1024x1024)
- ✅ `apple-touch-icon.png` (180x180) - **IMPORTANT pour iOS**
- ✅ `favicon.png` (48x48)
- ✅ `splash-icon.png` (1024x1024)
- ✅ `adaptive-icon.png` (1024x1024)

**Dans `public/` :**
- ✅ `apple-touch-icon.png` (180x180)
- ✅ `icon-192.png` (192x192)
- ✅ `icon-512.png` (512x512)
- ✅ `favicon-16x16.png` (16x16)
- ✅ `favicon-32x32.png` (32x32)

## Étape 4 : Rebuild et déployer

```bash
# Rebuild l'application
npm run build:web

# Commit et push
git add assets/ public/
git commit -m "Add new app icons"
git push
```

## Étape 5 : Tester

1. **Sur le web** : Vérifiez que le favicon apparaît dans l'onglet du navigateur
2. **Sur iOS** :
   - Ouvrez l'app dans Safari iOS
   - Partage → "Sur l'écran d'accueil"
   - Vérifiez que votre icône apparaît

## ⚠️ Important

- L'icône doit être **carrée** (ratio 1:1)
- Pour iOS, l'icône doit avoir un **fond opaque** (pas de transparence)
- Après avoir ajouté les fichiers, **rebuild** l'application pour que les changements soient pris en compte


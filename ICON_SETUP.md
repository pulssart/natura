# Configuration de l'icône de l'application

## 📱 Pour iOS (Ajout au Home Screen)

Pour que l'icône s'affiche correctement quand l'utilisateur ajoute l'app à son home screen iOS, vous devez :

### 1. Préparer votre icône source

Commencez avec votre icône en haute résolution (minimum 1024x1024px, format PNG).

### 2. Créer les fichiers d'icônes

Placez les fichiers dans les dossiers suivants :

#### Dans `assets/` :
- **`icon.png`** - 1024x1024px (icône principale Expo)
- **`favicon.png`** - 48x48px (favicon web)
- **`apple-touch-icon.png`** - 180x180px (pour iOS home screen)
- **`splash-icon.png`** - 1024x1024px (écran de démarrage)
- **`adaptive-icon.png`** - 1024x1024px (Android)

#### Dans `public/` (créer le dossier si nécessaire) :
- **`apple-touch-icon.png`** - 180x180px
- **`icon-192.png`** - 192x192px
- **`icon-512.png`** - 512x512px
- **`favicon.ico`** - 32x32px (format ICO)
- **`favicon-16x16.png`** - 16x16px
- **`favicon-32x32.png`** - 32x32px

### 3. Méthodes pour créer les différentes tailles

#### Option A : Outil en ligne (Recommandé)
1. Allez sur https://realfavicongenerator.net/
2. Uploadez votre icône source
3. Configurez les options :
   - iOS : Cocher "Apple touch icon"
   - Android : Cocher "Android Chrome"
   - Favicon : Cocher "Favicon"
4. Téléchargez le package généré
5. Extrayez et placez les fichiers aux bons endroits

#### Option B : ImageMagick (Ligne de commande)
```bash
# Installer ImageMagick (si pas déjà installé)
# macOS: brew install imagemagick

# Créer apple-touch-icon (180x180)
convert votre-icon-source.png -resize 180x180 assets/apple-touch-icon.png
cp assets/apple-touch-icon.png public/apple-touch-icon.png

# Créer favicon (48x48)
convert votre-icon-source.png -resize 48x48 assets/favicon.png

# Créer icon principal (1024x1024)
convert votre-icon-source.png -resize 1024x1024 assets/icon.png
convert votre-icon-source.png -resize 1024x1024 assets/splash-icon.png
convert votre-icon-source.png -resize 1024x1024 assets/adaptive-icon.png

# Créer les icônes PWA
convert votre-icon-source.png -resize 192x192 public/icon-192.png
convert votre-icon-source.png -resize 512x512 public/icon-512.png

# Créer les favicons
convert votre-icon-source.png -resize 16x16 public/favicon-16x16.png
convert votre-icon-source.png -resize 32x32 public/favicon-32x32.png
```

#### Option C : Script Node.js (si vous avez sharp installé)
```bash
npm install --save-dev sharp
```

Puis créez un script `scripts/generate-icons.js` :
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'assets/icon.png': 1024,
  'assets/favicon.png': 48,
  'assets/apple-touch-icon.png': 180,
  'assets/splash-icon.png': 1024,
  'assets/adaptive-icon.png': 1024,
  'public/icon-192.png': 192,
  'public/icon-512.png': 512,
  'public/apple-touch-icon.png': 180,
  'public/favicon-16x16.png': 16,
  'public/favicon-32x32.png': 32,
};

async function generateIcons() {
  const source = 'votre-icon-source.png';
  
  // Créer les dossiers si nécessaire
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  
  for (const [output, size] of Object.entries(sizes)) {
    await sharp(source)
      .resize(size, size)
      .png()
      .toFile(output);
    console.log(`✅ Créé ${output} (${size}x${size})`);
  }
}

generateIcons().catch(console.error);
```

### 4. Vérification

Après avoir ajouté les fichiers :

1. **Rebuild l'application** :
   ```bash
   npm run build:web
   ```

2. **Vérifier les fichiers** :
   - Les fichiers dans `assets/` doivent être présents
   - Les fichiers dans `public/` doivent être copiés dans `dist/` après le build

3. **Tester sur iOS** :
   - Ouvrez l'app dans Safari iOS
   - Appuyez sur "Partager" → "Sur l'écran d'accueil"
   - L'icône devrait apparaître avec votre design

4. **Tester sur le web** :
   - L'icône devrait apparaître dans l'onglet du navigateur
   - Le manifest.json devrait être accessible à `/manifest.json`

### 5. Structure finale

```
Natura/
├── assets/
│   ├── icon.png (1024x1024)
│   ├── favicon.png (48x48)
│   ├── apple-touch-icon.png (180x180)
│   ├── splash-icon.png (1024x1024)
│   └── adaptive-icon.png (1024x1024)
├── public/
│   ├── apple-touch-icon.png (180x180)
│   ├── icon-192.png (192x192)
│   ├── icon-512.png (512x512)
│   ├── favicon.ico (32x32)
│   ├── favicon-16x16.png (16x16)
│   ├── favicon-32x32.png (32x32)
│   └── manifest.json
└── app/
    └── +html.tsx (déjà configuré)
```

## 🎨 Caractéristiques de l'icône

L'icône doit être :
- **Carrée** (ratio 1:1)
- **Sans transparence** pour iOS (fond opaque recommandé)
- **Haute résolution** (minimum 1024x1024px pour la version principale)
- **Design simple** et reconnaissable à petite taille
- **Couleurs vives** pour une meilleure visibilité

## ✅ Configuration déjà en place

Les fichiers suivants sont déjà configurés :
- ✅ `app/+html.tsx` - Meta tags iOS et PWA
- ✅ `public/manifest.json` - Manifest PWA
- ✅ `app.json` - Configuration Expo avec appleTouchIcon

Il ne reste plus qu'à ajouter les fichiers d'icônes aux bons endroits !


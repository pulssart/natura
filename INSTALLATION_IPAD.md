# Installation de Natura sur iPad

## Méthode 1 : Expo Go (Test rapide - 2 minutes)

### Étapes :

1. **Sur votre iPad** :
   - Ouvrez l'App Store
   - Recherchez et installez **"Expo Go"** (gratuit)

2. **Sur votre Mac** :
   ```bash
   npm start
   ```

3. **Connecter iPad et Mac** :
   - Assurez-vous que votre iPad et votre Mac sont sur le **même réseau Wi-Fi**
   - Dans le terminal, vous verrez un QR code

4. **Sur votre iPad** :
   - Ouvrez l'app **Expo Go**
   - Appuyez sur "Scan QR Code"
   - Scannez le QR code affiché dans le terminal
   - L'application Natura se chargera automatiquement

### ⚠️ Limitations :
- L'app fonctionne uniquement quand Expo Go est ouvert
- Certaines fonctionnalités natives peuvent être limitées
- Nécessite une connexion au serveur de développement

---

## Méthode 2 : Build de développement (Installation permanente)

Cette méthode crée une version installable directement sur votre iPad, sans Expo Go.

### Prérequis :
- Mac avec Xcode installé
- Compte Apple ID (gratuit suffit)
- iPad connecté au Mac via câble USB ou sur le même réseau

### Option A : Avec EAS Build (Recommandé - Cloud)

1. **Installer EAS CLI** :
   ```bash
   npm install -g eas-cli
   ```

2. **Se connecter** :
   ```bash
   eas login
   ```

3. **Configurer le projet** :
   ```bash
   eas build:configure
   ```

4. **Créer un build de développement iOS** :
   ```bash
   eas build --platform ios --profile development
   ```

5. **Installer sur iPad** :
   - Une fois le build terminé, vous recevrez un lien
   - Ouvrez le lien sur votre iPad
   - Installez l'app via TestFlight ou directement

### Option B : Avec Xcode (Local)

1. **Générer les fichiers natifs iOS** :
   ```bash
   npx expo prebuild --platform ios
   ```

2. **Ouvrir dans Xcode** :
   ```bash
   open ios/Natura.xcworkspace
   ```

3. **Dans Xcode** :
   - Sélectionnez votre iPad dans la liste des appareils (en haut)
   - Cliquez sur le bouton "Play" (▶️) pour compiler et installer
   - La première fois, vous devrez :
     - Aller dans Xcode > Settings > Accounts
     - Ajouter votre Apple ID
     - Sélectionner votre équipe de développement

4. **Sur votre iPad** :
   - Allez dans Réglages > Général > Gestion des appareils
   - Faites confiance à votre certificat de développeur
   - L'app Natura apparaîtra sur votre écran d'accueil

---

## Méthode 3 : Build de production (Pour distribution)

Pour créer une version finale prête pour l'App Store ou la distribution interne :

```bash
eas build --platform ios --profile production
```

---

## Dépannage

### "Unable to connect to development server"
- Vérifiez que iPad et Mac sont sur le même Wi-Fi
- Redémarrez le serveur : `npm start`

### "Device not found" dans Xcode
- Connectez votre iPad via USB
- Déverrouillez votre iPad et acceptez "Faire confiance à cet ordinateur"
- Dans Xcode, allez dans Window > Devices and Simulators et vérifiez que l'iPad apparaît

### Erreur de certificat dans Xcode
- Allez dans Xcode > Settings > Accounts
- Sélectionnez votre compte Apple
- Cliquez sur "Download Manual Profiles"
- Dans le projet, sélectionnez votre équipe dans "Signing & Capabilities"

### L'app se ferme immédiatement
- Vérifiez les logs dans Xcode (View > Debug Area > Show Debug Area)
- Assurez-vous que toutes les permissions sont configurées dans `app.json`

---

## Commandes rapides

```bash
# Démarrer pour Expo Go
npm start

# Créer un build de développement avec EAS
eas build --platform ios --profile development

# Générer les fichiers iOS pour Xcode
npx expo prebuild --platform ios

# Ouvrir dans Xcode
open ios/Natura.xcworkspace
```

---

## Recommandation

Pour un **test rapide** : Utilisez **Expo Go** (Méthode 1)

Pour une **installation permanente** avec toutes les fonctionnalités : Utilisez **EAS Build** (Méthode 2 - Option A)


# Guide de test - Application Natura

## Méthode 1 : Expo Go (Recommandé pour débuter)

### Sur iPhone/iPad :

1. **Installer Expo Go** depuis l'App Store sur votre appareil iOS

2. **Démarrer le serveur de développement** :
   ```bash
   npm start
   ```
   ou
   ```bash
   npx expo start
   ```

3. **Scanner le QR code** :
   - Ouvrez l'app Expo Go sur votre iPhone/iPad
   - Scannez le QR code affiché dans le terminal avec l'appareil photo iOS
   - L'application se chargera automatiquement

### Avantages :
- ✅ Rapide et simple
- ✅ Pas besoin de Xcode
- ✅ Test immédiat sur un appareil réel

### Limitations :
- ⚠️ Certaines fonctionnalités natives peuvent être limitées
- ⚠️ L'impression peut ne pas fonctionner parfaitement dans Expo Go

---

## Méthode 2 : Simulateur iOS (Nécessite Xcode)

### Prérequis :
- Mac avec Xcode installé
- Xcode Command Line Tools configurés

### Étapes :

1. **Démarrer le simulateur iOS** :
   ```bash
   npm run ios
   ```
   ou
   ```bash
   npx expo start --ios
   ```

2. Le simulateur s'ouvrira automatiquement et l'app se chargera

### Avantages :
- ✅ Test complet des fonctionnalités natives
- ✅ Impression et partage fonctionnent correctement
- ✅ Débogage plus facile

---

## Méthode 3 : Build de développement iOS

### Prérequis :
- Compte développeur Apple (gratuit ou payant)
- Xcode installé
- Certificats de développement configurés

### Étapes :

1. **Créer un build de développement** :
   ```bash
   npx expo prebuild --platform ios
   npx expo run:ios
   ```

2. Ou utiliser EAS Build (recommandé) :
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform ios --profile development
   ```

---

## Première utilisation

1. **Configurer la clé API OpenAI** :
   - Ouvrez l'application
   - Cliquez sur l'icône ⚙️ (réglages) en haut à droite
   - Entrez votre clé API OpenAI (format : `sk-...`)
   - Cliquez sur "Sauvegarder"

2. **Tester la génération** :
   - Sur l'écran d'accueil, vous pouvez :
     - Entrer une description textuelle (ex: "Une rose rouge avec des épines")
     - Ou prendre/sélectionner une photo
   - Cliquez sur "Générer l'illustration"
   - Attendez la génération (peut prendre 10-30 secondes)

3. **Voir vos créations** :
   - Allez dans l'onglet "Favoris"
   - Toutes vos créations sont sauvegardées automatiquement
   - Cliquez sur une création pour la voir en grand
   - Utilisez les boutons "Imprimer" et "Partager"

---

## Dépannage

### Erreur "Clé API non configurée"
- Vérifiez que vous avez bien configuré votre clé API dans les réglages
- Assurez-vous que la clé commence par `sk-`

### Erreur de permissions (caméra/photos)
- Sur iOS, les permissions sont demandées automatiquement
- Si refusées, allez dans Réglages > Natura > Photos/Caméra

### L'application ne se charge pas
- Vérifiez que votre iPhone/iPad et votre Mac sont sur le même réseau Wi-Fi
- Redémarrez le serveur : `npm start` puis appuyez sur `r` pour reload

### Erreur "Module not found"
- Réinstallez les dépendances : `npm install`
- Nettoyez le cache : `npx expo start -c`

---

## Commandes utiles

```bash
# Démarrer en mode développement
npm start

# Démarrer avec nettoyage du cache
npx expo start -c

# Démarrer sur iOS
npm run ios

# Voir les logs
npx expo start --dev-client
```


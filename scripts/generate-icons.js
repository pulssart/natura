const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration des tailles d'icônes
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
  // Vérifier si sharp est installé
  try {
    require('sharp');
  } catch (e) {
    console.error('❌ Sharp n\'est pas installé. Installez-le avec: npm install --save-dev sharp');
    process.exit(1);
  }

  // Nom du fichier source (modifiez-le si nécessaire)
  const sourceFile = process.argv[2] || 'icon-source.png';
  
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Fichier source introuvable: ${sourceFile}`);
    console.log('Usage: node scripts/generate-icons.js <chemin-vers-votre-icone.png>');
    process.exit(1);
  }

  console.log(`📸 Génération des icônes à partir de: ${sourceFile}\n`);

  // Créer les dossiers si nécessaire
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
    console.log('✅ Dossier public/ créé');
  }

  // Générer toutes les tailles
  for (const [output, size] of Object.entries(sizes)) {
    try {
      // Créer le dossier parent si nécessaire
      const dir = path.dirname(output);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await sharp(sourceFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // Fond blanc
        })
        .png()
        .toFile(output);
      
      console.log(`✅ Créé ${output} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création de ${output}:`, error.message);
    }
  }

  console.log('\n✨ Toutes les icônes ont été générées avec succès !');
  console.log('\n📝 Prochaines étapes:');
  console.log('1. Vérifiez que tous les fichiers sont dans assets/ et public/');
  console.log('2. Lancez: npm run build:web');
  console.log('3. Déployez sur Netlify');
}

generateIcons().catch(console.error);


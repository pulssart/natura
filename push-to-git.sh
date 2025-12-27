#!/bin/bash

# Script pour pousser le code sur GitHub
# Exécutez ce script après avoir accepté la licence Xcode

echo "🚀 Initialisation de Git..."

# Initialiser Git si nécessaire
if [ ! -d .git ]; then
    git init
fi

# Configurer le remote
git remote remove origin 2>/dev/null
git remote add origin https://github.com/pulssart/natura.git

echo "📦 Ajout des fichiers..."
git add .

echo "💾 Création du commit..."
git commit -m "Initial commit - Application Natura web ready for Netlify deployment"

echo "🌿 Configuration de la branche main..."
git branch -M main

echo "⬆️  Push vers GitHub..."
git push -u origin main

echo "✅ Terminé ! Votre code est maintenant sur GitHub."
echo "👉 Allez sur https://github.com/pulssart/natura pour vérifier"


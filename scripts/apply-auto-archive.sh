#!/bin/bash

# Script pour appliquer les changements d'auto-archivage
# Ce script doit être exécuté après avoir fait un git pull

echo "🚀 Application des changements d'auto-archivage..."
echo ""

# 1. Installer les dépendances (si nécessaire)
echo "📦 Vérification des dépendances..."
pnpm install

# 2. Appliquer la migration Prisma
echo ""
echo "🗄️  Application de la migration Prisma..."
npx prisma migrate deploy

# 3. Générer le client Prisma
echo ""
echo "⚙️  Génération du client Prisma..."
npx prisma generate

# 4. Build (optionnel, décommenter si nécessaire)
# echo ""
# echo "🔨 Build de l'application..."
# pnpm build

echo ""
echo "✅ Terminé ! Vous pouvez maintenant démarrer l'application."
echo ""
echo "Pour démarrer en dev:"
echo "  pnpm dev"
echo ""
echo "Pour tester le CRON manuellement:"
echo "  curl http://localhost:3000/api/cron/auto-archive-completed"

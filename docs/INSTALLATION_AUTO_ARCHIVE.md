# 🚀 Installation du système d'auto-archivage

## Étapes d'installation

### 1. Appliquer la migration Prisma

```bash
npx prisma migrate deploy
```

### 2. Générer le client Prisma

```bash
npx prisma generate
```

### 3. Redémarrer l'application

```bash
pnpm dev
# ou en production
pnpm build && pnpm start
```

## OU utiliser le script automatique

```bash
chmod +x scripts/apply-auto-archive.sh
./scripts/apply-auto-archive.sh
```

## Vérification

### 1. Vérifier que le champ existe en DB

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'task' AND column_name = 'completedAt';
```

### 2. Tester le CRON manuellement

```bash
# En local
curl http://localhost:3000/api/cron/auto-archive-completed

# En production
curl https://votre-domaine.com/api/cron/auto-archive-completed
```

### 3. Tester le flux utilisateur

1. Créer une tâche
2. La marquer comme "terminée"
3. Vérifier que le toast apparaît avec les boutons
4. Tester "Archiver maintenant" et "Annuler"

## Configuration Vercel

Le CRON est déjà configuré dans `vercel.json` et s'activera automatiquement après le prochain déploiement sur Vercel.

Fréquence : **Toutes les 6 heures**

## Troubleshooting

### Erreurs TypeScript sur `completedAt`

Assurez-vous d'avoir regénéré le client Prisma :

```bash
npx prisma generate
```

### Le CRON ne s'exécute pas

- Vérifiez que vous êtes sur un plan Vercel qui supporte les CRON jobs
- Vérifiez les logs dans le dashboard Vercel
- Testez manuellement l'endpoint

### Les tâches ne s'archivent pas automatiquement

- Vérifiez que `completedAt` est bien défini
- Vérifiez que 24h se sont écoulées depuis `completedAt`
- Consultez les logs du CRON job

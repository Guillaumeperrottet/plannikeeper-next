# Configuration du CRON pour auto-archivage

Pour activer l'auto-archivage des tâches terminées après 24h, vous devez configurer un job CRON sur Vercel.

## Configuration Vercel

Ajoutez cette configuration dans votre `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-archive-completed",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Cette configuration exécutera le job **toutes les 6 heures**.

## Autres options de fréquence

- **Toutes les heures** : `"0 * * * *"`
- **Toutes les 4 heures** : `"0 */4 * * *"`
- **Une fois par jour à minuit** : `"0 0 * * *"`
- **Toutes les 12 heures** : `"0 */12 * * *"`

## Test manuel

Vous pouvez tester le job manuellement en accédant à :

```
https://votre-domaine.com/api/cron/auto-archive-completed
```

## Résumé du flux

1. Utilisateur clique "Terminée" → Tâche marquée `status: "completed"` + `completedAt: now()`
2. Toast affiché : "Tâche terminée ! Auto-archivage dans 24h" avec boutons
3. Après 24h → Le job CRON archive automatiquement la tâche
4. L'utilisateur peut cliquer "Archiver maintenant" pour archiver immédiatement
5. L'utilisateur peut cliquer "Annuler" pour remettre la tâche en "pending"

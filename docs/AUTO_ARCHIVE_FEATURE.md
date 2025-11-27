# 🎯 Nouveau flux d'archivage automatique des tâches

## Vue d'ensemble

Le nouveau système implémente un flux d'archivage automatique intelligent pour les tâches terminées.

## Flux utilisateur

```
1. Utilisateur clique "Terminée"
   ↓
2. Tâche marquée "completed" + completedAt = now()
   ↓
3. Toast affiché: "Tâche terminée ! Auto-archivage dans 24h"
   avec deux boutons:
   - [Archiver maintenant] → Archive immédiatement
   - [Annuler] → Remet en "pending"
   ↓
4. Après 24h → Job CRON archive automatiquement
```

## Modifications apportées

### 1. Base de données (Prisma)

- **Ajout du champ** `completedAt: DateTime?` au modèle `Task`
- Migration créée: `20251127000001_add_completed_at_to_task`

### 2. API Backend

#### `/api/tasks/[id]/route.ts`

- **PUT** : Sauvegarde `completedAt` quand status devient "completed"
- **PATCH** : Gère `completedAt` lors des mises à jour partielles
- Réinitialise `completedAt` si le statut change de "completed" vers autre chose

#### `/api/cron/auto-archive-completed/route.ts` (NOUVEAU)

- Job CRON qui s'exécute toutes les 6 heures
- Archive automatiquement les tâches avec:
  - `status === "completed"`
  - `completedAt <= il y a 24h`
  - `archived === false`

### 3. Frontend

#### `useTaskMutations.ts`

Toast amélioré avec actions interactives :

```typescript
toast.success("Tâche terminée ! Auto-archivage dans 24h", {
  action: {
    label: "Archiver maintenant",
    onClick: async () => {
      /* archive immédiatement */
    },
  },
  cancel: {
    label: "Annuler",
    onClick: async () => {
      /* remet en pending */
    },
  },
});
```

#### `useTaskDetail.ts`

Même toast amélioré dans la page de détail de tâche

#### `lib/types.ts`

Ajout de `completedAt` et `archivedAt` au type `Task`

### 4. Configuration Vercel

#### `vercel.json`

Ajout du CRON job :

```json
{
  "path": "/api/cron/auto-archive-completed",
  "schedule": "0 */6 * * *"
}
```

## Avantages

✅ **UX améliorée** : L'utilisateur sait exactement ce qui va se passer
✅ **Flexibilité** : Peut archiver immédiatement ou annuler
✅ **Automatisation** : Pas besoin d'archiver manuellement après 24h
✅ **Traçabilité** : On sait exactement quand une tâche a été terminée
✅ **Réversible** : Peut annuler avant l'archivage automatique

## Test

### Test manuel du CRON

```bash
curl https://votre-domaine.com/api/cron/auto-archive-completed
```

### Test du flux complet

1. Marquer une tâche comme "completed"
2. Vérifier le toast avec les deux boutons
3. Attendre 24h (ou modifier la date en DB pour test)
4. Vérifier que le CRON archive la tâche

## Migration des données

La migration SQL inclut une mise à jour pour les tâches existantes :

```sql
UPDATE "task"
SET "completedAt" = "updatedAt"
WHERE status = 'completed' AND "completedAt" IS NULL;
```

Cela garantit que les tâches déjà terminées ont une date `completedAt` basée sur leur `updatedAt`.

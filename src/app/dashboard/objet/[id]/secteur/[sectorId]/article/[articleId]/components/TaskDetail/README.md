# Architecture TaskDetail - Vue détaillée d'une tâche

## 📋 Vue d'ensemble

Refactorisation complète de la page de détails d'une tâche (task-detail-page.tsx, 1124 lignes) en une architecture modulaire et maintenable.

## 🏗️ Architecture

### Structure des fichiers

```
components/TaskDetail/
├── TaskDetailClient.tsx      # Composant principal (orchestrateur)
├── TaskHeader.tsx             # En-tête avec titre et badges
├── TaskActions.tsx            # Boutons d'action (éditer, supprimer, statut)
├── TaskInfo.tsx               # Informations principales (dates, assignation, description)
├── TaskRecurrence.tsx         # Configuration de la récurrence
└── useTaskDetail.ts           # Hook pour la logique métier
```

### Composants

#### TaskDetailClient (200 lignes)

**Responsabilité** : Orchestrer la composition des composants et gérer la mise en page responsive

- Layout mobile avec tabs (détails / documents / commentaires)
- Layout desktop avec colonnes (détails + commentaires | documents)
- Navigation breadcrumb vers l'article parent
- Gestion de l'état d'édition global

**Props** :

```typescript
{
  task: Task;              // Tâche complète avec relations
  users: User[];           // Utilisateurs pour assignation
  readonly?: boolean;      // Mode lecture seule (tâches archivées)
}
```

#### TaskHeader (110 lignes)

**Responsabilité** : Afficher et éditer le titre, les badges de statut/type

- Titre avec indicateur de couleur
- Badges : statut, type de tâche, récurrence
- Avatar de l'utilisateur assigné
- Mode édition pour le titre

**Props** :

```typescript
{
  task: Task;
  isEditing: boolean;
  editedTask?: Partial<Task>;
  onTaskChange?: (updates: Partial<Task>) => void;
}
```

#### TaskActions (220 lignes)

**Responsabilité** : Boutons d'action et changements de statut rapides

- Actions rapides basées sur le statut
- Boutons desktop (Modifier, Supprimer)
- Dropdown mobile pour économiser l'espace
- Mode readonly pour tâches archivées
- Mode édition (Sauvegarder, Annuler)

**Props** :

```typescript
{
  readonly?: boolean;
  isEditing: boolean;
  isLoading: boolean;
  currentStatus: string;
  onEdit: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onDelete: () => Promise<void>;
  onStatusChange: (status: string) => Promise<void>;
}
```

#### TaskInfo (150 lignes)

**Responsabilité** : Afficher et éditer les informations principales

- Date d'échéance (realizationDate)
- Utilisateur assigné
- Date de dernière modification
- Description longue
- Mode édition pour tous les champs

**Props** :

```typescript
{
  task: Task;
  users: User[];
  isEditing: boolean;
  editedTask?: Partial<Task>;
  onTaskChange?: (updates: Partial<Task>) => void;
}
```

#### TaskRecurrence (140 lignes)

**Responsabilité** : Gérer la configuration des tâches récurrentes

- Affichage conditionnel (uniquement si recurring=true)
- Checkbox pour activer/désactiver la récurrence
- Sélecteur de périodicité (daily, weekly, monthly, quarterly, yearly)
- Date de fin optionnelle
- Information sur la prochaine occurrence

**Props** :

```typescript
{
  task: Task;
  isEditing: boolean;
  editedTask?: Partial<Task>;
  onTaskChange?: (updates: Partial<Task>) => void;
}
```

### Hook personnalisé

#### useTaskDetail

**Responsabilité** : Encapsuler toute la logique métier de la page

- Gestion de l'état (task, isEditing, isLoading, editedTask)
- Actions CRUD (save, delete, statusChange)
- Redirection après suppression
- Notifications toast
- Mode readonly

**API** :

```typescript
{
  task: Task;                                   // État actuel de la tâche
  isEditing: boolean;                           // Mode édition actif ?
  isLoading: boolean;                           // Chargement en cours ?
  editedTask: Partial<Task>;                    // Modifications temporaires
  handleEdit: () => void;                       // Activer le mode édition
  handleCancel: () => void;                     // Annuler les modifications
  handleSave: () => Promise<void>;              // Sauvegarder les modifications
  handleDelete: () => Promise<void>;            // Supprimer la tâche
  handleStatusChange: (status: string) => Promise<void>;  // Changer le statut
  updateEditedTask: (updates: Partial<Task>) => void;     // Mettre à jour editedTask
}
```

## 🎨 Design Responsive

### Mobile (< 1024px)

- **Layout** : Tabs verticales
  - Tab "Détails" : TaskInfo + TaskRecurrence
  - Tab "Documents" : DocumentUpload + DocumentsList
  - Tab "Commentaires" : TaskComments
- **Actions** : Dropdown menu pour économiser l'espace
- **Navigation** : Lien "Retour à l'article" compact

### Desktop (≥ 1024px)

- **Layout** : 2 colonnes (2/3 - 1/3)
  - Colonne gauche : TaskInfo + TaskRecurrence + TaskComments
  - Colonne droite : DocumentUpload + DocumentsList
- **Actions** : Boutons individuels
- **Navigation** : Breadcrumb complet

## 🔄 Flux de données

### Lecture (Affichage)

```
page.tsx (Server)
  → Prisma query (task avec relations)
  → TaskDetailClient
    → useTaskDetail (état initial)
      → TaskHeader (affichage)
      → TaskActions (boutons)
      → TaskInfo (données)
      → TaskRecurrence (si applicable)
      → DocumentsList (charge ses propres données)
      → TaskComments (charge ses propres données)
```

### Modification

```
1. Utilisateur clique "Modifier"
   → handleEdit() dans useTaskDetail
   → isEditing = true
   → editedTask = copie de task

2. Utilisateur modifie un champ
   → onTaskChange() dans TaskInfo/TaskHeader/TaskRecurrence
   → updateEditedTask() dans useTaskDetail
   → editedTask mis à jour

3. Utilisateur clique "Enregistrer"
   → handleSave() dans useTaskDetail
   → PUT /api/tasks/[id]
   → task mis à jour
   → isEditing = false
   → toast de succès
```

### Suppression

```
1. Utilisateur clique "Supprimer"
   → Confirmation native
   → handleDelete() dans useTaskDetail
   → DELETE /api/tasks/[id]
   → Redirection vers l'article parent
   → toast de succès
```

## 📊 Métriques

### Avant refactoring

- **1 fichier** : task-detail-page.tsx
- **1124 lignes** de code
- **Complexité** : ~8/10 (tout mélangé)
- **Réutilisabilité** : Faible
- **Testabilité** : Difficile

### Après refactoring

- **6 fichiers** : 5 composants + 1 hook
- **~950 lignes** au total (réduction de 15%)
- **Moyenne** : ~160 lignes par fichier
- **Complexité** : ~3/10 (séparation claire)
- **Réutilisabilité** : Élevée (composants indépendants)
- **Testabilité** : Excellente (unités isolées)

## 🎯 Avantages

### Maintenabilité

- Composants < 250 lignes (faciles à comprendre)
- Responsabilité unique par composant
- Logique métier isolée dans useTaskDetail

### Performance

- Composants client minimaux ("use client" uniquement où nécessaire)
- Chargement lazy possible pour DocumentsList et TaskComments
- Optimisation avec React.memo si besoin

### Expérience développeur

- Facile de trouver où modifier quelque chose
- Composants réutilisables dans d'autres contextes
- Types TypeScript stricts
- Props explicites et documentées

### Expérience utilisateur

- Layout adaptatif (tabs mobile, colonnes desktop)
- Actions contextuelles selon le statut
- Feedback immédiat (toasts)
- Mode lecture seule pour tâches archivées

## 🧪 Tests possibles

```typescript
// TaskHeader
- Affiche le titre correctement
- Active le mode édition
- Met à jour le titre en édition
- Affiche les bons badges selon le statut

// TaskActions
- Affiche "Marquer terminée" pour tâches pending
- Affiche "Remettre à faire" pour tâches completed
- Désactive les boutons en mode readonly
- Confirme avant suppression

// TaskInfo
- Affiche les dates au bon format
- Permet de changer l'assignation
- Sauvegarde la description

// TaskRecurrence
- N'affiche rien si recurring=false
- Affiche la configuration si recurring=true
- Permet de modifier la périodicité

// useTaskDetail
- Initialise l'état correctement
- Sauvegarde les modifications
- Gère les erreurs API
- Redirige après suppression
```

## 🚀 Utilisation

### Intégration dans page.tsx

```typescript
import { TaskDetailClient } from "../../components/TaskDetail/TaskDetailClient";

export default async function TaskPage({ params, searchParams }) {
  // ... chargement des données avec Prisma

  return (
    <TaskDetailClient
      task={task}
      users={users}
      readonly={readonly === "true"}
    />
  );
}
```

### Mode readonly (tâches archivées)

```typescript
<TaskDetailClient task={task} users={users} readonly={true} />
```

## 📝 Notes importantes

1. **Relations Prisma** : Le type Task inclut `article` avec toutes les relations nécessaires pour le breadcrumb
2. **DocumentsList** : Charge ses propres documents via API (ne pas passer en props)
3. **TaskComments** : Charge ses propres commentaires via API (ne pas passer currentUserId)
4. **Type updates** : `lib/types.ts` inclut maintenant le type `article?` optionnel dans Task

## 🔗 Composants externes utilisés

- `DocumentsList` : Liste des documents de la tâche
- `DocumentUpload` : Upload de nouveaux documents
- `TaskComments` : Système de commentaires
- `StatusBadge` : Badge de statut réutilisable
- `UserAvatar` : Avatar utilisateur réutilisable

## 🎨 Composants UI (shadcn)

- Card, CardContent, CardHeader, CardTitle
- Badge
- Button
- Input, Textarea, Select
- Tabs, TabsList, TabsTrigger, TabsContent
- DropdownMenu
- Tooltip

## ⚡ Prochaines optimisations possibles

1. **React.memo** : Mémoïser TaskInfo et TaskRecurrence
2. **Lazy loading** : Charger DocumentsList et TaskComments à la demande
3. **Skeleton states** : Afficher des squelettes pendant le chargement
4. **Optimistic updates** : Mettre à jour l'UI avant la réponse API
5. **Validation** : Ajouter zod pour valider les formulaires

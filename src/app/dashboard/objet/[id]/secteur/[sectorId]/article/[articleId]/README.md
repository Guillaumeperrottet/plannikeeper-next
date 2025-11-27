# 🎨 Architecture Refactorisée - Gestion des Tâches

## 📁 Structure des Dossiers

```
src/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/
├── page.tsx                    # Server Component - Charge les données
├── TasksPageClient.tsx         # Client Component principal
│
├── components/
│   ├── shared/                 # Composants réutilisables
│   │   ├── StatusBadge.tsx     # Badge de statut avec icônes
│   │   ├── UserAvatar.tsx      # Avatar utilisateur avec initiales
│   │   └── TaskTypeSelector.tsx # Sélecteur de type de tâche
│   │
│   ├── TaskList/               # Liste des tâches
│   │   ├── TaskList.tsx        # Container principal
│   │   ├── TaskTable.tsx       # Vue tableau (desktop)
│   │   ├── TaskCards.tsx       # Vue cartes (mobile)
│   │   ├── TaskCard.tsx        # Carte individuelle
│   │   └── TaskFilters.tsx     # Barre de filtres et recherche
│   │
│   ├── TaskForm/               # Formulaire unifié
│   │   └── TaskForm.tsx        # Formulaire responsive (Sheet)
│   │
│   └── TaskDetail/             # Détails d'une tâche (à venir)
│
├── hooks/                      # Hooks personnalisés
│   ├── useTaskFilters.ts       # Gestion filtres, recherche, tri
│   └── useTaskMutations.ts     # CRUD operations (create, update, delete)
│
└── lib/                        # Utilitaires et types
    ├── types.ts                # Types TypeScript
    └── taskHelpers.ts          # Fonctions utilitaires
```

## ✨ Nouveautés et Améliorations

### 🏗️ Architecture Modulaire

- **Fichiers < 200 lignes** : Chaque composant est petit et facile à maintenir
- **Séparation des responsabilités** : UI, Logique, Données sont séparés
- **Composants réutilisables** : DRY (Don't Repeat Yourself)

### 📱 Responsive Design

- **Un seul formulaire** : S'adapte automatiquement mobile/desktop
- **Vue adaptative** : Tableau sur desktop, cartes sur mobile
- **Sheet moderne** : Panneau latéral élégant pour le formulaire

### ⚡ Performance

- **Hooks optimisés** : Réduction des re-renders inutiles
- **Filtres côté client** : Réponse instantanée
- **Upload async** : Documents uploadés en arrière-plan

### 🎯 UX Améliorée

- **Recherche intelligente** : Sur nom, description, type, assigné
- **Filtres visuels** : Boutons clairs et intuitifs
- **Actions rapides** : Dropdown menu avec toutes les actions
- **Feedback visuel** : Toast notifications pour chaque action

## 🔄 Migration depuis l'ancienne structure

### Avant (1362 lignes)

```tsx
// tasks-page-table.tsx - Monolithique
- UI + Logic + State + API calls
- Duplication mobile/desktop
- Props drilling
- Difficile à maintenir
```

### Après (Structure modulaire)

```tsx
// TasksPageClient.tsx (50 lignes)
// TaskList.tsx (100 lignes)
// TaskTable.tsx (150 lignes)
// TaskCards.tsx (50 lignes)
// TaskForm.tsx (180 lignes)
// + hooks + helpers
```

## 🚀 Comment utiliser

### Créer une nouvelle tâche

```tsx
const { createTask } = useTaskMutations({ articleId, onTasksChange });
await createTask(taskData, documents);
```

### Filtrer et trier

```tsx
const {
  filteredTasks,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  handleSort,
} = useTaskFilters(initialTasks);
```

### Mutations (Update, Delete, Archive)

```tsx
const { updateTask, deleteTask, archiveTask } = useTaskMutations({
  articleId,
  onTasksChange: setTasks,
});
```

## 🎨 Design System

### Badges de Statut

- **À faire** : Bleu
- **En cours** : Jaune/Orange
- **Terminée** : Vert
- **Annulée** : Gris

### Composants UI

- Badge (Shadcn)
- Button (Shadcn)
- Input (Shadcn)
- Sheet (Shadcn)
- Table (Shadcn)
- Select (Shadcn)

## 📝 Types Principaux

```typescript
type Task = {
  id: string;
  name: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  taskType: string | null;
  realizationDate: Date | null;
  assignedTo: User | null;
  recurring: boolean;
  documents?: TaskDocument[];
  // ...
};
```

## 🔧 Prochaines Améliorations

- [ ] TaskDetail en composants modulaires
- [ ] Drag & Drop pour réorganiser les tâches
- [ ] Filtres avancés (dates, tags)
- [ ] Export CSV/PDF
- [ ] Notifications temps réel
- [ ] Virtualisation pour grandes listes
- [ ] Tests unitaires et E2E

## 📚 Ressources

- [Shadcn UI](https://ui.shadcn.com/)
- [Next.js 14](https://nextjs.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Sonner](https://sonner.emilkowal.ski/)

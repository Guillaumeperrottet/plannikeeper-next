# 📋 Page "Mes Tâches" - Vue Terrain

## Vue d'ensemble

La page **"Mes Tâches"** (`/dashboard/taskhub`) est désormais la **page d'accueil par défaut** après connexion. Elle permet de visualiser toutes vos tâches assignées en un seul endroit, parfait pour une utilisation terrain.

## 🎯 Objectif

Offrir une vue immédiate de **toutes les tâches** assignées à l'utilisateur sans avoir à naviguer à travers objets → secteurs → articles.

## ✨ Fonctionnalités

### 📊 Statistiques en Un Coup d'Œil

- **Total** : Nombre total de tâches assignées
- **Aujourd'hui** : Tâches à faire aujourd'hui
- **En retard** : Tâches passées non terminées
- **Terminées** : Tâches complétées

### 🔍 Recherche et Filtres

- **Recherche** : Par nom de tâche, article ou objet
- **Filtres rapides** :
  - Toutes
  - Aujourd'hui
  - Cette semaine
  - En retard

### 📱 Affichage Mobile-Friendly

- **Cards responsive** qui s'adaptent à tous les écrans
- **Vue compacte** par défaut avec informations essentielles
- **Vue expansible** avec tous les détails au clic

### 📌 Informations Visibles

#### Vue Compacte (toujours visible)

- Nom de la tâche
- Localisation : Objet → Secteur → Article
- Statut (badge coloré)
- Date de réalisation
- Nombre de documents
- Nombre de commentaires

#### Vue Détaillée (au clic sur chevron)

- Description complète
- Image du plan du secteur
- Liste des documents (3 premiers + compteur)
- Commentaires récents (2 premiers + compteur)

### 🎨 Badges de Statut

- 🟢 **Terminée** : Tâche marquée comme complétée
- 🔵 **En cours** : Tâche en progression
- 🔴 **En retard** : Date passée et non terminée
- ⚪ **À faire** : Tâche en attente

### 🖱️ Actions

- **Clic sur card** : Navigation vers la tâche complète
- **Clic sur chevron** : Expansion/Réduction des détails

## 📂 Structure des Fichiers

```
src/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       └── my-tasks/
│   │           └── route.ts         # API : Récupère les tâches de l'utilisateur
│   └── dashboard/
│       ├── page.tsx                 # Redirige vers /dashboard/taskhub
│       ├── objets/
│       │   └── page.tsx             # Ancienne page dashboard (liste objets)
│       └── taskhub/
│           ├── page.tsx             # Page serveur TaskHub
│           └── MyTasksClient.tsx    # Composant client avec logique
```

## 🔄 Navigation

### Menu Utilisateur Mis à Jour

Le menu utilisateur (clic sur avatar) contient maintenant :

- ✅ **Mes Tâches** → `/dashboard/taskhub` (nouveau)
- ✅ **Mes Objets** → `/dashboard/objets` (ancien dashboard)
- Mon profil
- Abonnement
- Archives
- etc.

### Redirection par Défaut

```typescript
// /dashboard -> /dashboard/taskhub
redirect("/dashboard/taskhub");
```

## 🛠️ API Endpoint

### `GET /api/tasks/my-tasks`

Récupère toutes les tâches assignées à l'utilisateur connecté.

**Données incluses :**

- Tâche complète (nom, description, statut, dates, etc.)
- Article → Secteur → Objet (hiérarchie complète)
- Documents attachés
- Commentaires avec utilisateurs
- Utilisateur assigné

**Permissions :**

- Admin : Voit toutes les tâches de l'organisation
- Membre : Voit uniquement les tâches des objets accessibles

**Tri par défaut :**

1. Statut (en cours d'abord)
2. Date de réalisation (plus tôt en premier)
3. Date de création (plus récent)

## 📱 Responsive Design

### Mobile (< 768px)

- Statistiques : 2 colonnes
- Cards : 1 colonne
- Filtres : scroll horizontal
- Recherche : pleine largeur

### Tablet (768px - 1024px)

- Statistiques : 4 colonnes
- Cards : 1 colonne

### Desktop (> 1024px)

- Statistiques : 4 colonnes
- Cards : 1 colonne (largeur optimale pour lecture)

## 🎯 Cas d'Usage Terrain

### Scénario 1 : Technicien sur le terrain

1. Se connecte le matin
2. Voit immédiatement ses **tâches du jour**
3. Filtre "Aujourd'hui" pour se concentrer
4. Clique sur une tâche → accès direct aux détails
5. Voit le plan du secteur pour se repérer
6. Consulte les documents techniques

### Scénario 2 : Gestionnaire multi-sites

1. Se connecte
2. Voit le **compteur "En retard"** en rouge
3. Filtre "En retard" pour prioriser
4. Recherche par nom d'objet pour un site spécifique
5. Traite les urgences en premier

### Scénario 3 : Contrôle qualité

1. Consulte toutes les tâches
2. Voit les commentaires récents directement
3. Clique pour développer et voir l'historique
4. Accède aux photos/documents sans navigation

## 🚀 Avantages

✅ **Gain de temps** : Plus besoin de naviguer dans la hiérarchie  
✅ **Vue d'ensemble** : Toutes les tâches en un coup d'œil  
✅ **Priorisation** : Filtres rapides pour se concentrer  
✅ **Mobile-first** : Parfait pour tablettes/smartphones  
✅ **Contexte complet** : Localisation, documents, commentaires  
✅ **Performance** : Chargement côté serveur puis cache client

## 🔮 Évolutions Futures Possibles

- [ ] Tri personnalisable (drag & drop)
- [ ] Vue Kanban (colonnes par statut)
- [ ] Actions rapides : Marquer terminé, commenter
- [ ] Notifications en temps réel
- [ ] Export PDF de la liste
- [ ] Filtres avancés (par type, couleur, etc.)
- [ ] Raccourcis clavier (j/k pour navigation)
- [ ] Mode hors-ligne avec synchronisation

## 📝 Notes Techniques

### Performance

- **SSR** pour le premier rendu
- **Client-side filtering** pour réactivité
- **SWR** pour cache et revalidation (si ajouté)
- Images du secteur lazy-loaded

### Sécurité

- Vérification des permissions par objet
- Filtrage selon rôle (admin/membre)
- Validation côté serveur

### Accessibilité

- Navigation clavier supportée
- Labels ARIA appropriés
- Contraste couleurs conforme

---

**Date de création** : 22 janvier 2026  
**Créé pour** : Usage terrain optimal de PlanniKeeper

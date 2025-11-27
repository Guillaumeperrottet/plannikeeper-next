# 🚀 Bouton de Création Rapide de Tâche

## Vue d'ensemble

Un **bouton flottant (FAB - Floating Action Button)** toujours visible qui permet de créer une tâche complète depuis n'importe quelle page du dashboard.

## Fonctionnalités

### ✨ Caractéristiques principales

1. **Toujours accessible**

   - Bouton fixe en bas à droite de l'écran
   - Visible sur toutes les pages du dashboard
   - Design responsive (adapté mobile/desktop)

2. **Détection automatique du contexte**

   - Détecte automatiquement l'objet, secteur et article actuel depuis l'URL
   - Pré-remplit les sélecteurs si vous êtes dans un contexte spécifique
   - Permet de changer l'emplacement si nécessaire

3. **Sélection en cascade**

   - Objet → Secteur → Article
   - Les secteurs se chargent après sélection de l'objet
   - Les articles se chargent après sélection du secteur

4. **Formulaire complet**

   - Nom de la tâche (requis)
   - Description (optionnel)
   - Statut (À faire, En cours, Terminée)
   - Date de réalisation
   - Assignation à un utilisateur (requis)
   - Récurrence (optionnel avec période et date de fin)

5. **Redirection intelligente**
   - Après création, redirection automatique vers la tâche créée
   - Permet de continuer le travail immédiatement

## Composants créés

### 1. `GlobalTaskButton.tsx`

Bouton flottant principal avec icône "+"

### 2. `QuickTaskDialog.tsx`

Dialog modal contenant le formulaire de création avec :

- Chargement des données (objets, secteurs, articles, utilisateurs)
- Validation des champs
- Gestion des états de chargement
- Animation des éléments

## APIs créées

### `GET /api/objets`

Récupère tous les objets accessibles par l'utilisateur (selon permissions)

### `GET /api/objets/[objetId]/sectors`

Récupère tous les secteurs d'un objet spécifique

### `GET /api/sectors/[sectorId]/articles` (existait déjà)

Récupère tous les articles d'un secteur spécifique

### `GET /api/users`

Récupère tous les utilisateurs de l'organisation

## Utilisation

### Depuis le dashboard principal

1. Cliquer sur le bouton "+" flottant
2. Sélectionner l'objet, secteur et article
3. Remplir les informations de la tâche
4. Cliquer sur "Créer la tâche"

### Depuis une page d'article/secteur

1. Cliquer sur le bouton "+" flottant
2. Le contexte est pré-rempli automatiquement
3. Remplir les informations de la tâche
4. Cliquer sur "Créer la tâche"

## Avantages pour le terrain

✅ **Gain de temps** - Pas besoin de naviguer jusqu'à l'article
✅ **Moins de clics** - Création en une seule étape
✅ **Contexte intelligent** - Détection automatique de la position actuelle
✅ **Toujours accessible** - Disponible partout dans l'application
✅ **Mobile-friendly** - Adapté aux écrans tactiles

## Évolutions futures possibles

- 📸 Capture photo directe depuis le formulaire
- 🎤 Dictée vocale pour la description
- 📍 Géolocalisation automatique
- 💾 Mode hors-ligne avec synchronisation
- 📋 Templates de tâches récurrentes
- 🔍 Scan QR code pour identification rapide

## Intégration

Le bouton est intégré dans le layout principal (`src/app/layout.tsx`) et s'affiche automatiquement pour tous les utilisateurs connectés.

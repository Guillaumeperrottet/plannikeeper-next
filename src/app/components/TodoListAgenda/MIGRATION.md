# 🔄 Guide de migration - TodoListAgenda

## ✅ Étape 1 : Vérifier que la nouvelle version fonctionne

La nouvelle architecture est déjà en place dans :

```
src/app/components/TodoListAgenda/
```

### Test local

1. **Démarrer le serveur de développement** :

```bash
npm run dev
# ou
pnpm dev
```

2. **Tester l'agenda** :

- Ouvrir l'application
- Vérifier que l'agenda s'affiche en bas
- Tester l'expansion/collapse
- Tester les filtres
- Tester la navigation vers les tâches
- Tester sur mobile (DevTools responsive)

## 🔄 Étape 2 : Basculer vers la nouvelle version

Le fichier `TodoListAgendaWrapper.tsx` utilise maintenant la nouvelle version automatiquement grâce à l'import :

```tsx
const TodoListAgenda = dynamic(() => import("./TodoListAgenda"), {
  ssr: false,
});
```

Cet import pointe maintenant vers `TodoListAgenda/index.tsx` qui exporte le nouveau `TodoListAgendaContainer`.

## 🧹 Étape 3 : Nettoyer l'ancien code (après validation)

### Fichiers à archiver/supprimer

1. **Ancien composant principal** :

```bash
# Renommer pour garder une backup
mv src/app/components/TodoListAgenda.tsx src/app/components/TodoListAgenda.OLD.tsx

# Ou supprimer directement après validation complète
rm src/app/components/TodoListAgenda.tsx
```

2. **Styles globaux à nettoyer** dans `src/app/globals.css` :

- Chercher tous les styles `[data-todo-list-agenda]`
- Les remplacer par les styles modulaires ou les supprimer

### Commande de nettoyage (après validation complète)

```bash
# Créer un backup
git add .
git commit -m "feat: refactor TodoListAgenda - nouvelle architecture modulaire"

# Supprimer l'ancien fichier
rm src/app/components/TodoListAgenda.tsx

# Nettoyer les styles dans globals.css (manuel)
# Chercher: [data-todo-list-agenda]
```

## 🎯 Étape 4 : Tests recommandés

### Tests fonctionnels

- [ ] Agenda s'ouvre/ferme correctement
- [ ] Changement de vue Liste/Calendrier
- [ ] Filtres fonctionnent (recherche, statut, article, assignation)
- [ ] Navigation vers les tâches
- [ ] Sélection d'objet
- [ ] Rafraîchissement manuel
- [ ] Drag & drop dans le calendrier (desktop)

### Tests mobile

- [ ] Bouton flottant s'affiche
- [ ] Haptic feedback fonctionne
- [ ] Scroll bloqué quand agenda ouvert
- [ ] Safe areas respectées (iPhone)
- [ ] PWA fonctionne correctement

### Tests de performance

```bash
# Ouvrir Chrome DevTools > Performance
# Enregistrer pendant l'ouverture/fermeture de l'agenda
# Vérifier qu'il n'y a pas de re-renders excessifs
```

## 📊 Comparaison avant/après

### Ancienne architecture

```
TodoListAgenda.tsx (1274 lignes)
├── 20+ états
├── Logique mélangée
├── Code dupliqué mobile/desktop
└── Difficile à maintenir
```

### Nouvelle architecture

```
TodoListAgenda/
├── index.tsx (4 lignes) ✅
├── TodoListAgendaContainer.tsx (250 lignes) ✅
├── 4 hooks custom ✅
├── 10 composants modulaires ✅
├── 3 fichiers utilitaires ✅
└── Styles modulaires ✅
```

## 🐛 Problèmes potentiels et solutions

### Problème 1 : Import échoue

**Solution** : Vérifier que le chemin d'import est correct

```tsx
// Dans TodoListAgendaWrapper.tsx
import("./TodoListAgenda"); // ✅ Correct
import("./TodoListAgenda/index"); // ✅ Alternative
```

### Problème 2 : Styles manquants

**Solution** : Vérifier que `agenda.module.css` est bien créé et l'importer si nécessaire

### Problème 3 : Types manquants

**Solution** : Tous les types sont dans `TodoListAgenda/types.ts`

### Problème 4 : CalendarView ne se charge pas

**Solution** : Vérifier que `CalendarView.tsx` existe dans `src/app/components/`

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier les erreurs dans la console
2. Vérifier les erreurs TypeScript
3. Consulter le README.md
4. Revenir à l'ancienne version temporairement :

```tsx
// Dans TodoListAgendaWrapper.tsx
const TodoListAgenda = dynamic(() => import("./TodoListAgenda.OLD"), {
  ssr: false,
});
```

## ✨ Nouvelles fonctionnalités possibles

Maintenant que l'architecture est modulaire, vous pouvez facilement :

1. **Ajouter de nouveaux filtres**

   - Créer un nouveau composant dans `AgendaControls/`
   - Ajouter le filtre dans `useAgendaFilters`

2. **Changer le design**

   - Modifier uniquement le composant concerné
   - Les autres ne sont pas affectés

3. **Ajouter des tests**

   - Chaque hook et composant peut être testé isolément

4. **Optimiser la performance**
   - Ajouter la virtualisation dans `ListView`
   - Les autres composants restent inchangés

---

**Bonne migration ! 🚀**

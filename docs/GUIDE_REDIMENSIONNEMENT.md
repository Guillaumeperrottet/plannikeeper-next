# 📐 Guide de Redimensionnement des Articles

## Comment redimensionner un article (chalet, emplacement, etc.)

### Méthode 1 : Depuis la page de visualisation (View)

1. **Cliquez sur l'article** que vous voulez redimensionner
2. Dans le menu qui apparaît, **cliquez sur "Redimensionner"** (icône carré)
3. **Des poignées vertes** apparaissent aux 4 coins de l'article
4. **Cliquez et faites glisser** une poignée pour ajuster la taille
5. **Relâchez** pour sauvegarder automatiquement

### Méthode 2 : Depuis la page d'édition (Edit)

1. Allez sur la page d'édition du secteur
2. **Cliquez sur l'article** pour le sélectionner
3. **Cliquez sur le bouton "Redimensionner"** dans la barre d'outils
4. **Des poignées bleues** apparaissent aux coins et sur les bords
5. **Faites glisser** les poignées pour ajuster la taille
6. La sauvegarde est **automatique**

## Nouvelles limites de taille

### Avant les modifications

- **Largeur minimale** : 5% de l'image
- **Largeur maximale** : 50% de l'image
- **Hauteur minimale** : 3% de l'image
- **Hauteur maximale** : 30% de l'image
- **Taille minimale en pixels** : 20px

### Après les modifications ✨

- **Largeur minimale** : 2% de l'image (60% plus petit !)
- **Largeur maximale** : 80% de l'image (60% plus grand !)
- **Hauteur minimale** : 1.5% de l'image (50% plus petit !)
- **Hauteur maximale** : 60% de l'image (100% plus grand !)
- **Taille minimale en pixels** : 10px (50% plus petit !)

## Astuces

### Pour des articles très petits

- Utilisez les **poignées de coin** pour un redimensionnement proportionnel
- Zoomez sur l'image avant de redimensionner pour plus de précision

### Pour des articles très grands

- Vous pouvez maintenant créer des articles couvrant jusqu'à 80% de la largeur
- Parfait pour marquer de grandes zones comme des parkings ou des zones communes

### En cas de problème

- Si l'article est trop petit pour être visible, allez en mode édition
- La liste des articles à gauche vous permet de sélectionner n'importe quel article
- Vous pouvez toujours le redimensionner depuis cette vue

## Notes techniques

Les modifications ont été apportées aux fichiers :

- `/src/app/components/ImageWithArticles.tsx` (page de visualisation)
- `/src/app/dashboard/objet/[id]/secteur/[sectorId]/edit/article-editor.tsx` (page d'édition)

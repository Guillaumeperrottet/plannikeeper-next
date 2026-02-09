// Tailles minimales pour les articles
export const MIN_ARTICLE_WIDTH_PERCENT = 5;
export const MIN_ARTICLE_HEIGHT_PERCENT = 3;
export const MAX_ARTICLE_WIDTH_PERCENT = 50;
export const MAX_ARTICLE_HEIGHT_PERCENT = 30;

// Valeurs par défaut pour la création d'articles
export const DEFAULT_ARTICLE_POSITION_X = 50;
export const DEFAULT_ARTICLE_POSITION_Y = 50;
export const DEFAULT_ARTICLE_WIDTH = 20;
export const DEFAULT_ARTICLE_HEIGHT = 15;

// Délai pour les timers de mise à jour des dimensions
export const DIMENSION_UPDATE_DELAYS = [100, 500, 1000] as const;

// Seuil de mouvement minimal pour considérer qu'un drag a eu lieu (en pixels)
export const MIN_DRAG_THRESHOLD = 3;

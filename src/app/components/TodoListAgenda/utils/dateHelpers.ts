// Utilitaires pour la manipulation des dates

/**
 * Normalise une date en fixant l'heure à midi pour éviter les problèmes de fuseau horaire
 */
export const normalizeDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  date.setHours(12, 0, 0, 0);
  return date;
};

/**
 * Formate une date pour affichage
 */
export const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleDateString();
};

/**
 * Formate une date au format YYYY-MM-DD pour les clés
 */
export const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * Formate une date en texte long lisible
 */
export const formatDateLong = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Obtient la date de fin de semaine
 */
export const getThisWeekEnd = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));
  return thisWeekEnd;
};

/**
 * Vérifie si une date est dans la semaine en cours
 */
export const isThisWeek = (date: Date | null): boolean => {
  if (!date) return false;
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  const thisWeekEnd = getThisWeekEnd();
  return taskDate <= thisWeekEnd;
};

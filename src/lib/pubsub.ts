// src/lib/pubsub.ts
type EventCallback = (data?: unknown) => void;

interface EventSubscription {
  unsubscribe: () => void;
}

class PubSubSystem {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * S'abonne à un événement
   * @param eventName Nom de l'événement
   * @param callback Fonction à appeler lors de l'événement
   * @returns Objet permettant de se désabonner
   */
  subscribe(eventName: string, callback: EventCallback): EventSubscription {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    const callbacks = this.events.get(eventName)!;
    callbacks.add(callback);

    return {
      unsubscribe: () => {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(eventName);
        }
      },
    };
  }

  /**
   * Publie un événement
   * @param eventName Nom de l'événement
   * @param data Données à transmettre (optionnel)
   */
  publish(eventName: string, data?: unknown): void {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(
          `Erreur lors de l'exécution d'un callback pour l'événement ${eventName}:`,
          error
        );
      }
    });
  }
}

// Créer une instance unique exportée pour toute l'application
export const pubSub = new PubSubSystem();

// Constantes pour les noms d'événements
export const DATA_EVENTS = {
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_DELETED: "task:deleted",
  ARTICLE_CREATED: "article:created",
  ARTICLE_UPDATED: "article:updated",
  ARTICLE_DELETED: "article:deleted",
  OBJECT_UPDATED: "object:updated",
  AGENDA_REFRESH_NEEDED: "agenda:refreshNeeded",
};

// Hook pour utiliser le PubSub dans les composants React
import { useEffect } from "react";

export function usePubSub(eventName: string, callback: EventCallback) {
  useEffect(() => {
    const subscription = pubSub.subscribe(eventName, callback);

    // Nettoyage lors du démontage du composant
    return () => subscription.unsubscribe();
  }, [eventName, callback]);
}

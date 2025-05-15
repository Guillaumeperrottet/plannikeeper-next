// src/lib/offline-sync.ts
/**
 * Gestionnaire de synchronisation hors-ligne pour PlanniKeeper
 * Permet de stocker et synchroniser les actions effectuées hors-ligne
 */

// Types d'opérations supportées
export type OfflineOperation = "CREATE" | "UPDATE" | "DELETE";

// Structure d'une action en attente
export interface PendingAction {
  id: string;
  timestamp: number;
  entity: string; // 'task', 'article', 'comment', etc.
  operation: OfflineOperation;
  entityId?: string;
  data: unknown;
  endpoint: string;
  method: string;
  retryCount: number;
  resolved: boolean;
}

// Nom du stockage dans IndexedDB
const DB_NAME = "plannikeeper-offline";
const STORE_NAME = "pending-actions";
const MAX_RETRY = 3;

/**
 * Initialise la base de données IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error("Erreur lors de l'ouverture de la base IndexedDB", event);
      reject("Impossible d'ouvrir la base de données");
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Créer le store d'objets pour les actions en attente
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("entity", "entity", { unique: false });
        store.createIndex("resolved", "resolved", { unique: false });
      }
    };
  });
}

/**
 * Ajoute une action à la file d'attente
 */
export async function queueAction(
  entity: string,
  operation: OfflineOperation,
  data: unknown,
  endpoint: string,
  method: string,
  entityId?: string
): Promise<void> {
  try {
    const db = await initDB();

    const action: PendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      timestamp: Date.now(),
      entity,
      operation,
      entityId,
      data,
      endpoint,
      method,
      retryCount: 0,
      resolved: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const request = store.add(action);

      request.onsuccess = () => {
        resolve();

        // Tenter de synchroniser immédiatement si en ligne
        if (navigator.onLine) {
          synchronize().catch(console.error);
        }

        // Notifier l'application qu'il y a des actions en attente
        window.dispatchEvent(new CustomEvent("pendingActionsChange"));
      };

      request.onerror = (event) => {
        console.error("Erreur lors de l'ajout de l'action en attente", event);
        reject("Impossible d'ajouter l'action en attente");
      };
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise en file d'attente de l'action",
      error
    );
    throw error;
  }
}

/**
 * Récupère toutes les actions en attente
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      // Option 1 : Utiliser getAll() sans paramètre et filtrer après
      const request = store.getAll();

      request.onsuccess = (event) => {
        const actions = (event.target as IDBRequest).result;
        const pendingActions = actions.filter((action) => !action.resolved);
        resolve(pendingActions);
      };

      // Option 2 : Si vous avez modifié votre schéma pour stocker resolved comme 0/1
      // const index = store.index("resolved");
      // const request = index.getAll(IDBKeyRange.only(0));

      request.onerror = (event) => {
        console.error(
          "Erreur lors de la récupération des actions en attente",
          event
        );
        reject("Impossible de récupérer les actions en attente");
      };
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des actions en attente",
      error
    );
    return [];
  }
}

/**
 * Met à jour une action en attente
 */
async function updatePendingAction(action: PendingAction): Promise<void> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put(action);

      request.onsuccess = () => {
        resolve();

        // Notifier l'application que les actions en attente ont changé
        window.dispatchEvent(new CustomEvent("pendingActionsChange"));
      };

      request.onerror = (event) => {
        console.error(
          "Erreur lors de la mise à jour de l'action en attente",
          event
        );
        reject("Impossible de mettre à jour l'action en attente");
      };
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de l'action en attente",
      error
    );
    throw error;
  }
}

/**
 * Supprime une action en attente
 */
async function removePendingAction(actionId: string): Promise<void> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const request = store.delete(actionId);

      request.onsuccess = () => {
        resolve();

        // Notifier l'application que les actions en attente ont changé
        window.dispatchEvent(new CustomEvent("pendingActionsChange"));
      };

      request.onerror = (event) => {
        console.error(
          "Erreur lors de la suppression de l'action en attente",
          event
        );
        reject("Impossible de supprimer l'action en attente");
      };
    });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de l'action en attente",
      error
    );
    throw error;
  }
}

/**
 * Traite une action en attente
 */
async function processAction(action: PendingAction): Promise<boolean> {
  try {
    // Incrémenter le compteur de tentatives
    action.retryCount++;
    await updatePendingAction(action);

    // Construire l'URL complète
    const baseUrl = window.location.origin;
    const url = `${baseUrl}${action.endpoint}`;

    // Effectuer la requête
    const response = await fetch(url, {
      method: action.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.data),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    // Marquer l'action comme résolue
    action.resolved = true;
    await updatePendingAction(action);

    // Nettoyer après un certain temps
    setTimeout(() => {
      removePendingAction(action.id).catch(console.error);
    }, 60000); // Supprime après 1 minute

    return true;
  } catch (error) {
    console.error(`Erreur lors du traitement de l'action ${action.id}:`, error);

    // Si nombre max de tentatives atteint, marquer comme résolue avec erreur
    if (action.retryCount >= MAX_RETRY) {
      action.resolved = true;
      await updatePendingAction(action);

      // Notifier l'utilisateur de l'échec
      console.error(
        `L'action ${action.id} a échoué après ${MAX_RETRY} tentatives`
      );
    }

    return false;
  }
}

/**
 * Synchronise toutes les actions en attente
 */
export async function synchronize(): Promise<void> {
  if (!navigator.onLine) {
    console.log("Hors ligne, synchronisation reportée");
    return;
  }

  try {
    // Récupérer toutes les actions en attente non résolues
    const actions = await getPendingActions();

    if (actions.length === 0) {
      return;
    }

    console.log(`Synchronisation de ${actions.length} actions en attente...`);

    // Traiter les actions dans l'ordre chronologique
    const sortedActions = actions.sort((a, b) => a.timestamp - b.timestamp);

    for (const action of sortedActions) {
      if (!action.resolved) {
        await processAction(action);
      }
    }

    console.log("Synchronisation terminée");
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
  }
}

// Configurer les événements en ligne/hors ligne
export function setupOfflineSync() {
  // Synchroniser lorsque la connexion est rétablie
  window.addEventListener("online", () => {
    console.log("Connexion rétablie, synchronisation...");
    synchronize().catch(console.error);
  });

  // Notifier lorsque la connexion est perdue
  window.addEventListener("offline", () => {
    console.log("Connexion perdue, les actions seront mises en file d'attente");
  });

  // Vérifier et synchroniser périodiquement
  setInterval(
    () => {
      if (navigator.onLine) {
        synchronize().catch(console.error);
      }
    },
    5 * 60 * 1000
  ); // Toutes les 5 minutes

  // Synchroniser au chargement de la page
  if (navigator.onLine) {
    synchronize().catch(console.error);
  }
}

/**
 * Wrapper pour les requêtes fetch avec prise en charge hors ligne
 */
export async function fetchWithOfflineSupport(
  endpoint: string,
  method: string,
  entity: string,
  data: unknown,
  entityId?: string
): Promise<Response> {
  // Si en ligne, tenter la requête normalement
  if (navigator.onLine) {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return response;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      // Si une erreur se produit (serveur indisponible, etc.), mettre en file d'attente
      console.warn("Erreur réseau, mise en file d'attente de l'action", error);
    }
  }

  // Déterminer l'opération basée sur la méthode HTTP
  let operation: OfflineOperation = "UPDATE";
  if (method === "POST" && !entityId) operation = "CREATE";
  if (method === "DELETE") operation = "DELETE";

  // Mettre l'action en file d'attente
  await queueAction(entity, operation, data, endpoint, method, entityId);

  // Retourner une réponse simulée
  return new Response(
    JSON.stringify({
      offlineQueued: true,
      message: "Action mise en file d'attente pour synchronisation ultérieure",
    }),
    {
      status: 202,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

// Compteur d'actions en attente pour le badge d'UI
export async function getPendingActionsCount(): Promise<number> {
  const actions = await getPendingActions();
  return actions.length;
}

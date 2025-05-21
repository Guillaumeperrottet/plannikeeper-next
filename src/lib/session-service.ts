// src/lib/session-service.ts
import { authClient } from "./auth-client";

// Durée d'inactivité maximale (4 heures en millisecondes)
export const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000;

export const SessionService = {
  /**
   * Initialise le suivi de session
   */
  init() {
    // Définir l'activité initiale
    this.updateLastActivity();

    // Marquer que l'application est active
    localStorage.setItem("appActive", "true");

    // Gestionnaires d'événements pour l'activité utilisateur
    const events = ["mousedown", "keypress", "click", "touchstart", "scroll"];
    events.forEach((event) => {
      document.addEventListener(event, () => this.updateLastActivity());
    });

    // Gérer la visibilité et la fermeture
    document.addEventListener("visibilitychange", () =>
      this.handleVisibilityChange()
    );
    window.addEventListener("beforeunload", () => this.handleBeforeUnload());

    // Vérifier si l'application a été fermée précédemment
    this.checkIfWasClosed();

    // Vérifier l'inactivité au chargement
    this.checkInactivity();

    // Vérifier périodiquement l'inactivité
    setInterval(() => this.checkInactivity(), 60 * 1000);
  },

  /**
   * Met à jour le timestamp de dernière activité
   */
  updateLastActivity() {
    const timestamp = Date.now();
    localStorage.setItem("lastActivityTime", timestamp.toString());
  },

  /**
   * Vérifie l'inactivité de l'utilisateur
   */
  checkInactivity() {
    const lastActivity = parseInt(
      localStorage.getItem("lastActivityTime") || "0",
      10
    );
    const currentTime = Date.now();

    if (currentTime - lastActivity > INACTIVITY_TIMEOUT) {
      this.logout("inactivity");
    }
  },

  /**
   * Gère les changements de visibilité de la page
   */
  handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
      localStorage.setItem("appHiddenAt", Date.now().toString());
    } else {
      // Vérifier s'il y a eu une déconnexion forcée
      if (localStorage.getItem("forceLogout") === "true") {
        localStorage.removeItem("forceLogout");
        window.location.href = "/signin";
      }
    }
  },

  /**
   * Gère l'événement beforeunload (fermeture potentielle)
   */
  handleBeforeUnload() {
    localStorage.setItem("appClosing", "true");
  },

  /**
   * Vérifie si l'application a été complètement fermée
   */
  checkIfWasClosed() {
    if (localStorage.getItem("appClosing") === "true") {
      localStorage.removeItem("appClosing");
      this.logout("appClosed");
    }
  },

  /**
   * Déconnecte l'utilisateur
   */
  async logout(reason = "unknown") {
    try {
      await authClient.signOut();
      localStorage.setItem("forceLogout", "true");
      localStorage.setItem("logoutReason", reason);

      // Rediriger immédiatement si nous sommes dans le contexte actif
      if (document.visibilityState === "visible") {
        window.location.href = "/signin";
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  },
};

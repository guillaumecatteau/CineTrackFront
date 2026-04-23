/**
 * AuthManager — Gestion de l'authentification et du profil utilisateur
 * API : CineTrackBack/Api/auth.php
 * Actions : register, login, getUser, updateProfile, logout
 */

class AuthManager {

    /**
     * Préfixe de chemin calculé dynamiquement.
     * Permet d'appeler l'API depuis n'importe quel sous-dossier sans changer l'URL.
     */
    static PROJECT_BASE = window.location.pathname.includes('/CineTrackFront/')
        ? window.location.pathname.split('/CineTrackFront/')[0]
        : '';

    static API_URL = `${AuthManager.PROJECT_BASE}/CineTrackBack/Api/auth.php`;

    // ─── Utilitaire interne ────────────────────────────────────────────────────

    /**
     * Envoie une requête POST JSON à l'API d'authentification.
     * Centralise le boilerplate fetch/json — tous les appels publics passent par ici.
     *
     * @param {Object} payload      - Corps de la requête (sérialisé en JSON)
     * @param {Object} [fallback={}] - Propriétés ajoutées à la réponse en cas d'erreur réseau
     * @returns {Promise<Object>} Réponse parsée de l'API
     */
    static async _post(payload, fallback = {}) {
        try {
            const res = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return await res.json();
        } catch (err) {
            console.error(`[AuthManager] Erreur réseau (action: ${payload.action}) :`, err);
            return { success: false, message: 'Erreur réseau', ...fallback };
        }
    }

    // ─── API publique ──────────────────────────────────────────────────────────

    /**
     * Inscription d'un nouvel utilisateur
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    static async register(username, email, password) {
        return this._post({ action: 'register', username, email, password });
    }

    /**
     * Connexion d'un utilisateur.
     * Persiste userId et username dans localStorage en cas de succès.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    static async login(email, password) {
        const response = await this._post({ action: 'login', email, password });
        if (response.success && response.user) {
            localStorage.setItem('userId',   response.user.id);
            localStorage.setItem('username', response.user.username);
        }
        return response;
    }

    /**
     * Récupérer les informations d'un utilisateur par son ID
     * @param {number} userId
     * @returns {Promise<Object>}
     */
    static async getUser(userId) {
        return this._post({ action: 'getUser', userId });
    }

    /**
     * Mettre à jour le profil utilisateur.
     * Si data contient username, met aussi à jour localStorage.
     * @param {number} userId
     * @param {Object} data - Champs modifiables : username, email, password
     * @returns {Promise<Object>}
     */
    static async updateProfile(userId, data) {
        const response = await this._post({ action: 'updateProfile', userId, ...data });
        if (response.success && data.username) {
            localStorage.setItem('username', data.username);
        }
        return response;
    }

    // ─── Gestion locale de session ─────────────────────────────────────────────

    /**
     * Déconnexion côté client : supprime les données de session du localStorage.
     * Il n'y a pas d'appel API — le back-end est sans état (pas de session serveur).
     */
    static logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
    }

    /** @returns {boolean} Vrai si userId est présent dans localStorage */
    static isLoggedIn() {
        return localStorage.getItem('userId') !== null;
    }

    /** @returns {number|null} ID de l'utilisateur connecté, ou null */
    static getCurrentUserId() {
        const id = localStorage.getItem('userId');
        return id ? parseInt(id) : null;
    }
}

export default AuthManager;


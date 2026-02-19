/**
 * AuthManager - Gestion de l'authentification et du profil utilisateur
 * API: auth.php
 * Actions: register, login, getUser, updateProfile
 */

class AuthManager {
    
    static API_URL = 'http://localhost/CineTrackBack/Api/auth.php';

    /**
     * Inscription d'un nouvel utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} email - Adresse email
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async register(username, email, password) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'register',
            username: username,
            email: email,
            password: password
        });

        try {
            const result = await fetch(AuthManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Inscription réussie");
            } else {
                console.warn("Échec de l'inscription:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête d'inscription :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Connexion d'un utilisateur
     * @param {string} email - Adresse email
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async login(email, password) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'login',
            email: email,
            password: password
        });

        try {
            const result = await fetch(AuthManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success && response.user) {
                // Stocker l'ID utilisateur dans localStorage
                localStorage.setItem('userId', response.user.id);
                localStorage.setItem('username', response.user.username);
                console.log("Connexion réussie pour:", response.user.username);
            } else {
                console.warn("Échec de la connexion:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de connexion :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer les informations d'un utilisateur par ID
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getUser(userId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getUser',
            userId: userId
        });

        try {
            const result = await fetch(AuthManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Erreur lors de la récupération de l'utilisateur:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getUser :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Mettre à jour le profil utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {Object} data - Données à mettre à jour (username, email, password)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async updateProfile(userId, data) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'updateProfile',
            userId: userId,
            ...data
        });

        try {
            const result = await fetch(AuthManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Profil mis à jour avec succès");
                // Mettre à jour le username dans localStorage si modifié
                if (data.username) {
                    localStorage.setItem('username', data.username);
                }
            } else {
                console.warn("Échec de la mise à jour du profil:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de mise à jour du profil :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Déconnexion de l'utilisateur (côté client)
     */
    static logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        console.log("Déconnexion réussie");
    }

    /**
     * Vérifier si un utilisateur est connecté
     * @returns {boolean}
     */
    static isLoggedIn() {
        return localStorage.getItem('userId') !== null;
    }

    /**
     * Récupérer l'ID de l'utilisateur connecté
     * @returns {number|null}
     */
    static getCurrentUserId() {
        const userId = localStorage.getItem('userId');
        return userId ? parseInt(userId) : null;
    }
}

export default AuthManager;

/**
 * UserMovieManager - Gestion des films de l'utilisateur
 * API: user-movies.php
 * Actions: addMovie, getAllMovies, getWatchedMovies, getWatchlist, 
 *          getMovie, updateMovie, deleteMovie, getStats
 */

class UserMovieManager {
    
    static API_URL = 'http://localhost/CineTrackBack/Api/user-movies.php';

    /**
     * Ajouter un film à la collection de l'utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {string} imdbId - ID IMDb du film
     * @param {boolean} isWatched - Film déjà regardé ou non (par défaut false)
     * @param {number|null} rating - Note du film entre 1 et 10 (optionnel)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async addMovie(userId, imdbId, isWatched = false, rating = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'addMovie',
            userId: userId,
            imdbId: imdbId,
            isWatched: isWatched,
            rating: rating
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Film ajouté avec succès à la collection");
            } else {
                console.warn("Échec de l'ajout du film:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête d'ajout de film :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer tous les films d'un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getAllMovies(userId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getAllMovies',
            userId: userId
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des films:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getAllMovies :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer les films regardés d'un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getWatchedMovies(userId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getWatchedMovies',
            userId: userId
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des films regardés:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getWatchedMovies :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer la watchlist (films à regarder) d'un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getWatchlist(userId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getWatchlist',
            userId: userId
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération de la watchlist:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getWatchlist :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer un film spécifique de la collection
     * @param {number} id - ID du film dans la base de données
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getMovie(id) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getMovie',
            id: id
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération du film:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getMovie :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Mettre à jour un film de la collection
     * @param {number} id - ID du film dans la base de données
     * @param {Object} data - Données à mettre à jour (isWatched, rating)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async updateMovie(id, data) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'updateMovie',
            id: id,
            ...data
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Film mis à jour avec succès");
            } else {
                console.warn("Échec de la mise à jour du film:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de mise à jour du film :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Supprimer un film de la collection
     * @param {number} id - ID du film dans la base de données
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async deleteMovie(id) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'deleteMovie',
            id: id
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Film supprimé avec succès");
            } else {
                console.warn("Échec de la suppression du film:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de suppression du film :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer les statistiques des films de l'utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getStats(userId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getStats',
            userId: userId
        });

        try {
            const result = await fetch(UserMovieManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des statistiques:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getStats :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }
}

export default UserMovieManager;

/**
 * TagManager - Gestion des tags pour les films utilisateur
 * API: tags.php
 * Actions: addTag, addMultipleTags, getTagsByMovie, getMoviesByTag, 
 *          getAllUserTags, deleteTag, deleteAllTags, toggleLike, toggleDislike
 */

class TagManager {
    
    static PROJECT_BASE = window.location.pathname.includes('/CineTrackFront/')
        ? window.location.pathname.split('/CineTrackFront/')[0]
        : '';

    static API_URL = `${TagManager.PROJECT_BASE}/CineTrackBack/Api/tags.php`;

    /**
     * Ajouter un tag à un film
     * @param {number} userMovieId - ID du film utilisateur
     * @param {string} tag - Nom du tag
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async addTag(userMovieId, tag) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'addTag',
            userMovieId: userMovieId,
            tag: tag
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Tag ajouté avec succès");
            } else {
                console.warn("Échec de l'ajout du tag:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête d'ajout de tag :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Ajouter plusieurs tags à un film
     * @param {number} userMovieId - ID du film utilisateur
     * @param {Array<string>} tags - Liste des tags
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async addMultipleTags(userMovieId, tags) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'addMultipleTags',
            userMovieId: userMovieId,
            tags: tags
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Tags ajoutés avec succès");
            } else {
                console.warn("Échec de l'ajout des tags:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête d'ajout de tags :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer tous les tags d'un film
     * @param {number} userMovieId - ID du film utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getTagsByMovie(userMovieId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getTagsByMovie',
            userMovieId: userMovieId
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des tags:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getTagsByMovie :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer tous les films ayant un tag spécifique
     * @param {number} userId - ID de l'utilisateur
     * @param {string} tag - Nom du tag
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getMoviesByTag(userId, tag) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getMoviesByTag',
            userId: userId,
            tag: tag
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des films par tag:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getMoviesByTag :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer tous les tags uniques d'un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getAllUserTags(userId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getAllUserTags',
            userId: userId
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des tags utilisateur:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getAllUserTags :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Supprimer un tag spécifique d'un film
     * @param {number} userMovieId - ID du film utilisateur
     * @param {string} tag - Nom du tag
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async deleteTag(userMovieId, tag) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'deleteTag',
            userMovieId: userMovieId,
            tag: tag
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Tag supprimé avec succès");
            } else {
                console.warn("Échec de la suppression du tag:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de suppression de tag :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Supprimer tous les tags d'un film
     * @param {number} userMovieId - ID du film utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async deleteAllTags(userMovieId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'deleteAllTags',
            userMovieId: userMovieId
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Tous les tags supprimés avec succès");
            } else {
                console.warn("Échec de la suppression des tags:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de suppression de tous les tags :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Basculer le tag "liked" pour un film (ajouter/supprimer)
     * @param {number} userMovieId - ID du film utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async toggleLike(userMovieId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'toggleLike',
            userMovieId: userMovieId
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Like basculé avec succès");
            } else {
                console.warn("Échec du basculement du like:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête toggleLike :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Basculer le tag "disliked" pour un film (ajouter/supprimer)
     * @param {number} userMovieId - ID du film utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async toggleDislike(userMovieId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'toggleDislike',
            userMovieId: userMovieId
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Dislike basculé avec succès");
            } else {
                console.warn("Échec du basculement du dislike:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête toggleDislike :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    // ═══════════════════════════════════════════════════
    // MÉTHODES POUR TMDb (films identifiés par tmdb_id + media_type)
    // ═══════════════════════════════════════════════════

    /**
     * Ajouter un film TMDb avec ses tags (crée le film automatiquement si nécessaire)
     * @param {number} userId - ID de l'utilisateur
     * @param {number} tmdbId - ID TMDb du film
     * @param {string} mediaType - Type de média ('movie' ou 'tv')
     * @param {Array<string>} tags - Liste des tags
     * @param {boolean} isWatched - Film déjà vu ou non
     * @param {number|null} rating - Note du film
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async addTmdbMovieWithTags(userId, tmdbId, mediaType = 'movie', tags = [], isWatched = false, rating = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'addTmdbMovieWithTags',
            userId: userId,
            tmdbId: tmdbId,
            mediaType: mediaType,
            tags: tags,
            isWatched: isWatched,
            rating: rating
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Film TMDb ajouté avec tags");
            } else {
                console.warn("Échec de l'ajout du film TMDb:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête addTmdbMovieWithTags :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer les tags d'un film TMDb pour un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {number} tmdbId - ID TMDb du film
     * @param {string} mediaType - Type de média ('movie' ou 'tv')
     * @returns {Promise<Object>} Réponse de l'API avec les tags
     */
    static async getTagsByTmdbId(userId, tmdbId, mediaType = 'movie') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getTagsByTmdbId',
            userId: userId,
            tmdbId: tmdbId,
            mediaType: mediaType
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des tags TMDb:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getTagsByTmdbId :", error);
            return { success: false, message: "Erreur réseau", tags: [] };
        }
    }

    /**
     * Basculer le tag 'liked' pour un film TMDb
     * @param {number} userId - ID de l'utilisateur
     * @param {number} tmdbId - ID TMDb du film
     * @param {string} mediaType - Type de média ('movie' ou 'tv')
     * @returns {Promise<Object>} Réponse de l'API avec l'état du tag
     */
    static async toggleTmdbLike(userId, tmdbId, mediaType = 'movie') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'toggleTmdbLike',
            userId: userId,
            tmdbId: tmdbId,
            mediaType: mediaType
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Like TMDb basculé:", response.state);
            } else {
                console.warn("Échec du basculement du like TMDb:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête toggleTmdbLike :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Basculer le tag 'disliked' pour un film TMDb
     * @param {number} userId - ID de l'utilisateur
     * @param {number} tmdbId - ID TMDb du film
     * @param {string} mediaType - Type de média ('movie' ou 'tv')
     * @returns {Promise<Object>} Réponse de l'API avec l'état du tag
     */
    static async toggleTmdbDislike(userId, tmdbId, mediaType = 'movie') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'toggleTmdbDislike',
            userId: userId,
            tmdbId: tmdbId,
            mediaType: mediaType
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Dislike TMDb basculé:", response.state);
            } else {
                console.warn("Échec du basculement du dislike TMDb:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête toggleTmdbDislike :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Basculer un tag personnalisé pour un film TMDb
     * @param {number} userId - ID de l'utilisateur
     * @param {number} tmdbId - ID TMDb du film
     * @param {string} mediaType - Type de média ('movie' ou 'tv')
     * @param {string} tagName - Nom du tag
     * @returns {Promise<Object>} Réponse de l'API avec l'état du tag
     */
    static async toggleTmdbTag(userId, tmdbId, mediaType = 'movie', tagName) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'toggleTmdbTag',
            userId: userId,
            tmdbId: tmdbId,
            mediaType: mediaType,
            tag: tagName
        });

        try {
            const result = await fetch(TagManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success) {
                console.log("Tag TMDb basculé:", tagName, response.state);
            } else {
                console.warn("Échec du basculement du tag TMDb:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête toggleTmdbTag :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Afficher une notification temporaire
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification ('success', 'error', 'info')
     */
    static showNotification(message, type = 'info') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: fadeIn 0.3s ease-out;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;

        // Ajouter au DOM
        document.body.appendChild(notification);

        // Retirer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

export default TagManager;

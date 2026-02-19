/**
 * TagManager - Gestion des tags pour les films utilisateur
 * API: tags.php
 * Actions: addTag, addMultipleTags, getTagsByMovie, getMoviesByTag, 
 *          getAllUserTags, deleteTag, deleteAllTags, toggleLike, toggleDislike
 */

class TagManager {
    
    static API_URL = 'http://localhost/CineTrackBack/Api/tags.php';

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
}

export default TagManager;

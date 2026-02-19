/**
 * SearchManager - Gestion de la recherche de films via OMDB
 * API: search.php
 * Actions: search, getDetails, getByTitle, checkApiKey
 */

class SearchManager {
    
    static API_URL = 'http://localhost/CineTrackBack/Api/search.php';

    /**
     * Rechercher des films par titre
     * @param {string} title - Titre du film à rechercher
     * @param {number} page - Numéro de la page (par défaut 1)
     * @param {string|null} year - Année de sortie (optionnel)
     * @param {string} type - Type de média (movie, series, episode)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async search(title, page = 1, year = null, type = 'movie') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'search',
            title: title,
            page: page,
            year: year,
            type: type
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la recherche:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de recherche :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer les détails d'un film par son ID IMDb
     * @param {string} imdbId - ID IMDb du film
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getDetails(imdbId) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getDetails',
            imdbId: imdbId
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (!response.success) {
                console.warn("Échec de la récupération des détails:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de détails :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer un film spécifique par titre exact
     * @param {string} title - Titre exact du film
     * @param {string|null} year - Année de sortie (optionnel)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getByTitle(title, year = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getByTitle',
            title: title,
            year: year
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
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
            console.error("Erreur lors de la requête getByTitle :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Vérifier si la clé API OMDB est valide
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async checkApiKey() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'checkApiKey'
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log(response);

            if (response.success && response.isValid) {
                console.log("Clé API OMDB valide");
            } else {
                console.warn("Clé API OMDB invalide");
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la vérification de la clé API :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }
}

export default SearchManager;

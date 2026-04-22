/**
 * SearchManager - Gestion de la recherche de films via TMDb (The Movie Database)
 * API: search.php
 * Actions: getTrending, search, searchTV, getMovieDetails, getTVShowDetails, checkToken
 */

class SearchManager {
    
    static PROJECT_BASE = window.location.pathname.includes('/CineTrackFront/')
        ? window.location.pathname.split('/CineTrackFront/')[0]
        : '';

    static API_URL = `${SearchManager.PROJECT_BASE}/CineTrackBack/Api/search.php`;

    /**
     * Récupérer les films/séries trending
     * @param {string} mediaType - Type de média (movie, tv, all) - par défaut 'all'
     * @param {string} timeWindow - Fenêtre de temps (day, week) - par défaut 'day'
     * @param {string} language - Langue des résultats (fr-EU, en-US) - par défaut 'fr-EU'
     * @param {number} page - Numéro de la page (par défaut 1)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getTrending(mediaType = 'all', timeWindow = 'day', language = 'fr-EU', page = 1) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getTrending',
            mediaType: mediaType,
            timeWindow: timeWindow,
            language: language,
            page: page
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log('Trending:', response);

            if (!response.success) {
                console.warn("Échec de la récupération des trending:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête getTrending :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Rechercher des films par titre
     * @param {string} title - Titre du film à rechercher
     * @param {number} page - Numéro de la page (par défaut 1)
     * @param {string|null} year - Année de sortie (optionnel)
     * @param {string} language - Langue des résultats (par défaut fr-EU)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async search(title, page = 1, year = null, language = 'fr-EU') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'search',
            title: title,
            page: page,
            year: year,
            language: language
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log('Search results:', response);

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
     * Rechercher des séries TV par titre
     * @param {string} title - Titre de la série à rechercher
     * @param {number} page - Numéro de la page (par défaut 1)
     * @param {string} language - Langue des résultats (par défaut fr-EU)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async searchTV(title, page = 1, language = 'fr-EU') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'searchTV',
            title: title,
            page: page,
            language: language
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log('TV Search results:', response);

            if (!response.success) {
                console.warn("Échec de la recherche de séries:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de recherche TV :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer les détails d'un film par son ID TMDb
     * @param {number} movieId - ID TMDb du film
     * @param {string} language - Langue des résultats (par défaut fr-EU)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getMovieDetails(movieId, language = 'fr-EU') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getMovieDetails',
            movieId: movieId,
            language: language
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log('Movie details:', response);

            if (!response.success) {
                console.warn("Échec de la récupération des détails:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de détails du film :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Récupérer les détails d'une série TV par son ID TMDb
     * @param {number} tvId - ID TMDb de la série
     * @param {string} language - Langue des résultats (par défaut fr-EU)
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async getTVShowDetails(tvId, language = 'fr-EU') {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'getTVShowDetails',
            tvId: tvId,
            language: language
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log('TV Show details:', response);

            if (!response.success) {
                console.warn("Échec de la récupération des détails de la série:", response.message);
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la requête de détails de la série :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }

    /**
     * Vérifier si le Bearer token TMDb est valide
     * @returns {Promise<Object>} Réponse de l'API
     */
    static async checkToken() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            action: 'checkToken'
        });

        try {
            const result = await fetch(SearchManager.API_URL, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            const response = await result.json();
            console.log('Token check:', response);

            if (response.success && response.isValid) {
                console.log("Token TMDb valide");
            } else {
                console.warn("Token TMDb invalide");
            }

            return response;
        } catch (error) {
            console.error("Erreur lors de la vérification du token :", error);
            return { success: false, message: "Erreur réseau" };
        }
    }
}

export default SearchManager;

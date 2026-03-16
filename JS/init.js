/**
 * init.js - Initialisation de l'interface et gestion des formulaires d'authentification
 */

// ═══════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════
import AuthManager from './Manager/AuthManager.js';
import SearchManager from './Manager/SearchManager.js';
import TagManager from './Manager/TagManager.js';
import UserMovieManager from './Manager/UserMovieManager.js';
import { handleConnexion, handleRegistration, updateHeaderButtons, initConnexion } from './connexion.js';

// ═══════════════════════════════════════════════════
// CONSTANTES ET ÉLÉMENTS DOM
// ═══════════════════════════════════════════════════
const titleInput = document.getElementById("title");
const yearInput = document.getElementById("year");
const typeSelect = document.getElementById("type");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results-container");

// ═══════════════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════════════

// ───────────────────────────────────────────────────
// Gestion des tags
// ───────────────────────────────────────────────────

/**
 * Charger l'état des tags d'un film
 * @param {number} tmdbId - ID TMDb du film
 * @param {string} mediaType - Type de média
 * @param {HTMLElement} likeBtn - Bouton like
 * @param {HTMLElement} dislikeBtn - Bouton dislike
 */
const loadMovieTags = async (tmdbId, mediaType, likeBtn, dislikeBtn) => {
	const userId = localStorage.getItem('userId');
	if (!userId) return;

	try {
		const response = await TagManager.getTagsByTmdbId(parseInt(userId), tmdbId, mediaType);
		if (response.success && response.tags) {
			const tagNames = response.tags.map(t => t.tag);
			
			// Mettre à jour l'apparence des boutons
			if (tagNames.includes('liked')) {
				likeBtn.classList.add('active');
			}
			if (tagNames.includes('disliked')) {
				dislikeBtn.classList.add('active');
			}
		}
	} catch (error) {
		console.error('Erreur lors du chargement des tags:', error);
	}
};

/**
 * Gérer le basculement du like
 * @param {number} tmdbId - ID TMDb du film
 * @param {string} mediaType - Type de média
 * @param {HTMLElement} likeBtn - Bouton like
 */
const handleLikeToggle = async (tmdbId, mediaType, likeBtn) => {
	const userId = localStorage.getItem('userId');
	if (!userId) {
		TagManager.showNotification('Vous devez être connecté pour liker un film', 'error');
		return;
	}

	try {
		const response = await TagManager.toggleTmdbLike(parseInt(userId), tmdbId, mediaType);
		if (response.success) {
			const dislikeBtn = likeBtn.parentElement.querySelector('.btn-dislike');
			
			// Mettre à jour l'apparence des boutons selon l'état
			if (response.state === 'liked') {
				likeBtn.classList.add('active');
				dislikeBtn.classList.remove('active');
				TagManager.showNotification('Film liké ❤️', 'success');
			} else if (response.state === 'neutral') {
				likeBtn.classList.remove('active');
				TagManager.showNotification('Like retiré', 'info');
			}
		} else {
			TagManager.showNotification(response.message, 'error');
		}
	} catch (error) {
		console.error('Erreur lors du toggle like:', error);
		TagManager.showNotification('Erreur lors de l\'action', 'error');
	}
};

/**
 * Gérer le basculement du dislike
 * @param {number} tmdbId - ID TMDb du film
 * @param {string} mediaType - Type de média
 * @param {HTMLElement} dislikeBtn - Bouton dislike
 */
const handleDislikeToggle = async (tmdbId, mediaType, dislikeBtn) => {
	const userId = localStorage.getItem('userId');
	if (!userId) {
		TagManager.showNotification('Vous devez être connecté pour disliker un film', 'error');
		return;
	}

	try {
		const response = await TagManager.toggleTmdbDislike(parseInt(userId), tmdbId, mediaType);
		if (response.success) {
			const likeBtn = dislikeBtn.parentElement.querySelector('.btn-like');
			
			// Mettre à jour l'apparence des boutons selon l'état
			if (response.state === 'disliked') {
				dislikeBtn.classList.add('active');
				likeBtn.classList.remove('active');
				TagManager.showNotification('Film disliké 💔', 'success');
			} else if (response.state === 'neutral') {
				dislikeBtn.classList.remove('active');
				TagManager.showNotification('Dislike retiré', 'info');
			}
		} else {
			TagManager.showNotification(response.message, 'error');
		}
	} catch (error) {
		console.error('Erreur lors du toggle dislike:', error);
		TagManager.showNotification('Erreur lors de l\'action', 'error');
	}
};

// ───────────────────────────────────────────────────
// Affichage des films
// ───────────────────────────────────────────────────

/**
 * Afficher les films trending dans le conteneur de résultats
 * @param {Array} movies - Liste des films à afficher
 */
const displayTrendingMovies = (movies) => {
	if (!resultsContainer) return;

	// Vider le conteneur
	resultsContainer.innerHTML = '';

	// Si aucun résultat
	if (!movies || movies.length === 0) {
		resultsContainer.innerHTML = '<p class="no-results">Aucun film trending disponible</p>';
		return;
	}

	// Créer les cartes de films
	movies.forEach(movie => {
		const movieCard = createMovieCard(movie);
		resultsContainer.appendChild(movieCard);
	});
};

/**
 * Créer une carte de film
 * @param {Object} movie - Objet film de TMDb
 * @returns {HTMLElement} Élément DOM de la carte
 */
const createMovieCard = (movie) => {
	const card = document.createElement('div');
	card.classList.add('movie-card');
	card.dataset.movieId = movie.id;

	// URL de l'image (TMDb utilise des chemins relatifs)
	const posterUrl = movie.poster_path 
		? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
		: 'images/no-poster.png'; // Placeholder si pas d'image

	// Titre (peut être "title" pour les films ou "name" pour les séries)
	const title = movie.title || movie.name || 'Sans titre';

	// Date de sortie
	const releaseDate = movie.release_date || movie.first_air_date || '';
	const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

	// Note moyenne
	const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

	// Type de média (movie ou tv)
	const mediaType = movie.media_type === 'tv' ? 'TV' : movie.media_type === 'movie' ? 'Film' : '';
	const mediaTypeValue = movie.media_type || 'movie';

	card.innerHTML = `
		<div class="movie-poster">
			<img src="${posterUrl}" alt="${title}" loading="lazy">
			<div class="movie-rating">⭐ ${rating}</div>
			${mediaType ? `<div class="movie-type">${mediaType}</div>` : ''}
			<div class="movie-actions">
				<button class="btn-like" data-tmdb-id="${movie.id}" data-media-type="${mediaTypeValue}" title="J'aime">
					👍
				</button>
				<button class="btn-dislike" data-tmdb-id="${movie.id}" data-media-type="${mediaTypeValue}" title="Je n'aime pas">
					👎
				</button>
			</div>
		</div>
		<div class="movie-info">
			<h3 class="movie-title">${title}</h3>
			${year ? `<p class="movie-year">${year}</p>` : ''}
		</div>
	`;

	// Événement au clic pour afficher les détails (sauf sur les boutons d'action)
	card.addEventListener('click', (e) => {
		if (!e.target.closest('.movie-actions')) {
			showMovieDetails(movie.id, mediaTypeValue);
		}
	});

	// Gestion du bouton like
	const likeBtn = card.querySelector('.btn-like');
	likeBtn.addEventListener('click', async (e) => {
		e.stopPropagation();
		await handleLikeToggle(movie.id, mediaTypeValue, likeBtn);
	});

	// Gestion du bouton dislike
	const dislikeBtn = card.querySelector('.btn-dislike');
	dislikeBtn.addEventListener('click', async (e) => {
		e.stopPropagation();
		await handleDislikeToggle(movie.id, mediaTypeValue, dislikeBtn);
	});

	// Charger l'état actuel des tags si l'utilisateur est connecté
	loadMovieTags(movie.id, mediaTypeValue, likeBtn, dislikeBtn);

	return card;
};

/**
 * Afficher les détails d'un film (à implémenter plus tard)
 * @param {number} movieId - ID TMDb du film
 * @param {string} mediaType - Type de média (movie ou tv)
 */
const showMovieDetails = (movieId, mediaType) => {
	console.log(`Afficher les détails du ${mediaType} avec ID: ${movieId}`);
	// TODO: Implémenter l'affichage des détails dans une modale
};

/**
 * Charger et afficher les films trending au démarrage
 */
const loadTrendingMovies = async () => {
	try {
		const response = await SearchManager.getTrending('all', 'day', 'fr-EU', 1);
		
		if (response.success && response.results) {
			displayTrendingMovies(response.results);
		} else {
			resultsContainer.innerHTML = '<p class="error-message">Erreur lors du chargement des films trending</p>';
		}
	} catch (error) {
		console.error('Erreur lors du chargement des trending:', error);
		resultsContainer.innerHTML = '<p class="error-message">Erreur de connexion au serveur</p>';
	}
};

/**
 * Gérer la recherche de films
 * @param {Event} e - Événement de soumission du formulaire
 */
const handleSearch = async (e) => {
	e.preventDefault();

	const title = titleInput.value.trim();
	const year = yearInput.value.trim();
	const type = typeSelect.value;

	// Si titre présent, faire une recherche par titre
	if (title) {
		try {
			let response;
			
			if (type === 'tv') {
				response = await SearchManager.searchTV(title, year, 'fr-EU', 1);
			} else {
				response = await SearchManager.search(title, year, 'fr-EU', 1);
			}

			if (response.success && response.results) {
				// Filtrer par type si nécessaire
				let filteredResults = response.results;
				if (type && type !== 'movie' && type !== 'tv') {
					// Si type n'est ni movie ni tv, afficher tout
				} else if (type) {
					filteredResults = response.results.filter(m => m.media_type === type);
				}

				displayTrendingMovies(filteredResults);
			} else {
				resultsContainer.innerHTML = '<p class="no-results">Aucun résultat trouvé</p>';
			}
		} catch (error) {
			console.error('Erreur lors de la recherche:', error);
			resultsContainer.innerHTML = '<p class="error-message">Erreur lors de la recherche</p>';
		}
	} else {
		// Si pas de titre, afficher trending avec filtres
		try {
			const mediaType = type || 'all';
			const response = await SearchManager.getTrending(mediaType, 'day', 'fr-EU', 1);
			
			if (response.success && response.results) {
				let filteredResults = response.results;

				// Filtrer par année si spécifiée
				if (year) {
					filteredResults = filteredResults.filter(movie => {
						const releaseDate = movie.release_date || movie.first_air_date || '';
						const movieYear = releaseDate ? new Date(releaseDate).getFullYear().toString() : '';
						return movieYear === year;
					});
				}

				displayTrendingMovies(filteredResults);
			} else {
				resultsContainer.innerHTML = '<p class="no-results">Aucun résultat trouvé</p>';
			}
		} catch (error) {
			console.error('Erreur lors du chargement des trending:', error);
			resultsContainer.innerHTML = '<p class="error-message">Erreur lors de la recherche</p>';
		}
	}
};

// ═══════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════

// Charger les films trending au démarrage
loadTrendingMovies();

// Initialiser la connexion
initConnexion();

// Gérer la soumission du formulaire de recherche
const searchForm = document.querySelector('.search-form');
if (searchForm) {
	searchForm.addEventListener('submit', handleSearch);
}

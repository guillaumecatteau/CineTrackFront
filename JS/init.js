import { initAuth } from "./modules/auth.js";
import { initResults } from "./modules/results.js";
import { initSearchControls } from "./modules/search-controls.js";
import { createSelectionController } from "./modules/selection.js";
import { getCurrentUser, isAuthenticated } from "./modules/session.js";

document.addEventListener("DOMContentLoaded", () => {
	const titleInput = document.getElementById("title");
	const yearInput = document.getElementById("year");
	const typeSelect = document.getElementById("type");
	const searchButton = document.getElementById("search-button");
	const searchForm = document.querySelector(".search-form");
	const resultsContainer = document.getElementById("results-container");
	const resultsNav = document.getElementById("results-nav");
	const authContainer = document.getElementById("auth-container");

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

	const resetSearchFields = () => {
		titleInput.value = "";
		yearInput.value = "";
		typeSelect.value = "";
		searchButton.disabled = true;
	};

	resetSearchFields();

	window.addEventListener("pageshow", (event) => {
		if (event.persisted) {
			resetSearchFields();
		}
	});

	initSearchControls({
		titleInput,
		yearInput,
		typeSelect,
		searchButton
	});

	const selectionController = createSelectionController({
		resultsContainer,
		isUserConnected: isAuthenticated,
		getCurrentUser
	});

	initResults({
		resultsContainer,
		resultsNav,
		searchForm,
		selectionController
	});

	initAuth({ authContainer });
});

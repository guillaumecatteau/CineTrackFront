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
const resultsNav = document.getElementById("results-nav");
const authContainer = document.getElementById("auth-container");
const signInTrigger = document.getElementById("sign-in-trigger");
const signUpTrigger = document.getElementById("sign-up-trigger");

const initialAuthMarkup = authContainer ? authContainer.innerHTML : "";

// ═══════════════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════════════

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

	card.innerHTML = `
		<div class="movie-poster">
			<img src="${posterUrl}" alt="${title}" loading="lazy">
			<div class="movie-rating">⭐ ${rating}</div>
			${mediaType ? `<div class="movie-type">${mediaType}</div>` : ''}
		</div>
		<div class="movie-info">
			<h3 class="movie-title">${title}</h3>
			${year ? `<p class="movie-year">${year}</p>` : ''}
		</div>
	`;

	// Événement au clic pour afficher les détails
	card.addEventListener('click', () => {
		showMovieDetails(movie.id, movie.media_type || 'movie');
	});

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
			console.error('Erreur lors du chargement des trending:', response.message);
			if (resultsContainer) {
				resultsContainer.innerHTML = '<p class="error-message">Erreur lors du chargement des films trending</p>';
			}
		}
	} catch (error) {
		console.error('Erreur lors du chargement des trending:', error);
		if (resultsContainer) {
			resultsContainer.innerHTML = '<p class="error-message">Erreur de connexion</p>';
		}
	}
};

/**
 * Gérer la recherche avec filtres
 * @param {Event} event - Événement de soumission du formulaire
 */
const handleSearch = async (event) => {
	event.preventDefault();
	
	const title = titleInput.value.trim();
	const year = yearInput.value.trim();
	const type = typeSelect.value;
	
	// Si aucun filtre n'est renseigné, afficher les trending
	if (!title && !year && !type) {
		loadTrendingMovies();
		return;
	}
	
	// Si un titre est renseigné, faire une recherche
	if (title) {
		try {
			let response;
			
			// Recherche selon le type
			if (type === 'tv') {
				response = await SearchManager.searchTV(title, 1, 'fr-EU');
			} else {
				response = await SearchManager.search(title, 1, year || null, 'fr-EU');
			}
			
			if (response.success && response.results) {
				// Filtrer par type si spécifié (pour la recherche de films)
				let filteredResults = response.results;
				if (type && type !== 'tv') {
					filteredResults = filteredResults.filter(item => item.media_type === type);
				}
				
				// Filtrer par année si spécifié
				if (year) {
					filteredResults = filteredResults.filter(item => {
						const itemYear = item.release_date || item.first_air_date;
						return itemYear && itemYear.startsWith(year);
					});
				}
				
				displayTrendingMovies(filteredResults);
			} else {
				resultsContainer.innerHTML = '<p class="no-results">Aucun résultat trouvé</p>';
			}
		} catch (error) {
			console.error('Erreur lors de la recherche:', error);
			resultsContainer.innerHTML = '<p class="error-message">Erreur lors de la recherche</p>';
		}
	} 
	// Si seulement année et/ou type, filtrer les trending
	else {
		try {
			const mediaType = type || 'all';
			const response = await SearchManager.getTrending(mediaType, 'day', 'fr-EU', 1);
			
			if (response.success && response.results) {
				let filteredResults = response.results;
				
				// Filtrer par année si spécifié
				if (year) {
					filteredResults = filteredResults.filter(item => {
						const itemYear = item.release_date || item.first_air_date;
						return itemYear && itemYear.startsWith(year);
					});
				}
				
				displayTrendingMovies(filteredResults);
			} else {
				resultsContainer.innerHTML = '<p class="no-results">Aucun résultat trouvé</p>';
			}
		} catch (error) {
			console.error('Erreur lors du filtrage:', error);
			resultsContainer.innerHTML = '<p class="error-message">Erreur lors du filtrage</p>';
		}
	}
};

/**
 * Mettre à jour l'état du bouton de recherche
 */
const updateSearchButtonState = () => {
	// Le bouton est toujours actif maintenant
	// Il permet de réinitialiser l'affichage avec les trending
	searchButton.disabled = false;
};

/**
 * Valider une adresse email
 */
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Valider un mot de passe fort
 */
const isStrongPassword = (value) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

/**
 * Attacher la validation en temps réel aux champs de formulaire
 */
const attachLiveValidation = (fields, submitButton) => {
	const touchedFields = new Set();

	const updateState = () => {
		let allValid = true;

		fields.forEach((field) => {
			const currentValue = field.input.value.trim();
			const isValid = field.validator(currentValue);
			const isTouched = touchedFields.has(field.input.id);

			field.error.textContent = !isValid && isTouched ? field.errorMessage : "";
			if (!isValid) {
				allValid = false;
			}
		});

		submitButton.disabled = !allValid;
	};

	fields.forEach((field) => {
		field.input.addEventListener("input", () => {
			updateState();
		});

		field.input.addEventListener("blur", () => {
			touchedFields.add(field.input.id);
			updateState();
		});
	});

	updateState();
};

/**
 * Restaurer les boutons initiaux d'authentification
 */
const restoreInitialAuthButtons = () => {
	authContainer.innerHTML = initialAuthMarkup;
	const newSignInTrigger = document.getElementById("sign-in-trigger");
	const newSignUpTrigger = document.getElementById("sign-up-trigger");

	if (newSignInTrigger) {
		newSignInTrigger.addEventListener("click", renderSignInForm);
	}
	if (newSignUpTrigger) {
		newSignUpTrigger.addEventListener("click", renderSignUpForm);
	}
};

/**
 * Afficher le formulaire d'inscription
 */
export const renderSignUpForm = () => {
	authContainer.innerHTML = `
		<div class="auth-form">
			<div class="auth-fields">
				<div class="auth-field">
					<input type="text" id="signup-username" placeholder="USERNAME">
					<div class="field-error" id="signup-username-error"></div>
				</div>
				<div class="auth-field">
					<input type="email" id="signup-mail" placeholder="MAIL">
					<div class="field-error" id="signup-mail-error"></div>
				</div>
				<div class="auth-field">
					<input type="password" id="signup-password" placeholder="PASSWORD">
					<div class="field-error" id="signup-password-error"></div>
				</div>
			</div>
			<div class="auth-actions">
				<button type="button" class="btn btn-primary" id="signup-validate" disabled>Validate</button>
				<button type="button" class="btn btn-secondary" id="signup-back">Back</button>
			</div>
		</div>
	`;

	const usernameInput = document.getElementById("signup-username");
	const mailInput = document.getElementById("signup-mail");
	const passwordInput = document.getElementById("signup-password");
	const usernameError = document.getElementById("signup-username-error");
	const mailError = document.getElementById("signup-mail-error");
	const passwordError = document.getElementById("signup-password-error");
	const validateButton = document.getElementById("signup-validate");
	const backButton = document.getElementById("signup-back");

	if (!usernameInput || !mailInput || !passwordInput || !usernameError || !mailError || !passwordError || !validateButton || !backButton) {
		return;
	}

	attachLiveValidation(
		[
			{
				input: usernameInput,
				error: usernameError,
				validator: (value) => value.length >= 2,
				errorMessage: "Minimum 2 caractères"
			},
			{
				input: mailInput,
				error: mailError,
				validator: (value) => isValidEmail(value),
				errorMessage: "Adresse mail invalide"
			},
			{
				input: passwordInput,
				error: passwordError,
				validator: (value) => isStrongPassword(value),
				errorMessage: "8+ caractères, 1 majuscule, 1 chiffre"
			}
		],
		validateButton
	);

	// Ajouter l'événement d'inscription
	validateButton.addEventListener("click", () => handleRegistration(renderSignInForm, renderSignUpForm));

	backButton.addEventListener("click", restoreInitialAuthButtons);
};

/**
 * Afficher le formulaire de connexion
 */
export const renderSignInForm = () => {
	authContainer.innerHTML = `
		<div class="auth-form">
			<div class="auth-fields">
				<div class="auth-field">
					<input type="email" id="signin-mail" placeholder="MAIL">
					<div class="field-error" id="signin-mail-error"></div>
				</div>
				<div class="auth-field">
					<input type="password" id="signin-password" placeholder="PASSWORD">
					<div class="field-error" id="signin-password-error"></div>
				</div>
			</div>
			<div class="auth-actions">
				<button type="button" class="btn btn-primary" id="signin-connect" disabled>Connexion</button>
				<button type="button" class="btn btn-secondary" id="signin-back">Back</button>
			</div>
		</div>
	`;

	const mailInput = document.getElementById("signin-mail");
	const passwordInput = document.getElementById("signin-password");
	const mailError = document.getElementById("signin-mail-error");
	const passwordError = document.getElementById("signin-password-error");
	const connectButton = document.getElementById("signin-connect");
	const backButton = document.getElementById("signin-back");

	if (!mailInput || !passwordInput || !mailError || !passwordError || !connectButton || !backButton) {
		return;
	}

	attachLiveValidation(
		[
			{
				input: mailInput,
				error: mailError,
				validator: (value) => isValidEmail(value),
				errorMessage: "Adresse mail invalide"
			},
			{
				input: passwordInput,
				error: passwordError,
				validator: (value) => isStrongPassword(value),
				errorMessage: "8+ caractères, 1 majuscule, 1 chiffre"
			}
		],
		connectButton
	);

	// Ajouter l'événement de connexion
	connectButton.addEventListener("click", () => handleConnexion(renderSignInForm, renderSignUpForm));

	backButton.addEventListener("click", restoreInitialAuthButtons);
};

/**
 * Initialiser l'interface
 */
export function initInterface() {
	// Vérifier que les éléments nécessaires existent
	if (!titleInput || !yearInput || !typeSelect || !searchButton || !resultsContainer || !resultsNav) {
		return;
	}

	// Initialiser la recherche
	const searchForm = document.querySelector('.search-form');
	if (searchForm) {
		searchForm.addEventListener('submit', handleSearch);
	}
	
	titleInput.addEventListener("input", updateSearchButtonState);
	yearInput.addEventListener("input", updateSearchButtonState);
	typeSelect.addEventListener("change", updateSearchButtonState);
	updateSearchButtonState();

	// Initialiser l'authentification
	if (!authContainer) {
		return;
	}

	if (signInTrigger) {
		signInTrigger.addEventListener("click", renderSignInForm);
	}

	if (signUpTrigger) {
		signUpTrigger.addEventListener("click", renderSignUpForm);
	}
}

// ═══════════════════════════════════════════════════
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
	// Initialiser l'interface (recherche et auth)
	initInterface();
	
	// Initialiser la connexion (vérifier si déjà connecté)
	initConnexion(renderSignInForm, renderSignUpForm);
	
	// Charger les films trending au démarrage
	loadTrendingMovies();
});

// ═══════════════════════════════════════════════════
// EXPORTS GLOBAUX (pour tests/debugging)
// ═══════════════════════════════════════════════════
window.AuthManager = AuthManager;
window.SearchManager = SearchManager;
window.TagManager = TagManager;
window.UserMovieManager = UserMovieManager;

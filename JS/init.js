/**
 * init.js — Point d'entrée principal de l'interface CineTrack.
 *
 * Responsabilités :
 *  - Rediriger vers Apache si ouvert depuis Live Server (port 5500)
 *  - Afficher les films trending au chargement
 *  - Gérer la recherche (titre, année, catégorie) et la pagination
 *  - Créer les cartes de résultats avec les boutons like/dislike
 *  - Rendre les formulaires de connexion / inscription
 *  - Réagir aux événements cinetrack:login / cinetrack:logout
 */

// ═══════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════
import AuthManager from './Manager/AuthManager.js';
import SearchManager from './Manager/SearchManager.js';
import TagManager from './Manager/TagManager.js';
import UserMovieManager from './Manager/UserMovieManager.js';
import { handleConnexion, handleRegistration, updateHeaderButtons, initConnexion } from './connexion.js';
import { showMovieDetails } from './popup.js';
import { showCollection, hideCollection, initCollection, loadCollection } from './collection.js';
import { initCustomSelects } from './customSelect.js';

// ─── Redirection Live Server → Apache ────────────────────────────────────────
// Live Server sert les fichiers sur le port 5500, mais l'API PHP tourne sous
// Apache (port 80). On redirige automatiquement pour que les appels API fonctionnent.
const isLiveServerOrigin = window.location.port === '5500';
let isRedirectingToApache = false;

if (isLiveServerOrigin) {
	const cinetrackPathMatch = window.location.pathname.match(/\/CineTrackFront\/.*$/);
	const livePath = cinetrackPathMatch ? cinetrackPathMatch[0] : '/CineTrackFront/index.html';
	const targetPath = livePath.startsWith('/CineTrackFront/') ? `/CineTrack${livePath}` : livePath;
	const targetUrl = `http://localhost${targetPath}${window.location.search}${window.location.hash}`;
	isRedirectingToApache = true;
	window.location.replace(targetUrl);
}

// ═══════════════════════════════════════════════════
// CONSTANTES ET ÉLÉMENTS DOM
// ═══════════════════════════════════════════════════
// ─── Éléments DOM ────────────────────────────────────────────────────────────
const titleInput        = document.getElementById('title');
const yearInput         = document.getElementById('year');
const typeSelect        = document.getElementById('type');
const resultsContainer  = document.getElementById('results-container');
const resultsNav        = document.getElementById('results-nav');

// ─── État de pagination ───────────────────────────────────────────────────────
// Conserve la dernière requête pour que les boutons Précédent / Suivant
// puissent rappeler _executeSearch avec les mêmes paramètres et une page différente.
let _lastQuery = null; // { title, year, type }

// ═══════════════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════════════

// ─── Gestion des tags sur les cartes ─────────────────────────────────────────

/**
 * Charger l'état like/dislike d'un film et colorer les boutons en conséquence.
 * Appelé à la création de chaque carte si l'utilisateur est connecté.
 * @param {number} tmdbId
 * @param {string} mediaType
 * @param {HTMLElement} likeBtn
 * @param {HTMLElement} dislikeBtn
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

// ─── Affichage des résultats ──────────────────────────────────────────────────

/**
 * Vider le conteneur et afficher une grille de cartes pour la liste de films donnée.
 * Gère également l'animation d'entrée en cascade (--card-i) et la navigation.
 * @param {Object[]} movies      - Tableau d'objets film/série (format TMDb)
 * @param {number}   [totalPages=1] - Nombre total de pages (pour la pagination)
 * @param {number}   [page=1]       - Page courante
 */
const displayTrendingMovies = (movies, totalPages = 1, page = 1) => {
	if (!resultsContainer) return;

	resultsContainer.innerHTML = '';

	if (!movies || movies.length === 0) {
		resultsContainer.innerHTML = '<p class="no-results">Aucun film trending disponible</p>';
		_renderNav(1, 1);
		return;
	}

	movies.forEach((movie, i) => {
		const movieCard = createMovieCard(movie);
		movieCard.style.setProperty('--card-i', i);
		movieCard.classList.add('is-entering');
		resultsContainer.appendChild(movieCard);
	});
	_renderNav(page, totalPages);
};

/**
 * Construire la carte DOM d'un film ou d'une série.
 *
 * Structure :
 *  .movie-card
 *    .movie-poster  (image + note + badge type + boutons like/dislike)
 *    .movie-info    (titre + année)
 *
 * Les boutons like/dislike sont toujours présents dans le DOM mais masqués
 * par CSS ; ils deviennent visibles via la classe body.user-logged-in.
 *
 * @param {Object} movie - Objet film/série au format TMDb
 * @returns {HTMLElement}
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
				<button class="btn-like" data-tmdb-id="${movie.id}" data-media-type="${mediaTypeValue}" title="J'aime" aria-label="J'aime">
					<svg class="action-icon" viewBox="0 -0.5 21 21" aria-hidden="true"><g transform="translate(-219,-760)"><g transform="translate(56,160)" fill="currentColor"><path d="M163,610.021159 L163,618.021159 C163,619.126159 163.93975,620.000159 165.1,620.000159 L167.199999,620.000159 L167.199999,608.000159 L165.1,608.000159 C163.93975,608.000159 163,608.916159 163,610.021159 M183.925446,611.355159 L182.100546,617.890159 C181.800246,619.131159 180.639996,620.000159 179.302297,620.000159 L169.299999,620.000159 L169.299999,608.021159 L171.104948,601.826159 C171.318098,600.509159 172.754498,599.625159 174.209798,600.157159 C175.080247,600.476159 175.599997,601.339159 175.599997,602.228159 L175.599997,607.021159 C175.599997,607.573159 176.070397,608.000159 176.649997,608.000159 L181.127196,608.000159 C182.974146,608.000159 184.340196,609.642159 183.925446,611.355159"/></g></g></svg>
				</button>
				<button class="btn-dislike" data-tmdb-id="${movie.id}" data-media-type="${mediaTypeValue}" title="J'aime pas" aria-label="J'aime pas">
					<svg class="action-icon" viewBox="0 -0.5 21 21" aria-hidden="true"><g transform="translate(-139,-760)"><g transform="translate(56,160)" fill="currentColor"><path d="M101.900089,600 L99.8000892,600 L99.8000892,611.987622 L101.900089,611.987622 C103.060339,611.987622 104.000088,611.093545 104.000088,609.989685 L104.000088,601.997937 C104.000088,600.894077 103.060339,600 101.900089,600 M87.6977917,600 L97.7000896,600 L97.7000896,611.987622 L95.89514,618.176232 C95.6819901,619.491874 94.2455904,620.374962 92.7902907,619.842512 C91.9198408,619.52484 91.400091,618.66273 91.400091,617.774647 L91.400091,612.986591 C91.400091,612.43516 90.9296911,611.987622 90.3500912,611.987622 L85.8728921,611.987622 C84.0259425,611.987622 82.6598928,610.35331 83.0746427,608.641078 L84.8995423,602.117813 C85.1998423,600.878093 86.360092,600 87.6977917,600"/></g></g></svg>
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
	likeBtn?.addEventListener('click', async (e) => {
		e.stopPropagation();
		await handleLikeToggle(movie.id, mediaTypeValue, likeBtn);
	});

	// Gestion du bouton dislike
	const dislikeBtn = card.querySelector('.btn-dislike');
	dislikeBtn?.addEventListener('click', async (e) => {
		e.stopPropagation();
		await handleDislikeToggle(movie.id, mediaTypeValue, dislikeBtn);
	});

	// Charger l'état actuel des tags si l'utilisateur est connecté
	if (likeBtn && dislikeBtn) loadMovieTags(movie.id, mediaTypeValue, likeBtn, dislikeBtn);

	return card;
};

/**
 * Rendre les boutons de navigation pagine dans #results-nav.
 * Affiche « Précédent » et/ou « Suivant » selon la page courante.
 * Masque nav si une seule page.
 */
const _renderNav = (page, total) => {
	if (!resultsNav) return;
	resultsNav.innerHTML = '';
	if (total <= 1) return;
	if (page > 1) {
		const prev = document.createElement('button');
		prev.className = 'results-nav-link';
		prev.textContent = '<< Précédent';
		prev.addEventListener('click', () => _executeSearch(_lastQuery.title, _lastQuery.year, _lastQuery.type, page - 1));
		resultsNav.appendChild(prev);
	}
	if (page < total) {
		const next = document.createElement('button');
		next.className = 'results-nav-link';
		next.textContent = 'Suivant >>';
		next.addEventListener('click', () => _executeSearch(_lastQuery.title, _lastQuery.year, _lastQuery.type, page + 1));
		resultsNav.appendChild(next);
	}
};

/**
 * Moteur de recherche unifié — tous les cas passent par ici.
 *
 * Priorité de routing :
 *  1. titre non vide + type tv   → searchTV (endpoint /search/tv)
 *  2. titre non vide             → search   (endpoint /search/movie, filtre année facultatif)
 *  3. année seule                → discover (endpoint /discover, catalogue complet TMDb)
 *  4. aucun critère              → getTrending
 *
 * Stocke la requête dans _lastQuery pour que la pagination puisse
 * rappeler cette fonction avec page ± 1 sans reconnaître les paramètres.
 */
const _executeSearch = async (title, year, type, page) => {
	_lastQuery = { title, year, type };
	try {
		let response;
		if (title) {
			if (type === 'tv') {
				response = await SearchManager.searchTV(title, page, 'fr-EU');
			} else {
				response = await SearchManager.search(title, page, year || null, 'fr-EU');
			}
		} else if (year) {
			// Année seule → /discover : TMDb filtre côté serveur sur l'ensemble du catalogue
			const mediaType = type === 'tv' ? 'tv' : type === 'movie' ? 'movie' : 'all';
			response = await SearchManager.discover(year, mediaType, page, 'fr-EU');
		} else {
			const mediaType = type || 'all';
			response = await SearchManager.getTrending(mediaType, 'day', 'fr-EU', page);
		}
		if (response.success && response.results) {
			displayTrendingMovies(response.results, response.total_pages ?? 1, page);
		} else {
			resultsContainer.innerHTML = '<p class="no-results">Aucun résultat trouvé</p>';
			_renderNav(1, 1);
		}
	} catch (error) {
		console.error('Erreur lors de la recherche:', error);
		resultsContainer.innerHTML = '<p class="error-message">Erreur lors de la recherche</p>';
		_renderNav(1, 1);
	}
};

/**
 * Charger et afficher les films trending au démarrage
 */
const loadTrendingMovies = async () => {
	try {
		await _executeSearch('', '', '', 1);
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
	await _executeSearch(title, year, type, 1);
};

// ═══════════════════════════════════════════════════
// FORMULAIRES D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════

const overlay        = document.getElementById('signup-overlay');
const overlayTitle   = document.getElementById('signup-overlay-title');
const overlayContent = document.getElementById('signup-overlay-content');

const openOverlay = () => overlay?.classList.add('signup-overlay--open');
const closeOverlay = () => overlay?.classList.remove('signup-overlay--open');

// Fermer l'overlay en cliquant sur le fond
overlay?.addEventListener('click', (e) => {
	if (e.target === overlay) closeOverlay();
});
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') closeOverlay();
});

const renderSignInForm = () => {
	if (overlayTitle) overlayTitle.textContent = 'Connexion';
	if (overlayContent) overlayContent.innerHTML = `
		<form class="auth-form auth-form--stacked" id="signin-form" novalidate>
			<div class="auth-fields">
				<div class="auth-field">
					<input type="email" id="signin-mail" placeholder="Email" autocomplete="email" />
					<span class="field-error" id="signin-mail-error"></span>
				</div>
				<div class="auth-field auth-field--password">
					<input type="password" id="signin-password" placeholder="Mot de passe" autocomplete="current-password" />
					<span class="field-error" id="signin-password-error"></span>
				</div>
			</div>
			<div class="auth-actions">
				<button type="submit" class="btn btn-primary" id="signin-connect">Se connecter</button>
				<button type="button" class="btn btn-secondary" id="close-auth">Annuler</button>
			</div>
		</form>
	`;
	openOverlay();
	document.getElementById('signin-form')?.addEventListener('submit', async (e) => {
		e.preventDefault();
		await handleConnexion(renderSignInForm, renderSignUpForm);
		if (AuthManager.isLoggedIn()) closeOverlay();
	});
	document.getElementById('close-auth')?.addEventListener('click', closeOverlay);
};

const renderSignUpForm = () => {
	if (overlayTitle) overlayTitle.textContent = 'Créer un compte';
	if (overlayContent) overlayContent.innerHTML = `
		<form class="auth-form auth-form--stacked" id="signup-form" novalidate>
			<div class="auth-fields">
				<div class="auth-field">
					<input type="text" id="signup-username" placeholder="Nom d'utilisateur" autocomplete="username" />
					<span class="field-error" id="signup-username-error"></span>
				</div>
				<div class="auth-field">
					<input type="email" id="signup-mail" placeholder="Email" autocomplete="email" />
					<span class="field-error" id="signup-mail-error"></span>
				</div>
				<div class="auth-field auth-field--password">
					<input type="password" id="signup-password" placeholder="Mot de passe" autocomplete="new-password" />
					<span class="field-error" id="signup-password-error"></span>
				</div>
			</div>
			<div class="auth-actions">
				<button type="submit" class="btn btn-primary" id="signup-validate">S'inscrire</button>
				<button type="button" class="btn btn-secondary" id="close-auth-up">Annuler</button>
			</div>
		</form>
	`;
	openOverlay();
	document.getElementById('signup-form')?.addEventListener('submit', (e) => {
		e.preventDefault();
		handleRegistration(renderSignInForm, renderSignUpForm);
	});
	document.getElementById('close-auth-up')?.addEventListener('click', closeOverlay);
};

// ─── Initialisation ───────────────────────────────────────────────────────────────────
// Tout ce bloc est ignoré si l'on vient d'être redirigé vers Apache : la
// page sera rechargée immédiatement, inutile d'initialiser quoi que ce soit.

if (!isRedirectingToApache) {
	// 1. Trending par défaut au chargement
	loadTrendingMovies();

	// 2. Dropdowns accessibles (remplace les <select> natifs)
	initCustomSelects();

	// 3. Câbler les boutons Sign In / Sign Up du header
	document.getElementById('sign-in-trigger')?.addEventListener('click', renderSignInForm);
	document.getElementById('sign-up-trigger')?.addEventListener('click', renderSignUpForm);

	// Initialiser la connexion (met à jour le header si déjà connecté)
	initConnexion(renderSignInForm, renderSignUpForm);

	// 4. Si l'utilisateur est déjà connecté (session précédente), afficher sa collection
	if (AuthManager.isLoggedIn()) {
		document.body.classList.add('user-logged-in');
		showCollection();
		initCollection();
	}

	// 5. Événements d'authentification — bénéficient du bus document CustomEvent
	// cinetrack:login   → émis par connexion.js après login réussi
	// cinetrack:logout  → émis par connexion.js après logout
	// cinetrack:collection-changed → émis par popup.js après ajout/suppression
	document.addEventListener('cinetrack:login', () => {
		document.body.classList.add('user-logged-in');
		showCollection();
		initCollection();
	});
	document.addEventListener('cinetrack:logout', () => {
		document.body.classList.remove('user-logged-in');
		hideCollection();
	});
	document.addEventListener('cinetrack:collection-changed', (e) => {
		const filter  = e.detail?.filter;
		const section  = document.getElementById('user-collection');
		const filterEl = document.getElementById('collection-filter');
		if (filter && filterEl) {
			filterEl.value = filter;
			// Synchroniser l'affichage du dropdown custom (le changement programmatique
			// ne déclenche pas l'événement 'change' natif)
			filterEl.dispatchEvent(new Event('cselect:sync'));
		}
		// Déplier la collection si elle est repliée
		section?.classList.remove('user-collection--collapsed');
		loadCollection(filter || (filterEl?.value ?? 'towatch'));
	});

	// 6. Formulaire de recherche
	const searchForm = document.querySelector('.search-form');
	if (searchForm) {
		searchForm.addEventListener('submit', handleSearch);
	}
}

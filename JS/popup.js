/**
 * popup.js — Movie detail overlay management
 * Opens a full-detail panel over the results grid when a movie card is clicked.
 */

import SearchManager from './Manager/SearchManager.js';
import TagManager from './Manager/TagManager.js';
import UserMovieManager from './Manager/UserMovieManager.js';

// ─── Module-level state ────────────────────────────────────────
let _overlay = null;
let _userMovieId = null;
let _escapeHandler = null;
let _ctx = { userId: null, tmdbId: null, mediaType: null };

// ─── Star rendering helpers ────────────────────────────────────

/**
 * Render read-only community stars from a 0–10 TMDb vote average
 * @param {HTMLElement} container
 * @param {number} voteAverage
 */
const renderCommunityStars = (container, voteAverage) => {
	const rating = voteAverage / 2; // convert 0-10 → 0-5
	container.innerHTML = '';
	for (let i = 1; i <= 5; i++) {
		const star = document.createElement('span');
		star.className = 'selection-star';
		if (i <= Math.floor(rating)) {
			star.classList.add('selection-star--full');
		} else if (i - 0.5 <= rating) {
			star.classList.add('selection-star--half');
		}
		star.textContent = '★';
		container.appendChild(star);
	}
};

/**
 * Render interactive 5-star rating widget
 * @param {HTMLElement} container
 * @param {HTMLElement|null} rateValueEl
 * @param {number} initialRating - 0–5
 */
const renderRateStars = (container, rateValueEl, initialRating = 0) => {
	container.innerHTML = '';
	let currentRating = initialRating;

	const updateDisplay = (upTo) => {
		container.querySelectorAll('.selection-star').forEach((s, idx) => {
			s.classList.toggle('selection-star--full', idx < upTo);
		});
	};

	for (let i = 1; i <= 5; i++) {
		const star = document.createElement('span');
		star.className = 'selection-star selection-star--interactive';
		star.textContent = '★';
		if (i <= currentRating) star.classList.add('selection-star--full');

		star.addEventListener('mouseenter', () => updateDisplay(i));
		star.addEventListener('mouseleave', () => updateDisplay(currentRating));
		star.addEventListener('click', async () => {
			currentRating = i;
			updateDisplay(currentRating);
			if (rateValueEl) rateValueEl.textContent = `${currentRating}/5`;
			await _saveRating(currentRating);
		});

		container.appendChild(star);
	}
};

// ─── Internal async helpers ────────────────────────────────────

/**
 * Find the userMovieId from the user's collection (lazy, cached)
 * @returns {Promise<number|null>}
 */
const _resolveUserMovieId = async () => {
	if (_userMovieId) return _userMovieId;
	const { userId, tmdbId, mediaType } = _ctx;
	if (!userId) return null;

	const res = await UserMovieManager.getAllMovies(userId);
	if (res.success && res.movies) {
		const found = res.movies.find(
			(m) => m.tmdbId === tmdbId && m.mediaType === mediaType
		);
		if (found) {
			_userMovieId = found.id;
			return found.id;
		}
	}
	return null;
};

/**
 * Save user star rating (resolves userMovieId lazily)
 * @param {number} rating
 */
const _saveRating = async (rating) => {
	await _resolveUserMovieId();
	if (_userMovieId) {
		const res = await UserMovieManager.updateMovie(_userMovieId, { rating });
		if (res.success) {
			TagManager.showNotification(`Note: ${rating}/5 enregistrée ✓`, 'success');
		} else {
			TagManager.showNotification('Erreur lors de la sauvegarde', 'error');
		}
	} else {
		TagManager.showNotification("Ajoutez d'abord le film à votre collection", 'info');
	}
};

/**
 * Load current watch state (watched / towatch) and update overlay buttons
 */
const _loadWatchState = async () => {
	if (!_overlay) return;
	const { userId, tmdbId, mediaType } = _ctx;
	if (!userId) return;

	const res = await UserMovieManager.getAllMovies(userId);
	if (!res.success || !res.movies || !_overlay) return;

	const found = res.movies.find(
		(m) => m.tmdbId === tmdbId && m.mediaType === mediaType
	);
	if (!found) return;

	_userMovieId = found.id;
	const addBtn     = _overlay.querySelector('[data-selection-action="add"]');
	const towatchBtn = _overlay.querySelector('[data-selection-action="towatch"]');
	if (found.isWatched) {
		addBtn?.classList.add('is-active');
		towatchBtn?.classList.remove('is-active');
	} else {
		towatchBtn?.classList.add('is-active');
		addBtn?.classList.remove('is-active');
	}

	// Restore saved rating
	if (found.rating) {
		const rateValueEl = _overlay.querySelector('[data-selection="rate-value"]');
		const rateStarsEl = _overlay.querySelector('[data-selection="rate-stars"]');
		if (rateValueEl) rateValueEl.textContent = `${found.rating}/5`;
		if (rateStarsEl) renderRateStars(rateStarsEl, rateValueEl, found.rating);
	}
};

/**
 * Load current user's like/dislike tag state and update overlay buttons
 */
const _loadTagState = async () => {
	if (!_overlay) return;
	const { userId, tmdbId, mediaType } = _ctx;

	const res = await TagManager.getTagsByTmdbId(userId, tmdbId, mediaType);
	if (!res.success || !res.tags || !_overlay) return;

	const tagNames = res.tags.map((t) => t.tag);
	const isLiked = tagNames.includes('liked');
	const isDisliked = tagNames.includes('disliked');

	_overlay.querySelector('[data-selection-action="like"]')?.classList.toggle('is-active', isLiked);
	_overlay.querySelector('[data-selection-action="dislike"]')?.classList.toggle('is-active', isDisliked);

	const likesEl = _overlay.querySelector('[data-selection="likes"]');
	const dislikesEl = _overlay.querySelector('[data-selection="dislikes"]');
	if (likesEl) likesEl.textContent = isLiked ? '1' : '0';
	if (dislikesEl) dislikesEl.textContent = isDisliked ? '1' : '0';
};

/**
 * Wire all action buttons in the overlay
 */
const _wireButtons = () => {
	if (!_overlay) return;
	const { userId, tmdbId, mediaType } = _ctx;

	// — Vu / watched —
	const addBtn     = _overlay.querySelector('[data-selection-action="add"]');
	const towatchBtn = _overlay.querySelector('[data-selection-action="towatch"]');

	const _setWatchUI = (state) => {
		addBtn?.classList.toggle('is-active',     state === 'watched');
		towatchBtn?.classList.toggle('is-active', state === 'towatch');
	};

	addBtn?.addEventListener('click', async () => {
		addBtn.disabled = true;
		if (addBtn.classList.contains('is-active')) {
			// Déjà vu → retirer
			const id = await _resolveUserMovieId();
			if (id) {
				const res = await UserMovieManager.deleteMovie(id);
				if (res.success) {
					_userMovieId = null;
					_setWatchUI(null);
					TagManager.showNotification('Retiré de votre collection', 'info');
					document.dispatchEvent(new CustomEvent('cinetrack:collection-changed', { detail: { filter: 'watched' } }));
				}
			}
		} else if (_userMovieId) {
			// Dans watchlist → passer en vu
			const res = await UserMovieManager.updateMovie(_userMovieId, { isWatched: true });
			if (res.success) {
				_setWatchUI('watched');
				TagManager.showNotification('Marqué comme vu ✓', 'success');
				document.dispatchEvent(new CustomEvent('cinetrack:collection-changed', { detail: { filter: 'watched' } }));
			}
		} else {
			// Nouveau → ajouter comme vu
			const res = await UserMovieManager.addMovie(userId, tmdbId, true, null, mediaType);
			if (res.success && res.userMovie) {
				_userMovieId = res.userMovie.id;
				_setWatchUI('watched');
				TagManager.showNotification('Ajouté à votre collection ✓', 'success');
				document.dispatchEvent(new CustomEvent('cinetrack:collection-changed', { detail: { filter: 'watched' } }));
			} else {
				TagManager.showNotification(res.message || 'Erreur', 'error');
			}
		}
		addBtn.disabled = false;
	});

	// — À voir / towatch —
	towatchBtn?.addEventListener('click', async () => {
		towatchBtn.disabled = true;
		if (towatchBtn.classList.contains('is-active')) {
			// Déjà dans watchlist → retirer
			const id = await _resolveUserMovieId();
			if (id) {
				const res = await UserMovieManager.deleteMovie(id);
				if (res.success) {
					_userMovieId = null;
					_setWatchUI(null);
					TagManager.showNotification('Retiré de votre watchlist', 'info');
					document.dispatchEvent(new CustomEvent('cinetrack:collection-changed', { detail: { filter: 'towatch' } }));
				}
			}
		} else if (_userMovieId) {
			// Vu → déplacer en watchlist
			const res = await UserMovieManager.updateMovie(_userMovieId, { isWatched: false });
			if (res.success) {
				_setWatchUI('towatch');
				TagManager.showNotification('Placé dans votre watchlist ✓', 'success');
				document.dispatchEvent(new CustomEvent('cinetrack:collection-changed', { detail: { filter: 'towatch' } }));
			}
		} else {
			// Nouveau → ajouter en watchlist
			const res = await UserMovieManager.addMovie(userId, tmdbId, false, null, mediaType);
			if (res.success && res.userMovie) {
				_userMovieId = res.userMovie.id;
				_setWatchUI('towatch');
				TagManager.showNotification('Ajouté à votre watchlist ✓', 'success');
				document.dispatchEvent(new CustomEvent('cinetrack:collection-changed', { detail: { filter: 'towatch' } }));
			} else {
				TagManager.showNotification(res.message || 'Erreur', 'error');
			}
		}
		towatchBtn.disabled = false;
	});

	// — Like —
	const likeBtn = _overlay.querySelector('[data-selection-action="like"]');
	const dislikeBtn = _overlay.querySelector('[data-selection-action="dislike"]');

	likeBtn?.addEventListener('click', async () => {
		const res = await TagManager.toggleTmdbLike(userId, tmdbId, mediaType);
		if (res.success) {
			const liked = res.state === 'liked';
			likeBtn.classList.toggle('is-active', liked);
			dislikeBtn?.classList.remove('is-active');
			if (_overlay) {
				_overlay.querySelector('[data-selection="likes"]').textContent = liked ? '1' : '0';
				_overlay.querySelector('[data-selection="dislikes"]').textContent = '0';
			}
			TagManager.showNotification(liked ? 'Film liké ❤️' : 'Like retiré', 'success');
		}
	});

	// — Dislike —
	dislikeBtn?.addEventListener('click', async () => {
		const res = await TagManager.toggleTmdbDislike(userId, tmdbId, mediaType);
		if (res.success) {
			const disliked = res.state === 'disliked';
			dislikeBtn.classList.toggle('is-active', disliked);
			likeBtn?.classList.remove('is-active');
			if (_overlay) {
				_overlay.querySelector('[data-selection="dislikes"]').textContent = disliked ? '1' : '0';
				_overlay.querySelector('[data-selection="likes"]').textContent = '0';
			}
			TagManager.showNotification(disliked ? 'Film disliké 💔' : 'Dislike retiré', 'success');
		}
	});
};

// ─── Public API ────────────────────────────────────────────────

/**
 * Close and remove the current overlay
 */
export const closeMovieDetails = () => {
	_overlay?.remove();
	_overlay = null;
	_userMovieId = null;
	_ctx = { userId: null, tmdbId: null, mediaType: null };

	if (_escapeHandler) {
		document.removeEventListener('keydown', _escapeHandler);
		_escapeHandler = null;
	}

	document.getElementById('results-container')?.classList.remove('results--blurred');
};

/**
 * Open the movie detail overlay for a given TMDb entry
 * @param {number} movieId - TMDb ID
 * @param {string} mediaType - 'movie' | 'tv'
 */
export const showMovieDetails = async (movieId, mediaType) => {
	closeMovieDetails();

	const resultsContainer = document.getElementById('results-container');
	const template = document.getElementById('selection-template');
	if (!resultsContainer || !template) return;

	// Clone template and insert into DOM (fixed overlay on body for full-viewport coverage)
	document.body.appendChild(template.content.cloneNode(true));
	_overlay = document.body.querySelector('.selection-overlay');
	document.getElementById('results-container')?.classList.add('results--blurred');

	// Store context
	const rawUserId = localStorage.getItem('userId');
	_ctx = {
		userId: rawUserId ? parseInt(rawUserId) : null,
		tmdbId: movieId,
		mediaType,
	};

	// Close handlers
	_overlay.querySelector('[data-selection="back-button"]')?.addEventListener('click', closeMovieDetails);
	_overlay.addEventListener('click', (e) => { if (!e.target.closest('.selection-panel')) closeMovieDetails(); });
	_escapeHandler = (e) => { if (e.key === 'Escape') closeMovieDetails(); };
	document.addEventListener('keydown', _escapeHandler);

	// Hide user sections while loading
	const connectText = _overlay.querySelector('[data-selection="connect-text"]');
	const userActions = _overlay.querySelector('[data-selection="user-actions"]');
	const rateWrap = _overlay.querySelector('[data-selection="rate-wrap"]');
	if (connectText) connectText.hidden = true;
	if (userActions) userActions.hidden = true;
	if (rateWrap) rateWrap.hidden = true;

	// Loading placeholder
	const titleEl = _overlay.querySelector('[data-selection="title"]');
	if (titleEl) titleEl.textContent = 'Chargement…';

	// Fetch details from TMDb
	let movieData = null;
	try {
		if (mediaType === 'tv') {
			const res = await SearchManager.getTVShowDetails(movieId);
			movieData = res.success ? res.tvshow : null;
		} else {
			const res = await SearchManager.getMovieDetails(movieId);
			movieData = res.success ? res.movie : null;
		}
	} catch (err) {
		console.error('showMovieDetails fetch error:', err);
	}

	// Overlay may have been closed during the async fetch
	if (!_overlay) return;

	if (!movieData) {
		if (titleEl) titleEl.textContent = 'Impossible de charger les détails';
		return;
	}

	// Extract data
	const title = movieData.title || movieData.name || 'Titre inconnu';
	const releaseDate = movieData.release_date || movieData.first_air_date || '';
	const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
	const overview = movieData.overview || 'Aucun résumé disponible.';
	const voteAverage = movieData.vote_average || 0;
	const posterUrl = movieData.poster_path
		? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
		: 'images/no-poster.png';

	// Populate fields
	if (titleEl) titleEl.textContent = title;

	const imgEl = _overlay.querySelector('.selection-image');
	if (imgEl) { imgEl.src = posterUrl; imgEl.alt = title; }

	const yearEl = _overlay.querySelector('[data-selection="year"]');
	if (yearEl) yearEl.textContent = year;

	const summaryEl = _overlay.querySelector('[data-selection="summary"]');
	if (summaryEl) summaryEl.textContent = overview;

	const starsEl = _overlay.querySelector('[data-selection="stars"]');
	if (starsEl) renderCommunityStars(starsEl, voteAverage);

	// User-specific UI
	if (_ctx.userId) {
		if (userActions) userActions.hidden = false;
		if (rateWrap) rateWrap.hidden = false;
		if (connectText) connectText.hidden = true;

		// Load watch + like/dislike state asynchronously (non-blocking)
		_loadWatchState();
		_loadTagState();

		// Wire action buttons
		_wireButtons();

		// Rating widget
		const rateStarsEl = _overlay.querySelector('[data-selection="rate-stars"]');
		const rateValueEl = _overlay.querySelector('[data-selection="rate-value"]');
		if (rateStarsEl) renderRateStars(rateStarsEl, rateValueEl, 0);
	} else {
		if (connectText) connectText.hidden = false;
		if (userActions) userActions.hidden = true;
		if (rateWrap) rateWrap.hidden = true;
	}
};

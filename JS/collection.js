/**
 * collection.js — User movie collection strip
 * Displayed between the nav and the search form when a user is logged in.
 * Filters: À voir (watchlist), Vus (watched), J'aime (liked), Je n'aime pas (disliked)
 */

import SearchManager from './Manager/SearchManager.js';
import TagManager from './Manager/TagManager.js';
import UserMovieManager from './Manager/UserMovieManager.js';
import { showMovieDetails } from './popup.js';

// ─── Internal helpers ──────────────────────────────────────────

/**
 * Fetch the raw movie list for a given filter.
 * Returns a response object with a `movies` array or null on failure.
 */
const _fetchMovies = async (userId, filter) => {
	switch (filter) {
		case 'watched':  return UserMovieManager.getWatchedMovies(userId);
		case 'towatch':  return UserMovieManager.getWatchlist(userId);
		case 'liked':    return TagManager.getMoviesByTag(userId, 'liked');
		case 'disliked': return TagManager.getMoviesByTag(userId, 'disliked');
		default:         return { success: false, movies: [] };
	}
};

/**
 * Fetch TMDb details for one entry.
 * Returns the data object or null on error.
 */
const _fetchDetails = async (tmdbId, mediaType) => {
	try {
		if (mediaType === 'tv') {
			const res = await SearchManager.getTVShowDetails(tmdbId);
			return res.success ? res.tvshow : null;
		} else {
			const res = await SearchManager.getMovieDetails(tmdbId);
			return res.success ? res.movie : null;
		}
	} catch {
		return null;
	}
};

/**
 * Build a small poster card for the collection strip.
 */
const _buildCard = (tmdbId, mediaType, details) => {
	const title  = details?.title || details?.name || 'Titre inconnu';
	const poster = details?.poster_path
		? `https://image.tmdb.org/t/p/w154${details.poster_path}`
		: 'images/no-poster.png';

	const card = document.createElement('div');
	card.className = 'col-card';
	card.innerHTML = `
		<img src="${poster}" alt="${title}" class="col-card-poster" loading="lazy" />
		<span class="col-card-title">${title}</span>
	`;
	card.addEventListener('click', () => showMovieDetails(tmdbId, mediaType));
	return card;
};

// ─── Fade mask helpers ───────────────────────────────────────

/** Update has-overflow-left/right classes on the strip to drive the CSS fade mask. */
const _updateFadeMask = (strip) => {
	if (!strip) return;
	const { scrollLeft, scrollWidth, clientWidth } = strip;
	strip.classList.toggle('has-overflow-left',  scrollLeft > 0);
	strip.classList.toggle('has-overflow-right', scrollLeft + clientWidth < scrollWidth - 1);
};

// ─── Public API ────────────────────────────────────────────────

/**
 * Load and render the collection for the given filter.
 * @param {string} filter - 'towatch' | 'watched' | 'liked' | 'disliked'
 */
export const loadCollection = async (filter) => {
	const rawUserId = localStorage.getItem('userId');
	if (!rawUserId) return;
	const userId = parseInt(rawUserId);

	const strip = document.getElementById('collection-strip');
	if (!strip) return;

	strip.innerHTML = '<p class="user-collection-loading">Chargement…</p>';

	const res = await _fetchMovies(userId, filter);

	if (!res?.success) {
		strip.innerHTML = '<p class="user-collection-empty">Erreur de chargement</p>';
		return;
	}

	const movies = res.movies || [];

	if (movies.length === 0) {
		strip.innerHTML = '<p class="user-collection-empty">Aucun film dans cette liste</p>';
		return;
	}

	// Normalize field names:
	// UserMovieDTO (getAllMovies/getWatchedMovies/getWatchlist) → camelCase (tmdbId, mediaType)
	// MovieTagService.getMoviesByTag → snake_case (tmdb_id, media_type)
	const normalized = movies.map((m) => ({
		tmdbId:    m.tmdbId    ?? m.tmdb_id,
		mediaType: m.mediaType ?? m.media_type,
	}));

	// Fetch all TMDb details in parallel
	const details = await Promise.all(
		normalized.map(({ tmdbId, mediaType }) => _fetchDetails(tmdbId, mediaType))
	);

	strip.innerHTML = '';
	normalized.forEach(({ tmdbId, mediaType }, i) => {
		const card = _buildCard(tmdbId, mediaType, details[i]);
		card.style.setProperty('--card-i', i);
		card.classList.add('is-entering');
		strip.appendChild(card);
	});
	_updateFadeMask(strip);
};

/** Show the collection section */
export const showCollection = () => {
	document.getElementById('user-collection')?.removeAttribute('hidden');
};

/** Hide the collection section */
export const hideCollection = () => {
	document.getElementById('user-collection')?.setAttribute('hidden', '');
};

/**
 * Initialize the collection: wire the toggle button, filter dropdown and load default view.
 * Call once after the user is confirmed logged in.
 */
export const initCollection = () => {
	const section  = document.getElementById('user-collection');
	const toggleEl = document.getElementById('collection-toggle');
	const filterEl = document.getElementById('collection-filter');

	// Toggle collapse / expand
	if (toggleEl && section) {
		toggleEl.addEventListener('click', () => {
			const isCollapsed = section.classList.toggle('user-collection--collapsed');
			// Charge la liste lors du premier dépliage si le strip est vide
			if (!isCollapsed) {
				const strip = document.getElementById('collection-strip');
				if (strip && strip.children.length <= 1 && !strip.querySelector('.col-card')) {
					loadCollection(filterEl?.value ?? 'towatch');
				}
			}
		});
	}

	if (filterEl) {
		filterEl.addEventListener('change', () => loadCollection(filterEl.value));
	}

	// Fade mask on scroll
	const strip = document.getElementById('collection-strip');
	if (strip) {
		strip.addEventListener('scroll', () => _updateFadeMask(strip), { passive: true });
	}
};

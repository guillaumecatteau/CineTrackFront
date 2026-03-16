const API_BASE_PATH = "../CineTrackBack/Api";

const postJson = async (endpoint, payload) => {
	try {
		const response = await fetch(`${API_BASE_PATH}/${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});

		let parsedBody = null;
		try {
			parsedBody = await response.json();
		} catch (_jsonError) {
			parsedBody = null;
		}

		if (!response.ok) {
			return {
				success: false,
				message: parsedBody?.message || parsedBody?.error || `Erreur HTTP ${response.status}`,
				errors: parsedBody?.errors,
				error: parsedBody?.error,
				status: response.status
			};
		}

		return parsedBody || {
			success: false,
			message: "Reponse serveur invalide"
		};
	} catch (_error) {
		return {
			success: false,
			message: "Impossible de joindre l'API"
		};
	}
};

export const registerUser = (payload) => postJson("auth.php", { action: "register", ...payload });

export const loginUser = (payload) => postJson("auth.php", { action: "login", ...payload });

export const searchMovies = ({ title, year, type, page = 1 }) => postJson("search.php", {
	action: "search",
	title,
	year: year || undefined,
	type: type || "movie",
	page
});

export const getMovieDetails = (imdbId) => postJson("search.php", {
	action: "getDetails",
	imdbId
});

export const addUserMovie = ({ userId, imdbId, isWatched = false, rating = null }) => postJson("user-movies.php", {
	action: "addMovie",
	userId,
	imdbId,
	isWatched,
	rating
});

export const getAllUserMovies = (userId) => postJson("user-movies.php", {
	action: "getAllMovies",
	userId
});

export const updateUserMovie = (id, data = {}) => postJson("user-movies.php", {
	action: "updateMovie",
	id,
	...data
});

export const toggleLike = (userMovieId) => postJson("tags.php", {
	action: "toggleLike",
	userMovieId
});

export const toggleDislike = (userMovieId) => postJson("tags.php", {
	action: "toggleDislike",
	userMovieId
});

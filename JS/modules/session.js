const USER_STORAGE_KEY = "cinetrack.currentUser";

const normalizeUser = (rawUser) => {
	if (!rawUser || typeof rawUser !== "object") {
		return null;
	}

	if (rawUser.isSimulated === true) {
		return null;
	}

	const idValue = Number.parseInt(rawUser.id, 10);
	if (!Number.isInteger(idValue) || idValue <= 0) {
		return null;
	}

	if (typeof rawUser.username !== "string" || rawUser.username.trim() === "") {
		return null;
	}

	if (typeof rawUser.email !== "string" || rawUser.email.trim() === "") {
		return null;
	}

	return {
		...rawUser,
		id: idValue,
		username: rawUser.username.trim(),
		email: rawUser.email.trim()
	};
};

export const getCurrentUser = () => {
	try {
		const rawValue = sessionStorage.getItem(USER_STORAGE_KEY);
		if (!rawValue) {
			return null;
		}

		const parsed = JSON.parse(rawValue);
		const normalizedUser = normalizeUser(parsed);
		if (!normalizedUser) {
			sessionStorage.removeItem(USER_STORAGE_KEY);
			return null;
		}

		return normalizedUser;
	} catch (_error) {
		sessionStorage.removeItem(USER_STORAGE_KEY);
		return null;
	}
};

export const setCurrentUser = (user) => {
	const normalizedUser = normalizeUser(user);
	if (!normalizedUser) {
		return;
	}
	sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
};

export const clearCurrentUser = () => {
	sessionStorage.removeItem(USER_STORAGE_KEY);
};

export const isAuthenticated = () => getCurrentUser() !== null;

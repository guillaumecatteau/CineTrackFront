const USER_STORAGE_KEY = "cinetrack.currentUser";

export const getCurrentUser = () => {
	try {
		const rawValue = sessionStorage.getItem(USER_STORAGE_KEY);
		if (!rawValue) {
			return null;
		}

		const parsed = JSON.parse(rawValue);
		return parsed && typeof parsed === "object" ? parsed : null;
	} catch (_error) {
		return null;
	}
};

export const setCurrentUser = (user) => {
	if (!user) {
		return;
	}
	sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearCurrentUser = () => {
	sessionStorage.removeItem(USER_STORAGE_KEY);
};

export const isAuthenticated = () => getCurrentUser() !== null;

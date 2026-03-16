export const normalizeCount = (value) => {
	const parsedValue = Number.parseInt(value, 10);
	return Number.isFinite(parsedValue) && parsedValue >= 0 ? String(parsedValue) : "0";
};

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isStrongPassword = (value) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

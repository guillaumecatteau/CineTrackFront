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

	if (!titleInput || !yearInput || !typeSelect || !searchButton || !resultsContainer || !resultsNav) {
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

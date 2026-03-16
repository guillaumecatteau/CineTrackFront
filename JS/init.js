import { initAuth } from "./modules/auth.js";
import { connected } from "./modules/connexion-simulation.js";
import { initResults } from "./modules/results.js";
import { initSearchControls } from "./modules/search-controls.js";
import { createSelectionController } from "./modules/selection.js";

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

	initSearchControls({
		titleInput,
		yearInput,
		typeSelect,
		searchButton
	});

	const selectionController = createSelectionController({
		resultsContainer,
		isUserConnected: connected
	});

	initResults({
		resultsContainer,
		resultsNav,
		searchForm,
		selectionController
	});

	initAuth({ authContainer });
});

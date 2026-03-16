import { mockResults, RESULTS_PER_PAGE } from "./connexion-simulation.js";
import { normalizeCount } from "./helpers.js";

const createCoverElement = (movie) => {
	const coverElement = document.createElement("article");
	coverElement.className = "cover";
	coverElement.dataset.title = movie.title;
	coverElement.dataset.year = movie.year;
	coverElement.dataset.likes = normalizeCount(movie.likes);
	coverElement.dataset.dislikes = normalizeCount(movie.dislikes);
	coverElement.dataset.stars = movie.stars;
	coverElement.dataset.summary = movie.summary || "No summary available.";
	coverElement.dataset.poster = movie.poster;

	const imageContainer = document.createElement("div");
	imageContainer.className = "cover-image-container";

	const image = document.createElement("img");
	image.className = "cover-image";
	image.src = movie.poster;
	image.alt = `${movie.title} poster`;

	const title = document.createElement("p");
	title.className = "cover-title";
	title.textContent = movie.title;

	imageContainer.appendChild(image);
	coverElement.appendChild(imageContainer);
	coverElement.appendChild(title);

	return coverElement;
};

export const initResults = ({ resultsContainer, resultsNav, searchForm, selectionController }) => {
	if (!resultsContainer || !resultsNav || !selectionController) {
		return;
	}

	let currentResultsPage = 1;

	const renderMockResultsPage = (pageNumber) => {
		const totalPages = Math.max(1, Math.ceil(mockResults.length / RESULTS_PER_PAGE));
		const safePageNumber = Math.max(1, Math.min(pageNumber, totalPages));
		const start = (safePageNumber - 1) * RESULTS_PER_PAGE;
		const end = start + RESULTS_PER_PAGE;
		const currentPageResults = mockResults.slice(start, end);

		selectionController.closeSelectionOverlay();
		resultsContainer.innerHTML = "";
		resultsNav.innerHTML = "";

		currentPageResults.forEach((movie) => {
			resultsContainer.appendChild(createCoverElement(movie));
		});

		if (safePageNumber < totalPages) {
			const nextButton = document.createElement("button");
			nextButton.type = "button";
			nextButton.className = "btn btn-primary";
			nextButton.textContent = "Résultats suivants";
			nextButton.addEventListener("click", () => {
				renderMockResultsPage(safePageNumber + 1);
			});
			resultsNav.appendChild(nextButton);
		}

		currentResultsPage = safePageNumber;
	};

	resultsContainer.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const coverElement = target.closest(".cover");
		if (!coverElement || !resultsContainer.contains(coverElement)) {
			return;
		}

		selectionController.openSelectionOverlay(coverElement);
	});

	if (searchForm) {
		searchForm.addEventListener("submit", (event) => {
			event.preventDefault();
			renderMockResultsPage(1);
		});
	}

	renderMockResultsPage(currentResultsPage);
};

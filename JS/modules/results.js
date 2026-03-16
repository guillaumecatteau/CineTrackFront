import { mockResults, RESULTS_PER_PAGE } from "./connexion-simulation.js";
import { normalizeCount } from "./helpers.js";
import { getMovieDetails, searchMovies } from "./api.js";

const createCoverElement = (movie) => {
	const coverElement = document.createElement("article");
	coverElement.className = "cover";
	coverElement.dataset.title = movie.title;
	coverElement.dataset.year = movie.year;
	coverElement.dataset.imdbId = movie.imdbId || "";
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

const renderMessage = (container, message) => {
	container.innerHTML = `
		<div class="cover">
			<p class="cover-title">${message}</p>
		</div>
	`;
};

export const initResults = ({ resultsContainer, resultsNav, searchForm, selectionController }) => {
	if (!resultsContainer || !resultsNav || !selectionController) {
		return;
	}

	let currentResultsPage = 1;
	let currentSearchParams = null;

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

	const renderApiResultsPage = async (pageNumber) => {
		if (!currentSearchParams) {
			return;
		}

		selectionController.closeSelectionOverlay();
		resultsContainer.innerHTML = "";
		resultsNav.innerHTML = "";

		const response = await searchMovies({
			...currentSearchParams,
			page: pageNumber
		});

		if (!response.success) {
			renderMessage(resultsContainer, `${response.message || "Erreur API"}. Affichage des résultats de démonstration.`);
			renderMockResultsPage(1);
			return;
		}

		if (!Array.isArray(response.movies) || response.movies.length === 0) {
			renderMessage(resultsContainer, "Aucun film trouvé pour cette recherche.");
			currentResultsPage = 1;
			return;
		}

		response.movies.forEach((movie) => {
			resultsContainer.appendChild(createCoverElement({
				...movie,
				likes: "0",
				dislikes: "0",
				stars: "0",
				summary: "Chargement des details..."
			}));
		});

		const totalResults = Number(response.totalResults) || response.movies.length;
		const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));

		if (pageNumber > 1) {
			const previousButton = document.createElement("button");
			previousButton.type = "button";
			previousButton.className = "btn btn-secondary";
			previousButton.textContent = "Resultats precedents";
			previousButton.addEventListener("click", () => {
				renderApiResultsPage(pageNumber - 1);
			});
			resultsNav.appendChild(previousButton);
		}

		if (pageNumber < totalPages) {
			const nextButton = document.createElement("button");
			nextButton.type = "button";
			nextButton.className = "btn btn-primary";
			nextButton.textContent = "Resultats suivants";
			nextButton.addEventListener("click", () => {
				renderApiResultsPage(pageNumber + 1);
			});
			resultsNav.appendChild(nextButton);
		}

		currentResultsPage = pageNumber;
	};

	const hydrateCoverWithDetails = async (coverElement) => {
		if (!(coverElement instanceof HTMLElement)) {
			return;
		}

		if (coverElement.dataset.detailsLoaded === "true") {
			return;
		}

		const imdbId = coverElement.dataset.imdbId;
		if (!imdbId) {
			return;
		}

		const detailsResponse = await getMovieDetails(imdbId);
		if (!detailsResponse.success || !detailsResponse.movie) {
			return;
		}

		const { movie } = detailsResponse;
		coverElement.dataset.title = movie.title || coverElement.dataset.title || "Unknown title";
		coverElement.dataset.year = movie.year || coverElement.dataset.year || "N/A";
		coverElement.dataset.stars = movie.imdbRating ? String(Math.min(5, Number(movie.imdbRating) / 2)) : "0";
		coverElement.dataset.summary = movie.plot || "No summary available.";
		if (movie.poster) {
			coverElement.dataset.poster = movie.poster;
			const coverImage = coverElement.querySelector(".cover-image");
			if (coverImage) {
				coverImage.setAttribute("src", movie.poster);
			}
		}

		coverElement.dataset.detailsLoaded = "true";
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

		hydrateCoverWithDetails(coverElement).finally(() => {
			selectionController.openSelectionOverlay(coverElement);
		});
	});

	if (searchForm) {
		searchForm.addEventListener("submit", (event) => {
			event.preventDefault();

			const titleInput = searchForm.querySelector("#title");
			const yearInput = searchForm.querySelector("#year");
			const typeSelect = searchForm.querySelector("#type");

			const title = titleInput?.value?.trim() || "";
			if (!title) {
				renderMessage(resultsContainer, "Le titre est requis pour lancer la recherche.");
				resultsNav.innerHTML = "";
				return;
			}

			currentSearchParams = {
				title,
				year: yearInput?.value?.trim() || "",
				type: typeSelect?.value || "movie"
			};

			if (titleInput && yearInput && typeSelect) {
				titleInput.value = "";
				yearInput.value = "";
				typeSelect.value = "";
				titleInput.dispatchEvent(new Event("input", { bubbles: true }));
				yearInput.dispatchEvent(new Event("input", { bubbles: true }));
				typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
			}

			renderApiResultsPage(1);
		});
	}

	renderMockResultsPage(currentResultsPage);
};

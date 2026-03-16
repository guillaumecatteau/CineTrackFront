import { normalizeCount } from "./helpers.js";

const THUMBS_UP_PATH = "M2 21h4V9H2v12zm19-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L12.17 1 5.59 7.59C5.22 7.95 5 8.45 5 9v10c0 1.1.9 2 2 2h9c.82 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z";
const THUMBS_DOWN_PATH = "M15 3H6c-.82 0-1.54.5-1.84 1.22L1.14 11.27c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z";

const createIconSvg = (pathData) => {
	const icon = document.createElement("span");
	icon.className = "selection-icon";
	icon.setAttribute("aria-hidden", "true");

	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("focusable", "false");

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute("d", pathData);

	svg.appendChild(path);
	icon.appendChild(svg);
	return icon;
};

const createFallbackTemplate = () => {
	const template = document.createElement("template");
	template.innerHTML = `
		<div class="selection-overlay">
			<div class="selection-panel">
				<div class="selection-image-wrap">
					<img class="selection-image" src="" alt="Movie poster">
				</div>
				<div class="selection-details">
					<h2 class="selection-title" data-selection="title">Unknown title</h2>
					<div class="selection-meta">
						<span class="selection-meta-item"><span class="selection-meta-label">year</span><span class="selection-meta-value" data-selection="year">N/A</span></span>
						<span class="selection-meta-separator" data-selection-separator="after-year">-</span>
						<span class="selection-meta-item" data-selection-item="likes">
							<span class="selection-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="${THUMBS_UP_PATH}"/></svg></span>
							<span class="selection-meta-value" data-selection="likes">0</span>
						</span>
						<span class="selection-meta-item" data-selection-item="dislikes">
							<span class="selection-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="${THUMBS_DOWN_PATH}"/></svg></span>
							<span class="selection-meta-value" data-selection="dislikes">0</span>
						</span>
						<span class="selection-meta-separator" data-selection-separator="after-dislikes">-</span>
						<div class="selection-stars" data-selection="stars"></div>
					</div>
					<div class="selection-summary">
						<p class="selection-summary-text" data-selection="summary">No summary available.</p>
					</div>
					<p class="selection-connect-text" data-selection="connect-text">connect to rate this movie</p>
					<div class="selection-user-actions" data-selection="user-actions">
						<button type="button" class="btn btn-primary">👍</button>
						<button type="button" class="btn btn-secondary">👎</button>
						<button type="button" class="btn btn-primary">View</button>
					</div>
					<button type="button" class="btn btn-secondary" data-selection="back-button">Back</button>
				</div>
			</div>
		</div>
	`;
	return template;
};

const createLikeDislikeMetaItem = (kind) => {
	const item = document.createElement("span");
	item.className = "selection-meta-item";
	item.dataset.selectionItem = kind;

	item.appendChild(createIconSvg(kind === "likes" ? THUMBS_UP_PATH : THUMBS_DOWN_PATH));

	const value = document.createElement("span");
	value.className = "selection-meta-value";
	value.dataset.selection = kind;
	value.textContent = "0";
	item.appendChild(value);

	return item;
};

const createStarNode = (state) => {
	const star = document.createElement("span");
	star.className = `selection-star selection-star--${state}`;
	star.textContent = "★";
	return star;
};

const renderStars = (targetContainer, ratingValue) => {
	targetContainer.innerHTML = "";
	const normalizedRating = Math.max(0, Math.min(5, Number(ratingValue) || 0));

	for (let index = 1; index <= 5; index += 1) {
		if (normalizedRating >= index) {
			targetContainer.appendChild(createStarNode("full"));
			continue;
		}

		if (normalizedRating >= index - 0.5) {
			targetContainer.appendChild(createStarNode("half"));
			continue;
		}

		targetContainer.appendChild(createStarNode("empty"));
	}
};

export const createSelectionController = ({ resultsContainer, isUserConnected = false, templateUrl = "template/selection.html" }) => {
	let selectionTemplate = null;

	const closeSelectionOverlay = () => {
		const existingOverlay = resultsContainer.querySelector(".selection-overlay");
		if (existingOverlay) {
			existingOverlay.remove();
		}
		resultsContainer.classList.remove("results--blurred");
	};

	const ensureSelectionTemplate = async () => {
		if (selectionTemplate) {
			return selectionTemplate;
		}

		try {
			const response = await fetch(templateUrl);
			const htmlText = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlText, "text/html");
			selectionTemplate = doc.querySelector("#selection-template");
		} catch (_error) {
			selectionTemplate = null;
		}

		if (!selectionTemplate) {
			selectionTemplate = createFallbackTemplate();
		}

		return selectionTemplate;
	};

	const openSelectionOverlay = async (coverElement) => {
		const template = await ensureSelectionTemplate();
		const selectionFragment = template.content.cloneNode(true);
		const overlay = selectionFragment.querySelector(".selection-overlay");

		if (!overlay) {
			return;
		}

		const imageElement = overlay.querySelector(".selection-image");
		const selectionDetails = overlay.querySelector(".selection-details");
		const selectionMeta = overlay.querySelector(".selection-meta");
		const titleNode = overlay.querySelector('[data-selection="title"]');
		const yearNode = overlay.querySelector('[data-selection="year"]');
		let likesNode = overlay.querySelector('[data-selection="likes"]');
		let dislikesNode = overlay.querySelector('[data-selection="dislikes"]');
		let starsNode = overlay.querySelector('[data-selection="stars"]');
		let summaryNode = overlay.querySelector('[data-selection="summary"]');
		const connectTextNode = overlay.querySelector('[data-selection="connect-text"]');
		const userActionsNode = overlay.querySelector('[data-selection="user-actions"]');
		let backButton = overlay.querySelector('[data-selection="back-button"]');

		if (selectionMeta && !likesNode) {
			const likesItem = overlay.querySelector('[data-selection-item="likes"]');
			if (likesItem) {
				const value = document.createElement("span");
				value.className = "selection-meta-value";
				value.dataset.selection = "likes";
				value.textContent = "0";
				likesItem.appendChild(value);
			} else {
				selectionMeta.appendChild(createLikeDislikeMetaItem("likes"));
			}
			likesNode = overlay.querySelector('[data-selection="likes"]');
		}

		if (selectionMeta && !dislikesNode) {
			const dislikesItem = overlay.querySelector('[data-selection-item="dislikes"]');
			if (dislikesItem) {
				const value = document.createElement("span");
				value.className = "selection-meta-value";
				value.dataset.selection = "dislikes";
				value.textContent = "0";
				dislikesItem.appendChild(value);
			} else {
				selectionMeta.appendChild(createLikeDislikeMetaItem("dislikes"));
			}
			dislikesNode = overlay.querySelector('[data-selection="dislikes"]');
		}

		if (selectionMeta && !starsNode) {
			starsNode = document.createElement("div");
			starsNode.className = "selection-stars";
			starsNode.dataset.selection = "stars";
			selectionMeta.appendChild(starsNode);
		}

		if (selectionMeta) {
			let afterYearSeparator = overlay.querySelector('[data-selection-separator="after-year"]');
			const yearItem = yearNode ? yearNode.closest(".selection-meta-item") : null;
			if (!afterYearSeparator) {
				afterYearSeparator = document.createElement("span");
				afterYearSeparator.className = "selection-meta-separator";
				afterYearSeparator.dataset.selectionSeparator = "after-year";
				afterYearSeparator.textContent = "-";
			}
			if (yearItem && yearItem.nextElementSibling !== afterYearSeparator) {
				yearItem.insertAdjacentElement("afterend", afterYearSeparator);
			}

			let afterDislikesSeparator = overlay.querySelector('[data-selection-separator="after-dislikes"]');
			const dislikesItem = overlay.querySelector('[data-selection-item="dislikes"]');
			if (!afterDislikesSeparator) {
				afterDislikesSeparator = document.createElement("span");
				afterDislikesSeparator.className = "selection-meta-separator";
				afterDislikesSeparator.dataset.selectionSeparator = "after-dislikes";
				afterDislikesSeparator.textContent = "-";
			}
			if (starsNode) {
				selectionMeta.insertBefore(afterDislikesSeparator, starsNode);
			} else if (dislikesItem && dislikesItem.nextElementSibling !== afterDislikesSeparator) {
				dislikesItem.insertAdjacentElement("afterend", afterDislikesSeparator);
			}
		}

		if (selectionDetails && !summaryNode) {
			const summaryWrap = document.createElement("div");
			summaryWrap.className = "selection-summary";
			summaryNode = document.createElement("p");
			summaryNode.className = "selection-summary-text";
			summaryNode.dataset.selection = "summary";
			summaryNode.textContent = "No summary available.";
			summaryWrap.appendChild(summaryNode);
			selectionDetails.appendChild(summaryWrap);
		}

		if (selectionDetails && !backButton) {
			backButton = document.createElement("button");
			backButton.type = "button";
			backButton.className = "btn btn-secondary";
			backButton.dataset.selection = "back-button";
			backButton.textContent = "Back";
			selectionDetails.appendChild(backButton);
		}

		const coverTitle = coverElement.dataset.title || coverElement.querySelector(".cover-title")?.textContent?.trim() || "Unknown title";
		const coverYear = coverElement.dataset.year || "N/A";
		const coverLikes = normalizeCount(coverElement.dataset.likes);
		const coverDislikes = normalizeCount(coverElement.dataset.dislikes);
		const coverStars = coverElement.dataset.stars || "0";
		const coverSummary = coverElement.dataset.summary || "No summary available.";
		const coverImage = coverElement.dataset.poster || coverElement.querySelector(".cover-image")?.getAttribute("src") || "images/logo_CineTrack.png";

		if (imageElement) {
			imageElement.src = coverImage;
			imageElement.alt = `${coverTitle} poster`;
		}
		if (titleNode) {
			titleNode.textContent = coverTitle;
		}
		if (yearNode) {
			yearNode.textContent = coverYear;
		}
		if (likesNode) {
			likesNode.textContent = coverLikes;
		}
		if (dislikesNode) {
			dislikesNode.textContent = coverDislikes;
		}
		if (starsNode) {
			renderStars(starsNode, coverStars);
		}
		if (summaryNode) {
			summaryNode.textContent = coverSummary;
		}

		if (connectTextNode && userActionsNode) {
			connectTextNode.style.display = isUserConnected ? "none" : "block";
			userActionsNode.style.display = isUserConnected ? "flex" : "none";
		}

		if (backButton) {
			backButton.addEventListener("click", closeSelectionOverlay);
		}

		overlay.addEventListener("click", (event) => {
			if (event.target === overlay) {
				closeSelectionOverlay();
			}
		});

		closeSelectionOverlay();
		resultsContainer.classList.add("results--blurred");
		resultsContainer.appendChild(overlay);
	};

	return {
		openSelectionOverlay,
		closeSelectionOverlay
	};
};

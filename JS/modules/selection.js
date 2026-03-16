import { normalizeCount } from "./helpers.js";
import { addUserMovie, getAllUserMovies, toggleDislike, toggleLike, updateUserMovie } from "./api.js";

// Design guardrail: always expose connected controls in movie overlay.
const DESIGN_CONNECTED_OVERLAY_ONLY = true;

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
						<button type="button" class="btn btn-primary" data-selection-action="add">Add to my list</button>
						<button type="button" class="btn btn-secondary" data-selection-action="towatch">To watch</button>
						<button type="button" class="btn btn-primary" data-selection-action="like">Like</button>
						<button type="button" class="btn btn-secondary" data-selection-action="dislike">Dislike</button>
					</div>
					<div class="selection-rate" data-selection="rate-wrap">
						<span class="selection-rate-label">Rate</span>
						<div class="selection-rate-stars" data-selection="rate-stars" aria-label="Rate movie"></div>
						<span class="selection-rate-value" data-selection="rate-value">0.0/5</span>
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

const renderRateStars = (targetContainer, ratingValue) => {
	targetContainer.innerHTML = "";
	const normalizedRating = Math.max(0, Math.min(5, Number(ratingValue) || 0));

	for (let index = 1; index <= 5; index += 1) {
		const starNode = createStarNode("empty");
		starNode.classList.add("selection-star--interactive");

		if (normalizedRating >= index) {
			starNode.classList.remove("selection-star--empty");
			starNode.classList.add("selection-star--full");
		} else if (normalizedRating >= index - 0.5) {
			starNode.classList.remove("selection-star--empty");
			starNode.classList.add("selection-star--half");
		}

		targetContainer.appendChild(starNode);
	}
};

export const createSelectionController = ({
	resultsContainer,
	isUserConnected = () => false,
	getCurrentUser = () => null,
	templateUrl = "template/selection.html"
}) => {
	let selectionTemplate = null;
	const userMovieCache = new Map();
	const movieInteractionState = new Map();

	const getConnectionState = () => (typeof isUserConnected === "function" ? isUserConnected() : Boolean(isUserConnected));

	const getCacheKey = (userId, imdbId) => `${userId}:${imdbId}`;

	const hydrateUserMovieCache = async (userId) => {
		const listResponse = await getAllUserMovies(userId);
		if (!listResponse.success || !Array.isArray(listResponse.movies)) {
			return;
		}

		listResponse.movies.forEach((movie) => {
			if (!movie.imdbId || !movie.id) {
				return;
			}
			userMovieCache.set(getCacheKey(userId, movie.imdbId), movie.id);
		});
	};

	const ensureUserMovieId = async (userId, imdbId) => {
		if (!userId || !imdbId) {
			return null;
		}

		const cacheKey = getCacheKey(userId, imdbId);
		if (userMovieCache.has(cacheKey)) {
			return userMovieCache.get(cacheKey);
		}

		await hydrateUserMovieCache(userId);
		if (userMovieCache.has(cacheKey)) {
			return userMovieCache.get(cacheKey);
		}

		const addResponse = await addUserMovie({ userId, imdbId, isWatched: false, rating: null });
		if (addResponse.success && addResponse.userMovie?.id) {
			userMovieCache.set(cacheKey, addResponse.userMovie.id);
			return addResponse.userMovie.id;
		}

		// In case movie already exists and backend only returns a message, refresh cache once.
		await hydrateUserMovieCache(userId);
		return userMovieCache.get(cacheKey) || null;
	};

	const getMovieInteractionState = (imdbId, initialStars) => {
		if (!imdbId) {
			return {
				inList: false,
				toWatch: false,
				liked: false,
				disliked: false,
				rating: Math.max(0, Math.min(5, Number(initialStars) || 0))
			};
		}

		if (!movieInteractionState.has(imdbId)) {
			movieInteractionState.set(imdbId, {
				inList: false,
				toWatch: false,
				liked: false,
				disliked: false,
				rating: Math.max(0, Math.min(5, Number(initialStars) || 0))
			});
		}

		return movieInteractionState.get(imdbId);
	};

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
		let userActionsNode = overlay.querySelector('[data-selection="user-actions"]');
		let likeButton = overlay.querySelector('[data-selection-action="like"]');
		let dislikeButton = overlay.querySelector('[data-selection-action="dislike"]');
		let addButton = overlay.querySelector('[data-selection-action="add"]');
		let toWatchButton = overlay.querySelector('[data-selection-action="towatch"]');
		let rateWrapNode = overlay.querySelector('[data-selection="rate-wrap"]');
		let rateStarsNode = overlay.querySelector('[data-selection="rate-stars"]');
		let rateValueNode = overlay.querySelector('[data-selection="rate-value"]');
		let backButton = overlay.querySelector('[data-selection="back-button"]');

		if (!userActionsNode && selectionDetails) {
			const generatedActions = document.createElement("div");
			generatedActions.className = "selection-user-actions";
			generatedActions.dataset.selection = "user-actions";
			generatedActions.innerHTML = `
				<button type="button" class="btn btn-primary" data-selection-action="add">Add to my list</button>
				<button type="button" class="btn btn-secondary" data-selection-action="towatch">To watch</button>
				<button type="button" class="btn btn-primary" data-selection-action="like">Like</button>
				<button type="button" class="btn btn-secondary" data-selection-action="dislike">Dislike</button>
			`;

			if (connectTextNode && connectTextNode.parentElement === selectionDetails) {
				connectTextNode.insertAdjacentElement("afterend", generatedActions);
			} else if (backButton) {
				selectionDetails.insertBefore(generatedActions, backButton);
			} else {
				selectionDetails.appendChild(generatedActions);
			}

			userActionsNode = generatedActions;
			likeButton = overlay.querySelector('[data-selection-action="like"]');
			dislikeButton = overlay.querySelector('[data-selection-action="dislike"]');
			addButton = overlay.querySelector('[data-selection-action="add"]');
			toWatchButton = overlay.querySelector('[data-selection-action="towatch"]');
		}

		if (userActionsNode && (!addButton || !toWatchButton || !likeButton || !dislikeButton)) {
			userActionsNode.innerHTML = `
				<button type="button" class="btn btn-primary" data-selection-action="add">Add to my list</button>
				<button type="button" class="btn btn-secondary" data-selection-action="towatch">To watch</button>
				<button type="button" class="btn btn-primary" data-selection-action="like">Like</button>
				<button type="button" class="btn btn-secondary" data-selection-action="dislike">Dislike</button>
			`;

			likeButton = overlay.querySelector('[data-selection-action="like"]');
			dislikeButton = overlay.querySelector('[data-selection-action="dislike"]');
			addButton = overlay.querySelector('[data-selection-action="add"]');
			toWatchButton = overlay.querySelector('[data-selection-action="towatch"]');
		}

		if (selectionDetails && !rateWrapNode) {
			const generatedRateWrap = document.createElement("div");
			generatedRateWrap.className = "selection-rate";
			generatedRateWrap.dataset.selection = "rate-wrap";
			generatedRateWrap.innerHTML = `
				<span class="selection-rate-label">Rate</span>
				<div class="selection-rate-stars" data-selection="rate-stars" aria-label="Rate movie"></div>
				<span class="selection-rate-value" data-selection="rate-value">0.0/5</span>
			`;

			if (backButton) {
				selectionDetails.insertBefore(generatedRateWrap, backButton);
			} else {
				selectionDetails.appendChild(generatedRateWrap);
			}

			rateWrapNode = generatedRateWrap;
			rateStarsNode = generatedRateWrap.querySelector('[data-selection="rate-stars"]');
			rateValueNode = generatedRateWrap.querySelector('[data-selection="rate-value"]');
		}

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
		const coverImdbId = coverElement.dataset.imdbId || "";
		const interactionState = getMovieInteractionState(coverImdbId, coverStars);

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

		const userConnected = DESIGN_CONNECTED_OVERLAY_ONLY || getConnectionState();
		if (connectTextNode && userActionsNode) {
			connectTextNode.style.display = userConnected ? "none" : "block";
			userActionsNode.style.display = userConnected ? "flex" : "none";
		}
		if (userConnected && userActionsNode) {
			userActionsNode.style.display = "flex";
		}
		if (rateWrapNode) {
			rateWrapNode.style.display = userConnected ? "flex" : "none";
		}

		const showActionMessage = (message, isError = false) => {
			if (!connectTextNode) {
				return;
			}
			connectTextNode.textContent = message;
			connectTextNode.style.display = "block";
			connectTextNode.style.color = isError ? "#b3261e" : "";
		};

		if (userConnected) {
			const user = getCurrentUser();
			const imdbId = coverElement.dataset.imdbId || "";
			const isSimulatedUser = !user?.id || user?.isSimulated;
			let userMovieId = null;

			const syncActionButtons = () => {
				if (addButton) {
					addButton.classList.toggle("is-active", interactionState.inList);
				}
				if (toWatchButton) {
					toWatchButton.classList.toggle("is-active", interactionState.toWatch);
				}
				if (likeButton) {
					likeButton.classList.toggle("is-active", interactionState.liked);
				}
				if (dislikeButton) {
					dislikeButton.classList.toggle("is-active", interactionState.disliked);
				}
			};

			const updateRateUi = (rating) => {
				if (!rateStarsNode || !rateValueNode) {
					return;
				}

				renderRateStars(rateStarsNode, rating);
				rateValueNode.textContent = `${rating.toFixed(1)}/5`;
				coverElement.dataset.stars = String(rating);
			};

			const persistRating = async (rating) => {
				interactionState.rating = rating;
				updateRateUi(rating);

				if (isSimulatedUser) {
					showActionMessage(`Rated ${rating.toFixed(1)}/5 (mode simulation)`);
					return;
				}

				if (!userMovieId) {
					userMovieId = await ensureUserMovieId(user?.id, imdbId);
					if (!userMovieId) {
						showActionMessage("Impossible d'enregistrer la note.", true);
						return;
					}
				}

				const response = await updateUserMovie(userMovieId, { rating });
				showActionMessage(response.success ? `Rating saved: ${rating.toFixed(1)}/5` : (response.message || "Action impossible"), !response.success);
			};

			if (rateStarsNode) {
				updateRateUi(interactionState.rating);

				let pointerDown = false;
				const computeRatingFromClientX = (clientX) => {
					const rect = rateStarsNode.getBoundingClientRect();
					if (rect.width <= 0) {
						return 0;
					}

					const relativeX = Math.min(rect.width, Math.max(0, clientX - rect.left));
					const raw = (relativeX / rect.width) * 5;
					const snapped = Math.round(raw * 2) / 2;
					return Math.max(0.5, Math.min(5, snapped || 0.5));
				};

				rateStarsNode.addEventListener("pointerdown", (event) => {
					pointerDown = true;
					rateStarsNode.setPointerCapture(event.pointerId);
					persistRating(computeRatingFromClientX(event.clientX));
				});

				rateStarsNode.addEventListener("pointermove", (event) => {
					if (!pointerDown) {
						return;
					}
					persistRating(computeRatingFromClientX(event.clientX));
				});

				rateStarsNode.addEventListener("pointerup", (event) => {
					pointerDown = false;
					rateStarsNode.releasePointerCapture(event.pointerId);
				});

				rateStarsNode.addEventListener("pointercancel", () => {
					pointerDown = false;
				});
			}

			syncActionButtons();

			if (addButton) {
				addButton.addEventListener("click", async () => {
					interactionState.inList = true;
					syncActionButtons();

					if (isSimulatedUser) {
						showActionMessage("Film ajoute a votre liste (mode simulation)");
						return;
					}

					userMovieId = await ensureUserMovieId(user?.id, imdbId);
					if (!userMovieId) {
						showActionMessage("Impossible d'ajouter ce film a votre collection.", true);
						return;
					}
					showActionMessage("Film ajoute a votre collection.");
				});
			}

			if (toWatchButton) {
				toWatchButton.addEventListener("click", async () => {
					interactionState.inList = true;
					interactionState.toWatch = !interactionState.toWatch;
					syncActionButtons();

					if (isSimulatedUser) {
						showActionMessage(interactionState.toWatch ? "Ajoute a To watch (mode simulation)" : "Retire de To watch (mode simulation)");
						return;
					}

					userMovieId = await ensureUserMovieId(user?.id, imdbId);
					if (!userMovieId) {
						showActionMessage("Action impossible", true);
						return;
					}

					const response = await updateUserMovie(userMovieId, { isWatched: !interactionState.toWatch });
					showActionMessage(response.success ? (interactionState.toWatch ? "Ajoute a To watch" : "Retire de To watch") : (response.message || "Action impossible"), !response.success);
				});
			}

			if (likeButton) {
				likeButton.addEventListener("click", async () => {
					interactionState.inList = true;
					interactionState.liked = !interactionState.liked;
					if (interactionState.liked) {
						interactionState.disliked = false;
					}
					syncActionButtons();

					if (isSimulatedUser) {
						showActionMessage(interactionState.liked ? "Like active (mode simulation)" : "Like retire (mode simulation)");
						return;
					}

					userMovieId = await ensureUserMovieId(user?.id, imdbId);
					if (!userMovieId) {
						showActionMessage("Ajoutez d'abord le film a votre collection.", true);
						return;
					}

					const response = await toggleLike(userMovieId);
					showActionMessage(response.success ? (response.message || "Like mis a jour") : (response.message || "Action impossible"), !response.success);
				});
			}

			if (dislikeButton) {
				dislikeButton.addEventListener("click", async () => {
					interactionState.inList = true;
					interactionState.disliked = !interactionState.disliked;
					if (interactionState.disliked) {
						interactionState.liked = false;
					}
					syncActionButtons();

					if (isSimulatedUser) {
						showActionMessage(interactionState.disliked ? "Dislike active (mode simulation)" : "Dislike retire (mode simulation)");
						return;
					}

					userMovieId = await ensureUserMovieId(user?.id, imdbId);
					if (!userMovieId) {
						showActionMessage("Ajoutez d'abord le film a votre collection.", true);
						return;
					}

					const response = await toggleDislike(userMovieId);
					showActionMessage(response.success ? (response.message || "Dislike mis a jour") : (response.message || "Action impossible"), !response.success);
				});
			}
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

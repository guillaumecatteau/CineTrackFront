import { isValidEmail } from "./helpers.js";
import { loginUser, registerUser } from "./api.js";
import { clearCurrentUser, getCurrentUser, setCurrentUser } from "./session.js";

// UI-only mode: always simulate login to design connected screens without backend dependency.
const DESIGN_CONNECTED_UI_ONLY = true;

const buildSimulatedUser = (email) => {
	const localPart = String(email || "user").split("@")[0] || "user";
	const safeUsername = localPart.replace(/[^a-zA-Z0-9_-]/g, "") || "user";

	return {
		id: 0,
		email,
		username: safeUsername,
		createdAt: null,
		isSimulated: true
	};
};

const attachLiveValidation = (fields, submitButton) => {
	const touchedFields = new Set();

	const setControlDisabled = (control, isDisabled) => {
		if (!control) {
			return;
		}

		if ("disabled" in control) {
			control.disabled = isDisabled;
		} else {
			control.setAttribute("aria-disabled", isDisabled ? "true" : "false");
			control.classList.toggle("auth-icon-action--disabled", isDisabled);
		}
	};

	const updateState = () => {
		let allValid = true;

		fields.forEach((field) => {
			const currentValue = field.input.value.trim();
			const isValid = field.validator(currentValue);
			const isTouched = touchedFields.has(field.input.id);

			field.error.textContent = !isValid && isTouched ? field.errorMessage : "";
			if (!isValid) {
				allValid = false;
			}
		});

		setControlDisabled(submitButton, !allValid);
	};

	fields.forEach((field) => {
		field.input.addEventListener("input", updateState);
		field.input.addEventListener("blur", () => {
			touchedFields.add(field.input.id);
			updateState();
		});
	});

	updateState();
};

const bindIconAction = (element, callback) => {
	if (!element) {
		return;
	}

	const isDisabled = () => element.getAttribute("aria-disabled") === "true";

	const runAction = () => {
		if (isDisabled()) {
			return;
		}
		callback();
	};

	element.addEventListener("click", runAction);
	element.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			runAction();
		}
	});
};

const setEyeIconPath = (iconPath, isVisible) => {
	if (!iconPath) {
		return;
	}

	if (isVisible) {
		// Eye open
		iconPath.setAttribute("d", "M12 5C6.5 5 2 9.5 1 12c1 2.5 5.5 7 11 7s10-4.5 11-7c-1-2.5-5.5-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z");
	} else {
		// Eye closed (slashed)
		iconPath.setAttribute("d", "M2 4.5 3.5 3 21 20.5 19.5 22l-3-3C15 19.6 13.6 20 12 20 6.5 20 2 15.5 1 13c.6-1.5 2.3-3.8 5-5.5L2 4.5zm8.6 8.6a2 2 0 0 0 2.8 2.8l-2.8-2.8zM12 6c5.5 0 10 4.5 11 7-.3.8-1 1.9-2 3l-3-3A6 6 0 0 0 11 6.1L9.4 4.5c.8-.3 1.7-.5 2.6-.5z");
	}
};

const attachPasswordVisibilityToggle = (passwordInput) => {
	if (!passwordInput) {
		return;
	}

	const field = passwordInput.closest(".auth-field");
	if (!field) {
		return;
	}

	field.classList.add("auth-field--password");

	const toggleButton = document.createElement("button");
	toggleButton.type = "button";
	toggleButton.className = "password-visibility-toggle";
	toggleButton.setAttribute("aria-label", "Afficher le mot de passe");
	toggleButton.setAttribute("aria-pressed", "false");

	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("focusable", "false");

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	svg.appendChild(path);
	toggleButton.appendChild(svg);
	field.appendChild(toggleButton);

	const updateToggleState = () => {
		const isVisible = passwordInput.type === "text";
		setEyeIconPath(path, isVisible);
		toggleButton.setAttribute("aria-label", isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe");
		toggleButton.setAttribute("aria-pressed", isVisible ? "true" : "false");
	};

	toggleButton.addEventListener("click", () => {
		passwordInput.type = passwordInput.type === "password" ? "text" : "password";
		updateToggleState();
	});

	updateToggleState();
};

export const initAuth = ({ authContainer }) => {
	if (!authContainer) {
		return;
	}

	const initialAuthMarkup = authContainer.innerHTML;
	const signUpOverlay = document.getElementById("signup-overlay");
	const signUpOverlayContent = document.getElementById("signup-overlay-content");

	const getErrorMessage = (response, fallbackMessage) => {
		if (response?.errors && typeof response.errors === "object") {
			return Object.values(response.errors).join(" ");
		}

		if (typeof response?.message === "string" && response.message.trim() !== "") {
			return response.message;
		}

		return fallbackMessage;
	};

	const setStatusMessage = (node, message, type = "error") => {
		if (!node) {
			return;
		}

		node.textContent = message || "";
		node.classList.remove("auth-status--success", "auth-status--error");
		node.classList.add(type === "success" ? "auth-status--success" : "auth-status--error");
	};

	const renderFeedbackState = ({ targetNode, title, detail = "", type = "success", withBack = false, onBack = null }) => {
		if (!targetNode) {
			return;
		}

		targetNode.innerHTML = `
			<div class="auth-feedback auth-feedback--${type}">
				<p class="auth-feedback-title">${title}</p>
				${detail ? `<p class="auth-feedback-detail">${detail}</p>` : ""}
				${withBack ? `<button type="button" class="btn btn-secondary" id="auth-feedback-back">Back</button>` : ""}
			</div>
		`;

		if (withBack) {
			const backButton = targetNode.querySelector("#auth-feedback-back");
			if (backButton) {
				backButton.addEventListener("click", onBack || restoreInitialAuthButtons);
			}
		}
	};

	const openSignUpOverlay = () => {
		if (!signUpOverlay || !signUpOverlayContent) {
			return;
		}

		renderSignUpForm();
		signUpOverlay.classList.add("signup-overlay--open");
		signUpOverlay.setAttribute("aria-hidden", "false");
	};

	const closeSignUpOverlay = () => {
		if (!signUpOverlay || !signUpOverlayContent) {
			return;
		}

		signUpOverlay.classList.remove("signup-overlay--open");
		signUpOverlay.setAttribute("aria-hidden", "true");
		signUpOverlayContent.innerHTML = "";
	};

	const renderConnectedState = (user, successMessage = "") => {
		authContainer.innerHTML = `
			<div class="auth-form">
				<div class="auth-fields">
					<span class="auth-user-name" id="connected-user-trigger" role="button" tabindex="0" aria-label="Open user menu">${user.username}</span>
					${successMessage ? `<span class="auth-status auth-status--success">${successMessage}</span>` : ""}
				</div>
				<div class="auth-actions">
					<button type="button" class="btn btn-secondary" id="sign-out-trigger">Sign off</button>
				</div>
			</div>
		`;

		const connectedUserTrigger = document.getElementById("connected-user-trigger");
		if (connectedUserTrigger) {
			const handleUserClick = () => {
				// Placeholder for future connected-user screen/menu.
				if (successMessage) {
					return;
				}
				renderFeedbackState({
					targetNode: authContainer,
					title: `Connected as ${user.username}`,
					detail: "User screen placeholder",
					type: "success",
					withBack: true,
					onBack: () => renderConnectedState(user)
				});
			};

			connectedUserTrigger.addEventListener("click", handleUserClick);
			connectedUserTrigger.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					handleUserClick();
				}
			});
		}

		const signOutButton = document.getElementById("sign-out-trigger");
		if (signOutButton) {
			signOutButton.addEventListener("click", () => {
				clearCurrentUser();
				restoreInitialAuthButtons();
			});
		}
	};

	const restoreInitialAuthButtons = () => {
		authContainer.innerHTML = initialAuthMarkup;
		const newSignInTrigger = document.getElementById("sign-in-trigger");
		const newSignUpTrigger = document.getElementById("sign-up-trigger");

		if (newSignInTrigger) {
			newSignInTrigger.addEventListener("click", renderSignInForm);
		}
		if (newSignUpTrigger) {
			newSignUpTrigger.addEventListener("click", openSignUpOverlay);
		}
	};

	const renderSignUpForm = () => {
		if (!signUpOverlayContent) {
			return;
		}

		signUpOverlayContent.innerHTML = `
			<div class="auth-form auth-form--stacked">
				<div class="auth-fields">
					<div class="auth-field">
						<input type="text" id="signup-username" placeholder="USERNAME" autocomplete="off" autocapitalize="off" spellcheck="false">
						<div class="field-error" id="signup-username-error"></div>
					</div>
					<div class="auth-field">
						<input type="email" id="signup-mail" placeholder="MAIL" autocomplete="off" autocapitalize="off" spellcheck="false">
						<div class="field-error" id="signup-mail-error"></div>
					</div>
					<div class="auth-field">
						<input type="password" id="signup-password" placeholder="PASSWORD" autocomplete="new-password" autocapitalize="off" spellcheck="false">
						<div class="field-error" id="signup-password-error"></div>
					</div>
					<div class="auth-status auth-status--error" id="signup-status"></div>
				</div>
				<div class="auth-actions auth-actions--icons">
					<span class="auth-icon-action" id="signup-validate" role="button" tabindex="0" aria-label="Validate" aria-disabled="true">
						<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
							<path d="M20.29 5.71a1 1 0 0 1 0 1.41l-9 9a1 1 0 0 1-1.41 0l-4-4a1 1 0 1 1 1.41-1.41L10.59 14l8.29-8.29a1 1 0 0 1 1.41 0z"/>
						</svg>
					</span>
					<span class="auth-icon-action" id="signup-back" role="button" tabindex="0" aria-label="Cancel" aria-disabled="false">
						<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
							<path d="M18.3 5.71a1 1 0 0 1 0 1.41L13.41 12l4.89 4.88a1 1 0 1 1-1.41 1.42L12 13.41l-4.89 4.89a1 1 0 0 1-1.41-1.42L10.59 12 5.7 7.12A1 1 0 0 1 7.11 5.7L12 10.59l4.89-4.89a1 1 0 0 1 1.41.01z"/>
						</svg>
					</span>
				</div>
			</div>
		`;

		const usernameInput = signUpOverlayContent.querySelector("#signup-username");
		const mailInput = signUpOverlayContent.querySelector("#signup-mail");
		const passwordInput = signUpOverlayContent.querySelector("#signup-password");
		const usernameError = signUpOverlayContent.querySelector("#signup-username-error");
		const mailError = signUpOverlayContent.querySelector("#signup-mail-error");
		const passwordError = signUpOverlayContent.querySelector("#signup-password-error");
		const statusNode = signUpOverlayContent.querySelector("#signup-status");
		const validateButton = signUpOverlayContent.querySelector("#signup-validate");
		const backButton = signUpOverlayContent.querySelector("#signup-back");

		if (!usernameInput || !mailInput || !passwordInput || !usernameError || !mailError || !passwordError || !statusNode || !validateButton || !backButton) {
			return;
		}

		// Force clean state when opening signup overlay, even if browser tries to autofill.
		usernameInput.value = "";
		mailInput.value = "";
		passwordInput.value = "";

		attachPasswordVisibilityToggle(passwordInput);

		attachLiveValidation(
			[
				{
					input: usernameInput,
					error: usernameError,
					validator: (value) => value.length >= 3,
					errorMessage: "Minimum 3 caractères"
				},
				{
					input: mailInput,
					error: mailError,
					validator: (value) => isValidEmail(value),
					errorMessage: "Adresse mail invalide"
				},
				{
					input: passwordInput,
					error: passwordError,
					validator: (value) => value.length >= 8,
					errorMessage: "Minimum 8 caractères"
				}
			],
			validateButton
		);

		bindIconAction(validateButton, async () => {
			setStatusMessage(statusNode, "", "error");
			validateButton.setAttribute("aria-disabled", "true");
			validateButton.classList.add("auth-icon-action--disabled");

			const response = await registerUser({
				username: usernameInput.value.trim(),
				email: mailInput.value.trim(),
				password: passwordInput.value
			});

			if (!response.success || !response.user) {
				renderFeedbackState({
					targetNode: signUpOverlayContent,
					title: "Something went wrong",
					detail: getErrorMessage(response, "Inscription echouee"),
					type: "error",
					withBack: true,
					onBack: renderSignUpForm
				});
				return;
			}

			setCurrentUser(response.user);
			renderFeedbackState({
				targetNode: signUpOverlayContent,
				title: "Subscription succefull",
				type: "success"
			});

			window.setTimeout(() => {
				closeSignUpOverlay();
				renderConnectedState(response.user);
			}, 1200);
		});

		bindIconAction(backButton, closeSignUpOverlay);
	};

	const renderSignInForm = () => {
		authContainer.innerHTML = `
			<div class="auth-form">
				<div class="auth-fields">
					<div class="auth-field">
						<input type="email" id="signin-mail" placeholder="MAIL" autocomplete="off" autocapitalize="off" spellcheck="false">
						<div class="field-error" id="signin-mail-error"></div>
					</div>
					<div class="auth-field">
						<input type="password" id="signin-password" placeholder="PASSWORD" autocomplete="current-password" autocapitalize="off" spellcheck="false">
						<div class="field-error" id="signin-password-error"></div>
					</div>
					<div class="auth-status auth-status--error" id="signin-status"></div>
				</div>
				<div class="auth-actions">
					<button type="button" class="btn btn-primary" id="signin-connect" disabled>Connexion</button>
					<button type="button" class="btn btn-secondary" id="signin-back">Back</button>
				</div>
			</div>
		`;

		const mailInput = document.getElementById("signin-mail");
		const passwordInput = document.getElementById("signin-password");
		const mailError = document.getElementById("signin-mail-error");
		const passwordError = document.getElementById("signin-password-error");
		const statusNode = document.getElementById("signin-status");
		const connectButton = document.getElementById("signin-connect");
		const backButton = document.getElementById("signin-back");

		if (!mailInput || !passwordInput || !mailError || !passwordError || !statusNode || !connectButton || !backButton) {
			return;
		}

		attachPasswordVisibilityToggle(passwordInput);

		attachLiveValidation(
			[
				{
					input: mailInput,
					error: mailError,
					validator: (value) => isValidEmail(value),
					errorMessage: "Adresse mail invalide"
				},
				{
					input: passwordInput,
					error: passwordError,
					validator: (value) => value.length > 0,
					errorMessage: "Mot de passe requis"
				}
			],
			connectButton
		);

		connectButton.addEventListener("click", async () => {
			setStatusMessage(statusNode, "", "error");
			connectButton.disabled = true;

			if (DESIGN_CONNECTED_UI_ONLY) {
				const simulatedUser = buildSimulatedUser(mailInput.value.trim() || "designer@cinetrack.local");
				setCurrentUser(simulatedUser);
				renderFeedbackState({
					targetNode: authContainer,
					title: "Connexion succesfull",
					detail: "Mode design (simulation)",
					type: "success"
				});

				window.setTimeout(() => {
					renderConnectedState(simulatedUser);
				}, 700);
				return;
			}

			const response = await loginUser({
				email: mailInput.value.trim(),
				password: passwordInput.value
			});

			if (!response.success || !response.user) {
				const simulatedUser = buildSimulatedUser(mailInput.value.trim());
				setCurrentUser(simulatedUser);
				renderFeedbackState({
					targetNode: authContainer,
					title: "Connexion succesfull",
					detail: "Mode simulation active",
					type: "success"
				});

				window.setTimeout(() => {
					renderConnectedState(simulatedUser);
				}, 900);
				return;
			}

			setCurrentUser(response.user);
			renderFeedbackState({
				targetNode: authContainer,
				title: "Connexion succesfull",
				type: "success"
			});

			window.setTimeout(() => {
				renderConnectedState(response.user);
			}, 1200);
		});

		backButton.addEventListener("click", restoreInitialAuthButtons);
	};

	const signInTrigger = document.getElementById("sign-in-trigger");
	const signUpTrigger = document.getElementById("sign-up-trigger");

	if (signInTrigger) {
		signInTrigger.addEventListener("click", renderSignInForm);
	}
	if (signUpTrigger) {
		signUpTrigger.addEventListener("click", openSignUpOverlay);
	}
	if (signUpOverlay) {
		signUpOverlay.addEventListener("click", (event) => {
			if (event.target === signUpOverlay) {
				closeSignUpOverlay();
			}
		});
	}

	if (DESIGN_CONNECTED_UI_ONLY) {
		const simulatedUser = buildSimulatedUser("designer@cinetrack.local");
		setCurrentUser(simulatedUser);
		renderConnectedState(simulatedUser);
		return;
	}

	const currentUser = getCurrentUser();
	if (currentUser) {
		renderConnectedState(currentUser);
	}
};

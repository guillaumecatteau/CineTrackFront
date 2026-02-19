/**
 * init.js - Initialisation de l'interface et gestion des formulaires d'authentification
 */

// ═══════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════
import AuthManager from './Manager/AuthManager.js';
import SearchManager from './Manager/SearchManager.js';
import TagManager from './Manager/TagManager.js';
import UserMovieManager from './Manager/UserMovieManager.js';
import { handleConnexion, updateHeaderButtons, initConnexion } from './connexion.js';

// ═══════════════════════════════════════════════════
// CONSTANTES ET ÉLÉMENTS DOM
// ═══════════════════════════════════════════════════
const titleInput = document.getElementById("title");
const yearInput = document.getElementById("year");
const typeSelect = document.getElementById("type");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results-container");
const resultsNav = document.getElementById("results-nav");
const authContainer = document.getElementById("auth-container");
const signInTrigger = document.getElementById("sign-in-trigger");
const signUpTrigger = document.getElementById("sign-up-trigger");

const initialAuthMarkup = authContainer ? authContainer.innerHTML : "";

// ═══════════════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════════════

/**
 * Mettre à jour l'état du bouton de recherche
 */
const updateSearchButtonState = () => {
	const hasTitle = titleInput.value.trim() !== "";
	const hasYear = yearInput.value.trim() !== "";
	const hasType = typeSelect.value !== "";

	searchButton.disabled = !(hasTitle || hasYear || hasType);
};

/**
 * Valider une adresse email
 */
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Valider un mot de passe fort
 */
const isStrongPassword = (value) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

/**
 * Attacher la validation en temps réel aux champs de formulaire
 */
const attachLiveValidation = (fields, submitButton) => {
	const touchedFields = new Set();

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

		submitButton.disabled = !allValid;
	};

	fields.forEach((field) => {
		field.input.addEventListener("input", () => {
			updateState();
		});

		field.input.addEventListener("blur", () => {
			touchedFields.add(field.input.id);
			updateState();
		});
	});

	updateState();
};

/**
 * Restaurer les boutons initiaux d'authentification
 */
const restoreInitialAuthButtons = () => {
	authContainer.innerHTML = initialAuthMarkup;
	const newSignInTrigger = document.getElementById("sign-in-trigger");
	const newSignUpTrigger = document.getElementById("sign-up-trigger");

	if (newSignInTrigger) {
		newSignInTrigger.addEventListener("click", renderSignInForm);
	}
	if (newSignUpTrigger) {
		newSignUpTrigger.addEventListener("click", renderSignUpForm);
	}
};

/**
 * Afficher le formulaire d'inscription
 */
export const renderSignUpForm = () => {
	authContainer.innerHTML = `
		<div class="auth-form">
			<div class="auth-fields">
				<div class="auth-field">
					<input type="text" id="signup-username" placeholder="USERNAME">
					<div class="field-error" id="signup-username-error"></div>
				</div>
				<div class="auth-field">
					<input type="email" id="signup-mail" placeholder="MAIL">
					<div class="field-error" id="signup-mail-error"></div>
				</div>
				<div class="auth-field">
					<input type="password" id="signup-password" placeholder="PASSWORD">
					<div class="field-error" id="signup-password-error"></div>
				</div>
			</div>
			<div class="auth-actions">
				<button type="button" class="btn btn-primary" id="signup-validate" disabled>Validate</button>
				<button type="button" class="btn btn-secondary" id="signup-back">Back</button>
			</div>
		</div>
	`;

	const usernameInput = document.getElementById("signup-username");
	const mailInput = document.getElementById("signup-mail");
	const passwordInput = document.getElementById("signup-password");
	const usernameError = document.getElementById("signup-username-error");
	const mailError = document.getElementById("signup-mail-error");
	const passwordError = document.getElementById("signup-password-error");
	const validateButton = document.getElementById("signup-validate");
	const backButton = document.getElementById("signup-back");

	if (!usernameInput || !mailInput || !passwordInput || !usernameError || !mailError || !passwordError || !validateButton || !backButton) {
		return;
	}

	attachLiveValidation(
		[
			{
				input: usernameInput,
				error: usernameError,
				validator: (value) => value.length >= 2,
				errorMessage: "Minimum 2 caractères"
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
				validator: (value) => isStrongPassword(value),
				errorMessage: "8+ caractères, 1 majuscule, 1 chiffre"
			}
		],
		validateButton
	);

	backButton.addEventListener("click", restoreInitialAuthButtons);
};

/**
 * Afficher le formulaire de connexion
 */
export const renderSignInForm = () => {
	authContainer.innerHTML = `
		<div class="auth-form">
			<div class="auth-fields">
				<div class="auth-field">
					<input type="email" id="signin-mail" placeholder="MAIL">
					<div class="field-error" id="signin-mail-error"></div>
				</div>
				<div class="auth-field">
					<input type="password" id="signin-password" placeholder="PASSWORD">
					<div class="field-error" id="signin-password-error"></div>
				</div>
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
	const connectButton = document.getElementById("signin-connect");
	const backButton = document.getElementById("signin-back");

	if (!mailInput || !passwordInput || !mailError || !passwordError || !connectButton || !backButton) {
		return;
	}

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
				validator: (value) => isStrongPassword(value),
				errorMessage: "8+ caractères, 1 majuscule, 1 chiffre"
			}
		],
		connectButton
	);

	// Ajouter l'événement de connexion
	connectButton.addEventListener("click", () => handleConnexion(renderSignInForm, renderSignUpForm));

	backButton.addEventListener("click", restoreInitialAuthButtons);
};

/**
 * Initialiser l'interface
 */
export function initInterface() {
	// Vérifier que les éléments nécessaires existent
	if (!titleInput || !yearInput || !typeSelect || !searchButton || !resultsContainer || !resultsNav) {
		return;
	}

	// Initialiser la recherche
	titleInput.addEventListener("input", updateSearchButtonState);
	yearInput.addEventListener("input", updateSearchButtonState);
	typeSelect.addEventListener("change", updateSearchButtonState);
	updateSearchButtonState();

	// Initialiser l'authentification
	if (!authContainer) {
		return;
	}

	if (signInTrigger) {
		signInTrigger.addEventListener("click", renderSignInForm);
	}

	if (signUpTrigger) {
		signUpTrigger.addEventListener("click", renderSignUpForm);
	}
}

// ═══════════════════════════════════════════════════
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
	// Initialiser l'interface (recherche et auth)
	initInterface();
	
	// Initialiser la connexion (vérifier si déjà connecté)
	initConnexion(renderSignInForm, renderSignUpForm);
});

// ═══════════════════════════════════════════════════
// EXPORTS GLOBAUX (pour tests/debugging)
// ═══════════════════════════════════════════════════
window.AuthManager = AuthManager;
window.SearchManager = SearchManager;
window.TagManager = TagManager;
window.UserMovieManager = UserMovieManager;

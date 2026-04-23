/**
 * connexion.js — Gestion de la connexion et de l'inscription utilisateur.
 *
 * Responsabilités :
 *  - Soumettre les formulaires de connexion / inscription à l'API
 *  - Mettre à jour le header (boutons auth ↔ bienvenue + déconnexion)
 *  - Émettre les événements cinetrack:login et cinetrack:logout
 */

import AuthManager from './Manager/AuthManager.js';

// Conteneur du header qui reçoit les boutons d'authentification
const authContainer = document.getElementById('auth-container');

/**
 * À appeler au chargement : si un utilisateur est déjà connecté (session
 * persistée dans localStorage), met immédiatement à jour le header.
 * @param {Function} renderSignInForm
 * @param {Function} renderSignUpForm
 */
export function initConnexion(renderSignInForm, renderSignUpForm) {
    if (AuthManager.isLoggedIn()) {
        updateHeaderButtons(renderSignInForm, renderSignUpForm);
    }
}

/**
 * Soumettre le formulaire d'inscription.
 * En cas de succès, redirige vers le formulaire de connexion.
 * En cas d'échec, affiche les erreurs champ par champ.
 * @param {Function} renderSignInForm
 * @param {Function} renderSignUpForm
 */
export async function handleRegistration(renderSignInForm, renderSignUpForm) {
    const usernameInput = document.getElementById('signup-username');
    const mailInput     = document.getElementById('signup-mail');
    const passwordInput = document.getElementById('signup-password');
    const usernameError = document.getElementById('signup-username-error');
    const mailError     = document.getElementById('signup-mail-error');
    const passwordError = document.getElementById('signup-password-error');
    const validateButton = document.getElementById('signup-validate');

    if (!usernameInput || !mailInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const email    = mailInput.value.trim();
    const password = passwordInput.value.trim();

    // Verrouiller le bouton pour éviter les doubles soumissions
    validateButton.disabled = true;
    validateButton.textContent = 'Inscription…';

    try {
        const response = await AuthManager.register(username, email, password);

        if (response.success) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            renderSignInForm();
        } else {
            // Afficher les erreurs champ par champ si disponibles, sinon message global
            if (response.errors) {
                if (response.errors.username && usernameError) usernameError.textContent = response.errors.username;
                if (response.errors.email    && mailError)     mailError.textContent     = response.errors.email;
                if (response.errors.password && passwordError) passwordError.textContent = response.errors.password;
            } else if (response.message && mailError) {
                mailError.textContent = response.message;
            }
            validateButton.disabled = false;
            validateButton.textContent = "S'inscrire";
        }
    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        if (mailError) mailError.textContent = 'Erreur de connexion au serveur';
        validateButton.disabled = false;
        validateButton.textContent = "S'inscrire";
    }
}

/**
 * Soumettre le formulaire de connexion.
 * En cas de succès : met à jour le header et émet cinetrack:login.
 * En cas d'échec : affiche les erreurs champ par champ.
 * @param {Function} renderSignInForm
 * @param {Function} renderSignUpForm
 */
export async function handleConnexion(renderSignInForm, renderSignUpForm) {
    const mailInput     = document.getElementById('signin-mail');
    const passwordInput = document.getElementById('signin-password');
    const mailError     = document.getElementById('signin-mail-error');
    const passwordError = document.getElementById('signin-password-error');
    const connectButton = document.getElementById('signin-connect');

    if (!mailInput || !passwordInput) return;

    const email    = mailInput.value.trim();
    const password = passwordInput.value.trim();

    // Verrouiller le bouton pour éviter les doubles soumissions
    connectButton.disabled = true;
    connectButton.textContent = 'Connexion…';

    try {
        const response = await AuthManager.login(email, password);

        if (response.success && response.user) {
            // Connexion réussie : mettre à jour le header puis notifier le reste de l'app
            updateHeaderButtons(renderSignInForm, renderSignUpForm);
            document.dispatchEvent(new CustomEvent('cinetrack:login'));
        } else {
            // Afficher les erreurs champ par champ si disponibles, sinon message global
            if (response.errors) {
                if (response.errors.email    && mailError)     mailError.textContent     = response.errors.email;
                if (response.errors.password && passwordError) passwordError.textContent = response.errors.password;
            } else if (response.message && mailError) {
                mailError.textContent = response.message;
            }
            connectButton.disabled = false;
            connectButton.textContent = 'Se connecter';
        }
    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        if (mailError) mailError.textContent = 'Erreur de connexion au serveur';
        connectButton.disabled = false;
        connectButton.textContent = 'Se connecter';
    }
}

/**
 * Mettre à jour les boutons du header selon l'état de connexion.
 *
 * - Connecté  → affiche "Bienvenue, <username>" + bouton déconnexion (icône LogOut)
 * - Déconnecté → affiche boutons "S'inscrire" et "Se connecter" (icône LogIn)
 *
 * @param {Function} renderSignInForm
 * @param {Function} renderSignUpForm
 */
export function updateHeaderButtons(renderSignInForm, renderSignUpForm) {
    if (!authContainer) return;

    if (AuthManager.isLoggedIn()) {
        const username = localStorage.getItem('username') || 'Utilisateur';
        
        authContainer.innerHTML = `
            <div class="user-info">
                <span class="username">Bienvenue, <strong>${username}</strong></span>
                <button type="button" class="btn-auth-icon" id="logout-button" aria-label="Déconnexion" title="Déconnexion">
                    <svg class="auth-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M19 23H11C10.4477 23 10 22.5523 10 22C10 21.4477 10.4477 21 11 21H19C19.5523 21 20 20.5523 20 20V4C20 3.44772 19.5523 3 19 3L11 3C10.4477 3 10 2.55229 10 2C10 1.44772 10.4477 1 11 1L19 1C20.6569 1 22 2.34315 22 4V20C22 21.6569 20.6569 23 19 23Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2.48861 13.3099C1.83712 12.5581 1.83712 11.4419 2.48862 10.6902L6.66532 5.87088C7.87786 4.47179 10.1767 5.3293 10.1767 7.18074L10.1767 9.00001H16.1767C17.2813 9.00001 18.1767 9.89544 18.1767 11V13C18.1767 14.1046 17.2813 15 16.1767 15L10.1767 15V16.8193C10.1767 18.6707 7.87786 19.5282 6.66532 18.1291L2.48861 13.3099ZM4.5676 11.3451C4.24185 11.7209 4.24185 12.2791 4.5676 12.6549L8.1767 16.8193V14.5C8.1767 13.6716 8.84827 13 9.6767 13L16.1767 13V11L9.6767 11C8.84827 11 8.1767 10.3284 8.1767 9.50001L8.1767 7.18074L4.5676 11.3451Z" fill="currentColor"/></svg>
                </button>
            </div>
        `;

        // Ajouter l'événement de déconnexion
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => handleLogout(renderSignInForm, renderSignUpForm));
        }
    } else {
        // Restaurer les boutons S'inscrire / Se connecter
        authContainer.innerHTML = `
            <button type="button" class="btn btn-primary" id="sign-up-trigger">S'inscrire</button>
            <button type="button" class="btn-auth-icon" id="sign-in-trigger" aria-label="Se connecter" title="Se connecter">
                <svg class="auth-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M20 23L12 23C11.4477 23 11 22.5523 11 22C11 21.4477 11.4477 21 12 21L20 21C20.5523 21 21 20.5523 21 20L21 4C21 3.44771 20.5523 3 20 3L12 3C11.4477 3 11 2.55228 11 2C11 1.44772 11.4477 1 12 1L20 0.999999C21.6569 0.999999 23 2.34315 23 4L23 20C23 21.6569 21.6569 23 20 23Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18.6881 10.6901C19.3396 11.4418 19.3396 12.5581 18.6881 13.3098L14.5114 18.1291C13.2988 19.5282 11 18.6707 11 16.8193L11 15L5 15C3.89543 15 3 14.1046 3 13L3 11C3 9.89541 3.89543 8.99998 5 8.99998L11 8.99998L11 7.18071C11 5.3293 13.2988 4.47176 14.5114 5.87085L18.6881 10.6901ZM16.6091 12.6549C16.9348 12.279 16.9348 11.7209 16.6091 11.345L13 7.18071L13 9.49998C13 10.3284 12.3284 11 11.5 11L5 11L5 13L11.5 13C12.3284 13 13 13.6716 13 14.5L13 16.8193L16.6091 12.6549Z" fill="currentColor"/></svg>
            </button>
        `;

        // Réattacher les événements
        const signInTrigger = document.getElementById('sign-in-trigger');
        const signUpTrigger = document.getElementById('sign-up-trigger');

        if (signInTrigger && typeof renderSignInForm === 'function') {
            signInTrigger.addEventListener('click', renderSignInForm);
        }

        if (signUpTrigger && typeof renderSignUpForm === 'function') {
            signUpTrigger.addEventListener('click', renderSignUpForm);
        }
    }
}

/**
 * Déconnecter l'utilisateur.
 * Supprime la session localStorage, remet les boutons du header,
 * et émet cinetrack:logout pour que l'app masque les sections connecté.
 * @param {Function} renderSignInForm
 * @param {Function} renderSignUpForm
 */
function handleLogout(renderSignInForm, renderSignUpForm) {
    AuthManager.logout();
    updateHeaderButtons(renderSignInForm, renderSignUpForm);
    document.dispatchEvent(new CustomEvent('cinetrack:logout'));
}

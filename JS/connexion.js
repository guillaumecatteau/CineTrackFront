/**
 * connexion.js - Gestion de la connexion utilisateur
 */

// ═══════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════
import AuthManager from './Manager/AuthManager.js';

// ═══════════════════════════════════════════════════
// CONSTANTES ET ÉLÉMENTS DOM
// ═══════════════════════════════════════════════════
const authContainer = document.getElementById('auth-container');

// ═══════════════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════════════

/**
 * Initialiser les événements de connexion
 * @param {Function} renderSignInForm - Fonction pour afficher le formulaire de connexion
 * @param {Function} renderSignUpForm - Fonction pour afficher le formulaire d'inscription
 */
export function initConnexion(renderSignInForm, renderSignUpForm) {
    // Vérifier si un utilisateur est déjà connecté au chargement
    if (AuthManager.isLoggedIn()) {
        updateHeaderButtons(renderSignInForm, renderSignUpForm);
    }
}

/**
 * Gérer la connexion de l'utilisateur
 * @param {Function} renderSignInForm - Fonction pour afficher le formulaire de connexion
 * @param {Function} renderSignUpForm - Fonction pour afficher le formulaire d'inscription
 */
export async function handleConnexion(renderSignInForm, renderSignUpForm) {
    const mailInput = document.getElementById('signin-mail');
    const passwordInput = document.getElementById('signin-password');
    const mailError = document.getElementById('signin-mail-error');
    const passwordError = document.getElementById('signin-password-error');
    const connectButton = document.getElementById('signin-connect');

    if (!mailInput || !passwordInput) {
        console.error("Champs de connexion introuvables");
        return;
    }

    const email = mailInput.value.trim();
    const password = passwordInput.value.trim();

    // Désactiver le bouton pendant la requête
    connectButton.disabled = true;
    connectButton.textContent = "Connexion...";

    try {
        const response = await AuthManager.login(email, password);

        if (response.success && response.user) {
            console.log("Connexion réussie pour:", response.user.username);
            // Mettre à jour l'interface
            updateHeaderButtons(renderSignInForm, renderSignUpForm);
        } else {
            // Afficher les erreurs
            if (response.errors) {
                if (response.errors.email && mailError) {
                    mailError.textContent = response.errors.email;
                }
                if (response.errors.password && passwordError) {
                    passwordError.textContent = response.errors.password;
                }
            } else if (response.message) {
                // Afficher le message d'erreur général dans le champ email
                if (mailError) {
                    mailError.textContent = response.message;
                }
            }
            
            // Réactiver le bouton
            connectButton.disabled = false;
            connectButton.textContent = "Connexion";
        }
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        if (mailError) {
            mailError.textContent = "Erreur de connexion au serveur";
        }
        
        // Réactiver le bouton
        connectButton.disabled = false;
        connectButton.textContent = "Connexion";
    }
}

/**
 * Mettre à jour les boutons du header selon l'état de connexion
 * @param {Function} renderSignInForm - Fonction pour afficher le formulaire de connexion
 * @param {Function} renderSignUpForm - Fonction pour afficher le formulaire d'inscription
 */
export function updateHeaderButtons(renderSignInForm, renderSignUpForm) {
    if (!authContainer) return;

    if (AuthManager.isLoggedIn()) {
        const username = localStorage.getItem('username') || 'Utilisateur';
        
        authContainer.innerHTML = `
            <div class="user-info">
                <span class="username">Bienvenue, ${username}</span>
                <button type="button" class="btn btn-secondary" id="logout-button">Logout</button>
            </div>
        `;

        // Ajouter l'événement de déconnexion
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => handleLogout(renderSignInForm, renderSignUpForm));
        }
    } else {
        // Restaurer les boutons Sign In / Sign Up
        authContainer.innerHTML = `
            <button type="button" class="btn btn-primary" id="sign-up-trigger">Sign Up</button>
            <button type="button" class="btn btn-secondary" id="sign-in-trigger">Sign In</button>
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
 * Gérer la déconnexion de l'utilisateur
 * @param {Function} renderSignInForm - Fonction pour afficher le formulaire de connexion
 * @param {Function} renderSignUpForm - Fonction pour afficher le formulaire d'inscription
 */
function handleLogout(renderSignInForm, renderSignUpForm) {
    AuthManager.logout();
    console.log("Utilisateur déconnecté");
    updateHeaderButtons(renderSignInForm, renderSignUpForm);
}

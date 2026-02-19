/**
 * main.js - Point d'entrée principal de l'application
 */

// ═══════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════
import AuthManager from './Manager/AuthManager.js';
import SearchManager from './Manager/SearchManager.js';
import TagManager from './Manager/TagManager.js';
import UserMovieManager from './Manager/UserMovieManager.js';
import { initConnexion, updateHeaderButtons } from './connexion.js';
import { initInterface, renderSignInForm, renderSignUpForm } from './init.js';

// ═══════════════════════════════════════════════════
// INITIALISATION
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

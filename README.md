# CineTrackFront — Documentation

Interface web de CineTrack. SPA (Single Page Application) en HTML/CSS/JS vanilla, sans framework.  
Back-end : `../CineTrackBack/` (PHP + MySQL). Aucune dépendance NPM côté front.

---

## Structure des fichiers

```
CineTrackFront/
├── index.html              ← Page unique, contient aussi le template popup (#selection-template)
├── style.css               ← Tous les styles (tokens CSS, composants, animations)
├── backEditionNote.md      ← Corrections à appliquer côté CineTrackBack
├── README.md               ← Ce fichier
│
├── images/                 ← Icônes SVG (icon_Like, icon_Dislike, icon_LogIn, icon_LogOut…)
│
├── JS/
│   ├── init.js             ← Point d'entrée principal (trending, recherche, auth forms, événements)
│   ├── connexion.js        ← Inscription / connexion / déconnexion + mise à jour du header
│   ├── popup.js            ← Overlay détail d'un film (états, boutons d'action, notation)
│   ├── collection.js       ← Strip de collection utilisateur (chargement, filtre, fade mask)
│   ├── customSelect.js     ← Remplacement accessible des <select> natifs
│   │
│   └── Manager/            ← Couche réseau — un Manager par ressource API
│       ├── AuthManager.js
│       ├── SearchManager.js
│       ├── TagManager.js
│       └── UserMovieManager.js
│
└── template/               ← Fichiers HTML auxiliaires (non utilisés en production)
    ├── cover.html
    └── selection.html
```

---

## Architecture générale

```
index.html  ──imports──▶  init.js
                              │
                    ┌─────────┼──────────────┐
                    ▼         ▼              ▼
              connexion.js  popup.js   collection.js
                    │         │              │
                    └────┬────┴──────────────┘
                         ▼
                      Manager/
               (AuthManager, SearchManager,
                TagManager, UserMovieManager)
                         │
                         ▼
                  CineTrackBack/Api/
               (auth.php, search.php,
                tags.php, user-movies.php)
```

Tout appel réseau passe obligatoirement par un Manager. Les composants de la couche UI (`init.js`, `popup.js`, `collection.js`) n'utilisent jamais `fetch` directement.

---

## Modules JS

### `init.js` — Point d'entrée

Chargé via `<script type="module">` dans `index.html`.

| Responsabilité | Détails |
|---|---|
| Redirection Live Server | Si port 5500 détecté, redirige vers Apache (port 80) pour que les appels PHP fonctionnent |
| Trending au démarrage | Appelle `_executeSearch('', '', '', 1)` → `getTrending` |
| Recherche & pagination | `_executeSearch(title, year, type, page)` — voir routing ci-dessous |
| Cartes de résultats | `createMovieCard(movie)` — avec animation stagger `--card-i` |
| Tags sur cartes | `loadMovieTags`, `handleLikeToggle`, `handleDislikeToggle` |
| Formulaires auth | `renderSignInForm()` / `renderSignUpForm()` — injectés dans `#signup-overlay` |
| Événements globaux | `cinetrack:login`, `cinetrack:logout`, `cinetrack:collection-changed` |

**Routing de `_executeSearch`**

```
titre non vide + type=tv  →  SearchManager.searchTV()
titre non vide            →  SearchManager.search()       (+ filtre année si fourni)
année seule               →  SearchManager.discover()     ← catalogue complet TMDb
aucun critère             →  SearchManager.getTrending()
```

---

### `connexion.js` — Authentification

| Export | Rôle |
|---|---|
| `initConnexion(…)` | Appelée au démarrage — restaure le header si session existante |
| `handleConnexion(…)` | Soumet le formulaire de connexion, émet `cinetrack:login` |
| `handleRegistration(…)` | Soumet le formulaire d'inscription |
| `updateHeaderButtons(…)` | Bascule le header entre état connecté / déconnecté |

`handleLogout` est interne (non exportée) — appelée depuis le bouton déconnexion injecté par `updateHeaderButtons`.

---

### `popup.js` — Overlay détail

S'ouvre sur clic d'une carte. Clone le `<template id="selection-template">` défini dans `index.html`.

**État module-level** : `_overlay`, `_userMovieId`, `_ctx` (userId, tmdbId, mediaType), `_escapeHandler`.

| Fonction | Rôle |
|---|---|
| `showMovieDetails(id, type)` | Ouvre l'overlay, récupère les détails TMDb, affiche les sections |
| `closeMovieDetails()` | Ferme et nettoie l'overlay + handlers |
| `_loadWatchState()` | Lit la collection de l'utilisateur et active les bons boutons |
| `_loadTagState()` | Lit les tags (like/dislike) et active les bons boutons |
| `_wireButtons()` | Câble les 4 boutons d'action (Vu, À voir, Like, Dislike) |
| `_resolveUserMovieId()` | Récupère l'ID interne du film en base (lazy, mis en cache) |
| `_saveRating(n)` | Sauvegarde la note étoile via `UserMovieManager.updateMovie` |

**Sections du popup gérées par `hidden`** :
- `[data-selection="user-actions"]` — masqué si non connecté
- `[data-selection="rate-wrap"]` — masqué si non connecté
- `[data-selection="connect-text"]` — affiché si non connecté

---

### `collection.js` — Strip de collection

Bande horizontale scrollable entre le header et le formulaire de recherche.  
Visible uniquement si connecté (`showCollection()` / `hideCollection()`).

| Export | Rôle |
|---|---|
| `initCollection()` | Câble toggle, filtre, scroll → fade mask |
| `loadCollection(filter)` | Charge et affiche les films du filtre actif |
| `showCollection()` | Enlève l'attribut `hidden` |
| `hideCollection()` | Ajoute l'attribut `hidden` |

**Filtres disponibles** : `towatch`, `watched`, `liked`, `disliked`

**Normalisation des données** : `UserMovieDTO` renvoie `tmdbId`/`mediaType` (camelCase), `MovieTagService` renvoie `tmdb_id`/`media_type` (snake_case). `loadCollection` normalise les deux formes.

**Fade mask** : classes `has-overflow-left` / `has-overflow-right` sur le strip, pilotant des pseudo-éléments CSS dégradés.

---

### `customSelect.js` — Dropdowns custom

Remplace les `<select>` marqués `data-custom-select="<border-radius>"` par une liste `<ul>` stylée.  
Le `<select>` natif reste dans le DOM (caché) : tous les `.value` et `addEventListener('change')` existants continuent de fonctionner.

**Synchronisation** : après un changement programmatique de `.value`, dispatchter `new Event('cselect:sync')` sur le `<select>` pour mettre à jour l'affichage visuel.

---

### `Manager/` — Couche réseau

Chaque Manager est une classe avec uniquement des méthodes statiques.

**Pattern commun** : une méthode `_post(payload, fallback?)` gère tout le boilerplate `fetch` / `JSON.stringify` / try-catch. Les méthodes publiques l'appellent avec juste le payload.

```javascript
// Exemple : SearchManager.search
static async search(title, page = 1, year = null, language = 'fr-EU') {
    return this._post({ action: 'search', title, page, year, language });
}
```

| Manager | API PHP | Actions principales |
|---|---|---|
| `AuthManager` | `auth.php` | register, login, getUser, updateProfile, logout |
| `SearchManager` | `search.php` | getTrending, search, searchTV, **discover**, getMovieDetails, getTVShowDetails |
| `TagManager` | `tags.php` | toggleTmdbLike, toggleTmdbDislike, getTagsByTmdbId, getMoviesByTag |
| `UserMovieManager` | `user-movies.php` | addMovie, getAllMovies, getWatchedMovies, getWatchlist, updateMovie, deleteMovie |

**`SearchManager.discover`** : utilise l'endpoint `/discover` de TMDb (vs `/search` ou `/trending`), ce qui parcourt le catalogue complet avec filtre année côté serveur.

---

## Système de tokens CSS

Variables définies dans `:root` de `style.css` :

```css
--lightBlue:  #206B96   /* couleur principale (textes, bordures, accents) */
--mediumBlue: #032236   /* fond des panneaux / cartes */
--darkBlue:   #01111B   /* fond global de la page */
```

---

## Événements CustomEvent

Bus d'événements sur `document` pour la communication inter-modules :

| Événement | Émis par | Écouté par |
|---|---|---|
| `cinetrack:login` | `connexion.js` | `init.js` (affiche collection, ajoute `body.user-logged-in`) |
| `cinetrack:logout` | `connexion.js` | `init.js` (masque collection, retire `body.user-logged-in`) |
| `cinetrack:collection-changed` | `popup.js` | `init.js` (recharge la collection, change le filtre actif) |

---

## Comportement selon l'état d'authentification

| Fonctionnalité | Non connecté | Connecté |
|---|---|---|
| Voir les résultats | ✅ | ✅ |
| Ouvrir le popup détail | ✅ | ✅ |
| Boutons Vu / À voir / Note | ❌ (masqués) | ✅ |
| Boutons Like / Dislike (cartes) | ❌ (masqués via CSS) | ✅ |
| Strip de collection | ❌ (masquée) | ✅ |

La visibilité des boutons like/dislike sur les cartes est pilotée par la classe CSS `body.user-logged-in` :
```css
.movie-actions { display: none; }
body.user-logged-in .movie-actions { display: flex; }
```

---

## Versionning des assets

`style.css` et `JS/init.js` sont chargés avec un paramètre `?v=XX` dans `index.html` pour invalider le cache navigateur à chaque modification :

```html
<link rel="stylesheet" href="style.css?v=32" />
<script type="module" src="JS/init.js?v=32"></script>
```

> Incrémenter la version à chaque déploiement de modification.

---

## Notes importantes

- **`[hidden]` CSS** : `[hidden] { display: none !important; }` est défini en tête de `style.css`. Sans cette règle, les éléments avec `hidden` ayant aussi un `display: flex` en CSS resteraient visibles.
- **`template/`** : les fichiers dans ce dossier sont des maquettes HTML non utilisées. Le vrai template popup est dans `index.html` (`#selection-template`).
- **Back-end** : toute correction ou ajout côté `CineTrackBack/` doit être documenté dans `backEditionNote.md`.

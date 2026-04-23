# Back-end Edition Notes

Fichier à appliquer côté `CineTrackBack/`. Chaque section décrit un problème et sa correction exacte.

---

## [BUG-001] TMDb Bearer Token introuvable → aucun résultat trending/search

### Symptôme
Tous les appels TMDb échouent avec `success: false`.  
`search.php` → `getTrending` / `search` / `searchTV` / `getMovieDetails` / `getTVShowDetails` retournent tous une erreur.

### Diagnostic
Deux problèmes combinés dans `CineTrackBack/` :

**Problème 1 — Mauvaise clé .env**  
`Src/Services/TMDbService.php` ligne 31 lit `TMDB_API_KEY` :
```php
$this->bearerToken = $bearerToken ?? Config::get('TMDB_API_KEY') ?? '';
```
Mais le fichier `.env` définit la clé `TMDB_BEARER_TOKEN`, pas `TMDB_API_KEY`.

**Problème 2 — Token multi-lignes dans le .env**  
Le `.env` actuel contient des valeurs coupées sur plusieurs lignes (le token JWT est wrappé à ~80 chars). `Config::loadEnvFile()` lit ligne par ligne avec `explode('=', $line, 2)`, donc seule la première ligne est capturée, tronquant le token.

### Correction à appliquer

#### Étape 1 — Corriger la clé lue dans TMDbService.php

Fichier : `CineTrackBack/Src/Services/TMDbService.php`

Remplacer (ligne ~31) :
```php
$this->bearerToken = $bearerToken ?? Config::get('TMDB_API_KEY') ?? '';
```
Par :
```php
$this->bearerToken = $bearerToken ?? Config::get('TMDB_BEARER_TOKEN') ?? '';
```

#### Étape 2 — Corriger le .env pour que le token soit sur une seule ligne

Fichier : `CineTrackBack/.env`

Remplacer le contenu actuel par la version ci-dessous (token sur une seule ligne continue, sans retour à la ligne dans la valeur) :

```
# TMDb credentials and endpoints
OMDB_API_KEY=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmOTQwZDk1NGFjN2E4MzA1NDc5Y2JjZWVhMTA1ZjU1MSIsIm5iZiI6MTc3MzY4NDYwNy43NTksInN1YiI6IjY5Yjg0NzdmZDBlYjRhOWRmMDVjYTVjOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ._Zd5rvHMmVrBxRSKaIRIbGwrFEoPwrsVsmjfa9_2Om0
TMDB_BEARER_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmOTQwZDk1NGFjN2E4MzA1NDc5Y2JjZWVhMTA1ZjU1MSIsIm5iZiI6MTc3MzY4NDYwNy43NTksInN1YiI6IjY5Yjg0NzdmZDBlYjRhOWRmMDVjYTVjOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ._Zd5rvHMmVrBxRSKaIRIbGwrFEoPwrsVsmjfa9_2Om0
TMDB_TRENDING_URL=https://api.themoviedb.org/3/trending/all/day?language=en-US
```

> ⚠️ Chaque valeur doit être sur **une seule ligne** sans retour à la ligne dans la valeur elle-même.

### Test de validation
Après correction, appeler :
```bash
curl -X POST http://localhost/CineTrack/CineTrackBack/Api/search.php \
  -H "Content-Type: application/json" \
  -d '{"action":"getTrending","mediaType":"all","timeWindow":"day","language":"fr-EU","page":1}'
```
La réponse doit contenir `"success":true` et un tableau `"results"` non vide.

---

## [FEAT-001] Recherche par année via /discover — ajouté en v32

### Contexte
Avant cette version, rechercher uniquement par année appelait `getTrending` puis filtrait les résultats côté client. Cela limitait les résultats aux 20 films les plus tendance, ignorant l'intégralité du catalogue TMDb.

### Solution implémentée

Nouvelle méthode `discoverByYear()` dans `CineTrackBack/Src/Services/TMDbService.php` et nouvelle action `discover` dans `CineTrackBack/Api/search.php`.

#### TMDbService.php — méthode ajoutée

```php
public function discoverByYear(
    string $year,
    string $mediaType = 'movie',
    string $language  = 'fr-EU',
    int    $page      = 1
): array
```

- `mediaType = 'movie'` → appelle `/discover/movie?primary_release_year=XXXX`
- `mediaType = 'tv'`    → appelle `/discover/tv?first_air_date_year=XXXX`
- `mediaType = 'all'`   → appelle les deux, fusionne, trie par popularité, **tranche à 20 résultats** (standard TMDb)
- `total_pages` = maximum des deux endpoints
- `sort_by = popularity.desc` dans les deux cas

#### search.php — case ajouté

```php
case 'discover':
    // year requis, mediaType/language/page optionnels
    $response = $tmdbService->discoverByYear($year, $mediaType, $language, $page);
    break;
```

### Côté front-end (CineTrackFront — v32)

- `SearchManager.js` : méthode statique `discover(year, mediaType, page, language)` ajoutée
- `init.js` : `_executeSearch` — branche `else if (year)` appelle `SearchManager.discover()` au lieu de `getTrending` + filtre client

### Test de validation
```bash
curl -X POST http://localhost/CineTrack/CineTrackBack/Api/search.php \
  -H "Content-Type: application/json" \
  -d '{"action":"discover","year":"2026","mediaType":"all","language":"fr-EU","page":1}'
```
La réponse doit contenir `"success":true`, exactement 20 résultats dans `"results"`, et `"total_pages" > 1` si l'année est bien renseignée dans TMDb.

---

## [BUG-002] Badge catégorie absent sur les résultats search (titre) — corrigé en v32

### Symptôme
Les cartes issues d'une recherche par titre (actions `search` et `searchTV`) n'affichaient pas le badge "Film" / "TV", alors que les cartes trending l'affichaient.

### Diagnostic
TMDb ne retourne pas le champ `media_type` dans les résultats de `/search/movie` ni `/search/tv`. Seul l'endpoint `/trending` le fournit nativement. Les méthodes `searchMovies()` et `searchTVShows()` renvoyaient les résultats bruts sans injecter ce champ.

### Correction appliquée

Fichier : `CineTrackBack/Src/Services/TMDbService.php`

**Dans `searchMovies()`**, remplacer :
```php
return [
    'success' => true,
    'results' => $data['results'] ?? [],
    ...
];
```
Par :
```php
$results = $data['results'] ?? [];
foreach ($results as &$item) {
    $item['media_type'] = 'movie';
}
unset($item);

return [
    'success' => true,
    'results' => $results,
    ...
];
```

**Dans `searchTVShows()`**, même correction avec `$item['media_type'] = 'tv'`.

---

## [BUG-003] Badge catégorie absent sur les résultats discover (année) — corrigé en v32

### Symptôme
Les cartes issues d'une recherche par année uniquement n'affichaient pas le badge "Film" / "TV", même après l'ajout de `discoverByYear()`.

### Diagnostic
Bug PHP de référence variable. Le code suivant ne fonctionne **pas** :

```php
foreach ($data['results'] ?? [] as &$item) {
    $item['media_type'] = 'movie';
}
unset($item);
$allResults = array_merge($allResults, $data['results'] ?? []); // ← récupère le tableau ORIGINAL
```

L'opérateur `??` sur `$data['results'] ?? []` crée une **valeur temporaire** sur laquelle itérer par référence n'a pas d'effet persistant dans `$data['results']`. Le `array_merge` suivant relit `$data['results'] ?? []` et obtient donc les éléments sans `media_type`.

### Correction appliquée

Fichier : `CineTrackBack/Src/Services/TMDbService.php`, méthode `discoverByYear()`

Extraire d'abord le tableau dans une variable nommée, modifier par référence, puis fusionner cette variable :

```php
// Bloc movie
$movieResults = $data['results'] ?? [];
foreach ($movieResults as &$item) {
    $item['media_type'] = 'movie';
}
unset($item);
$allResults = array_merge($allResults, $movieResults);

// Bloc tv
$tvResults = $data['results'] ?? [];
foreach ($tvResults as &$item) {
    $item['media_type'] = 'tv';
}
unset($item);
$allResults = array_merge($allResults, $tvResults);
```

### Test de validation
La réponse de l'action `discover` doit avoir `"media_type": "movie"` ou `"media_type": "tv"` sur chaque élément de `"results"` :
```bash
curl -X POST http://localhost/CineTrack/CineTrackBack/Api/search.php \
  -H "Content-Type: application/json" \
  -d '{"action":"discover","year":"2026","mediaType":"all","language":"fr-EU","page":1}'
```

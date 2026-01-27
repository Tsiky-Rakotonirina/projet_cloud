# Serveur de Tuiles Offline - Antananarivo

Serveur de tuiles cartographiques pour usage **offline** basé sur OpenStreetMap.

## 🚀 Démarrage rapide

### Avec Docker Compose (recommandé)

```bash
# Depuis le dossier racine du projet
docker-compose up -d tileserver
```

Le serveur sera accessible sur `http://localhost:3001`

### Manuellement

```bash
cd tiles
npm install
npm start
```

## 📍 Endpoints disponibles

| Endpoint | Description |
|----------|-------------|
| `GET /` | Page de démonstration avec carte Leaflet |
| `GET /tiles/{z}/{x}/{y}.png` | Tuiles OSM (avec cache automatique) |
| `GET /config` | Configuration JSON pour Leaflet |
| `GET /stats` | Statistiques du cache |
| `GET /health` | Health check |

## 🗺️ Utilisation avec Leaflet

### JavaScript

```javascript
// Récupérer la configuration
const configResponse = await fetch('http://localhost:3001/config');
const config = await configResponse.json();

// Initialiser la carte
const map = L.map('map').setView(config.center, config.defaultZoom);

// Ajouter le layer de tuiles locales
L.tileLayer('http://localhost:3001/tiles/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: config.attribution
}).addTo(map);
```

### React/Vue/Angular

```javascript
const TILE_SERVER_URL = 'http://localhost:3001';

// URL des tuiles pour Leaflet
const tileUrl = `${TILE_SERVER_URL}/tiles/{z}/{x}/{y}.png`;

// Centre sur Antananarivo
const center = [-18.8792, 47.5079];
```

## 📥 Pré-télécharger les tuiles pour usage 100% offline

Pour fonctionner sans connexion internet, téléchargez les tuiles à l'avance:

```bash
# Télécharger les tuiles zoom 10-16 (Antananarivo)
docker exec tileserver node download-tiles.js 10 16

# Ou manuellement
cd tiles
npm run download
```

### Estimation de la taille

| Zoom | Tuiles | Taille approx. |
|------|--------|----------------|
| 10-14 | ~500 | ~10 MB |
| 10-16 | ~8000 | ~150 MB |
| 10-18 | ~130000 | ~2.5 GB |

## 🔧 Configuration

Variables d'environnement:

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | 8080 | Port du serveur |
| `CACHE_DIR` | ./cache | Dossier de cache |
| `DEFAULT_CENTER_LAT` | -18.8792 | Latitude centre |
| `DEFAULT_CENTER_LON` | 47.5079 | Longitude centre |
| `DEFAULT_ZOOM` | 12 | Zoom par défaut |

## 🏗️ Architecture

```
tiles/
├── Dockerfile          # Image Docker
├── server.js           # Serveur Express
├── download-tiles.js   # Script pré-téléchargement
├── package.json        # Dépendances
└── cache/              # Cache des tuiles (créé automatiquement)
    └── {z}/{x}/{y}.png
```

## 💡 Comment ça marche

1. **Première requête**: Le serveur télécharge la tuile depuis OSM et la sauvegarde en cache
2. **Requêtes suivantes**: La tuile est servie depuis le cache local
3. **Mode offline**: Si les tuiles sont pré-téléchargées, aucune connexion n'est nécessaire

## 🔍 Zone couverte

- **Centre**: Antananarivo (-18.8792, 47.5079)
- **Bounding Box**: 
  - Min: -19.10, 47.40
  - Max: -18.70, 47.70
- **Inclut**: Antananarivo ville, Ivato, Talatamaty, Ambohidratrimo, etc.

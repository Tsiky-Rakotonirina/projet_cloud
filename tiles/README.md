# TileServer Data

Ce dossier contient les données cartographiques pour TileServer GL.

## Structure

- `config.json` - Configuration du serveur TileServer
- `*.mbtiles` - Fichiers de tuiles cartographiques (MBTiles format)

## Installation des données

### Antananarivo (Madagascar)

**Option 1 - OpenMapTiles Madagascar complet (~150MB)**
```bash
wget https://files.openmaptiles.org/releases/madagascar-latest.mbtiles
mv madagascar-latest.mbtiles antananarivo.mbtiles
```

**Option 2 - Geofabrik Madagascar (~80MB)**
1. Télécharger: `https://download.geofabrik.de/africa/madagascar-latest.osm.pbf`
2. Convertir en MBTiles avec tilemaker:
```bash
docker run --rm -v $(pwd):/data jamesandariese/tilemaker \
  tilemaker \
  --input /data/madagascar-latest.osm.pbf \
  --output /data/antananarivo.mbtiles \
  --process /resources/process-openmaptiles.lua \
  --config /resources/config-openmaptiles.json
```

**Option 3 - Juste Antananarivo (5-10MB)**
1. Télécharger Madagascar: `https://download.geofabrik.de/africa/madagascar-latest.osm.pbf`
2. Extraire avec osmium:
```bash
osmium extract -b 47.4,18.7,47.6,19.0 madagascar-latest.osm.pbf -o antananarivo.osm.pbf
```
3. Convertir: (voir Option 2)

## Utilisation

Une fois le fichier `.mbtiles` placé ici:
```bash
docker-compose up tileserver
```

Accès: http://localhost:3001

## Pour voir les cartes

- Tuiles raster: `http://localhost:3001/data/antananarivo/{z}/{x}/{y}.png`
- API TileJSON: `http://localhost:3001/data/antananarivo.json`
- Interface web: `http://localhost:3001/` (voir les styles)

## Intégration Leaflet (Front-end)

```javascript
// Raster tiles
L.tileLayer('http://localhost:3001/data/antananarivo/{z}/{x}/{y}.png', {
  attribution: '© OpenMapTiles © OpenStreetMap',
  maxZoom: 16,
  minZoom: 0
}).addTo(map);

// Vector tiles (avec MapLibre GL)
L.maplibreGL({
  style: 'http://localhost:3001/styles/osm-bright/style.json',
  attribution: '© OpenMapTiles © OpenStreetMap'
}).addTo(map);
```

## Conseils Performance

- **Offline complet**: Télécharger juste Antananarivo (~10-20MB)
- **Qualité**: Préférer OpenMapTiles pour vector tiles
- **Cache**: Service Worker pour stocker localement

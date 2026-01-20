const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const CACHE_DIR = process.env.CACHE_DIR || './cache';

// Configuration Antananarivo
const CONFIG = {
  centerLat: parseFloat(process.env.DEFAULT_CENTER_LAT) || -18.8792,
  centerLon: parseFloat(process.env.DEFAULT_CENTER_LON) || 47.5079,
  defaultZoom: parseInt(process.env.DEFAULT_ZOOM) || 12
};

// Sources de tuiles OSM
const TILE_SOURCES = [
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
];

// Middleware CORS permissif
app.use(cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// Créer le dossier de cache
fs.ensureDirSync(CACHE_DIR);

// Stats
let stats = { cacheHits: 0, downloads: 0, errors: 0 };

// Chemin cache
function getCachePath(z, x, y) {
  return path.join(CACHE_DIR, z.toString(), x.toString(), `${y}.png`);
}

// Télécharger une tuile
async function downloadTile(z, x, y) {
  const sourceIndex = Math.floor(Math.random() * TILE_SOURCES.length);
  const url = TILE_SOURCES[sourceIndex]
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y);

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    headers: {
      'User-Agent': 'TileServer-Antananarivo/1.0'
    }
  });
  return response.data;
}

// Route principale des tuiles
app.get('/tiles/:z/:x/:y.png', async (req, res) => {
  const { z, x, y } = req.params;
  const cachePath = getCachePath(z, x, y);

  try {
    // Cache hit
    if (await fs.pathExists(cachePath)) {
      stats.cacheHits++;
      const tile = await fs.readFile(cachePath);
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(tile);
    }

    // Télécharger et mettre en cache
    const tileData = await downloadTile(z, x, y);
    stats.downloads++;

    await fs.ensureDir(path.dirname(cachePath));
    await fs.writeFile(cachePath, tileData);

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(tileData);

  } catch (error) {
    stats.errors++;
    console.error(`Erreur tuile ${z}/${x}/${y}:`, error.message);
    res.status(404).send('Tile not found');
  }
});

// Config pour clients
app.get('/config', (req, res) => {
  res.json({
    tileUrl: '/tiles/{z}/{x}/{y}.png',
    center: [CONFIG.centerLat, CONFIG.centerLon],
    defaultZoom: CONFIG.defaultZoom,
    attribution: '© OpenStreetMap contributors'
  });
});

// Stats
app.get('/stats', (req, res) => {
  res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Page démo
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Tile Server - Antananarivo</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #map { height: 100vh; width: 100%; }
        .info { position: absolute; top: 10px; left: 50px; z-index: 1000; 
                background: white; padding: 10px 20px; border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    </style>
</head>
<body>
    <div class="info">
        <strong>🗺️ Serveur de Tuiles Offline - Antananarivo</strong><br>
        <small>Cache: <span id="hits">0</span> hits | <span id="dl">0</span> downloads</small>
    </div>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map').setView([${CONFIG.centerLat}, ${CONFIG.centerLon}], ${CONFIG.defaultZoom});
        L.tileLayer('/tiles/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
        
        L.marker([${CONFIG.centerLat}, ${CONFIG.centerLon}])
            .addTo(map)
            .bindPopup('<b>Antananarivo</b>').openPopup();

        setInterval(async () => {
            const r = await fetch('/stats');
            const s = await r.json();
            document.getElementById('hits').textContent = s.cacheHits;
            document.getElementById('dl').textContent = s.downloads;
        }, 3000);
    </script>
</body>
</html>
  `);
});

// Démarrer
app.listen(PORT, '0.0.0.0', () => {
  console.log('🗺️  Tile Server Antananarivo démarré sur port ' + PORT);
  console.log('   → Tuiles: http://localhost:' + PORT + '/tiles/{z}/{x}/{y}.png');
  console.log('   → Démo:   http://localhost:' + PORT + '/');
});

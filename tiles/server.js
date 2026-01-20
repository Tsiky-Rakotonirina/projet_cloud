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
  defaultZoom: parseInt(process.env.DEFAULT_ZOOM) || 12,
  // Bounding box pour Antananarivo et environs
  bounds: {
    minLat: -19.10,
    maxLat: -18.70,
    minLon: 47.40,
    maxLon: 47.70
  }
};

// Sources de tuiles OSM (fallback en cascade)
const TILE_SOURCES = [
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
];

// Middleware
app.use(cors());

// Créer le dossier de cache
fs.ensureDirSync(CACHE_DIR);

// Statistiques
let stats = {
  cacheHits: 0,
  cacheMisses: 0,
  downloads: 0,
  errors: 0
};

// Fonction pour obtenir le chemin du cache
function getCachePath(z, x, y) {
  return path.join(CACHE_DIR, z.toString(), x.toString(), `${y}.png`);
}

// Fonction pour télécharger une tuile
async function downloadTile(z, x, y) {
  const sourceIndex = Math.floor(Math.random() * TILE_SOURCES.length);
  const url = TILE_SOURCES[sourceIndex]
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'OfflineTileServer/1.0 (Antananarivo Map Project)'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Échec téléchargement tuile ${z}/${x}/${y}: ${error.message}`);
  }
}

// Endpoint principal pour les tuiles
app.get('/tiles/:z/:x/:y.png', async (req, res) => {
  const { z, x, y } = req.params;
  const cachePath = getCachePath(z, x, y);

  try {
    // Vérifier le cache
    if (await fs.pathExists(cachePath)) {
      stats.cacheHits++;
      const tile = await fs.readFile(cachePath);
      res.set('Content-Type', 'image/png');
      res.set('X-Cache', 'HIT');
      res.set('X-Tile-Source', 'local-cache');
      return res.send(tile);
    }

    stats.cacheMisses++;

    // Télécharger la tuile
    const tileData = await downloadTile(z, x, y);
    stats.downloads++;

    // Sauvegarder dans le cache
    await fs.ensureDir(path.dirname(cachePath));
    await fs.writeFile(cachePath, tileData);

    res.set('Content-Type', 'image/png');
    res.set('X-Cache', 'MISS');
    res.set('X-Tile-Source', 'downloaded');
    res.send(tileData);

  } catch (error) {
    stats.errors++;
    console.error(`Erreur tuile ${z}/${x}/${y}:`, error.message);
    
    // Retourner une tuile vide/transparente en cas d'erreur
    res.set('Content-Type', 'image/png');
    res.status(404).send(createEmptyTile());
  }
});

// Endpoint alternatif (format Leaflet standard)
app.get('/:z/:x/:y.png', async (req, res) => {
  const { z, x, y } = req.params;
  req.params = { z, x, y };
  return app._router.handle(
    { ...req, url: `/tiles/${z}/${x}/${y}.png`, params: { z, x, y } },
    res,
    () => {}
  );
});

// Configuration pour Leaflet
app.get('/config', (req, res) => {
  res.json({
    tileUrl: '/tiles/{z}/{x}/{y}.png',
    center: [CONFIG.centerLat, CONFIG.centerLon],
    defaultZoom: CONFIG.defaultZoom,
    bounds: [
      [CONFIG.bounds.minLat, CONFIG.bounds.minLon],
      [CONFIG.bounds.maxLat, CONFIG.bounds.maxLon]
    ],
    attribution: '© OpenStreetMap contributors | Serveur Offline Antananarivo'
  });
});

// Statistiques du serveur
app.get('/stats', (req, res) => {
  res.json({
    ...stats,
    cacheRatio: stats.cacheHits / (stats.cacheHits + stats.cacheMisses) || 0,
    config: CONFIG
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Page d'accueil avec démo Leaflet
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Serveur de Tuiles Offline - Antananarivo</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #map { height: 80vh; width: 100%; }
        .info-panel {
            padding: 20px;
            background: #f5f5f5;
        }
        .info-panel h1 { margin: 0 0 10px 0; color: #333; }
        .info-panel p { margin: 5px 0; color: #666; }
        .stats { display: flex; gap: 20px; margin-top: 10px; }
        .stat { background: white; padding: 10px 20px; border-radius: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="info-panel">
        <h1>🗺️ Serveur de Tuiles Offline - Antananarivo</h1>
        <p>Ce serveur sert les tuiles OpenStreetMap avec cache local pour usage offline.</p>
        <div class="stats">
            <div class="stat">
                <div>Cache Hits</div>
                <div class="stat-value" id="cacheHits">-</div>
            </div>
            <div class="stat">
                <div>Downloads</div>
                <div class="stat-value" id="downloads">-</div>
            </div>
            <div class="stat">
                <div>Cache Ratio</div>
                <div class="stat-value" id="cacheRatio">-</div>
            </div>
        </div>
    </div>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialiser la carte centrée sur Antananarivo
        const map = L.map('map').setView([${CONFIG.centerLat}, ${CONFIG.centerLon}], ${CONFIG.defaultZoom});
        
        // Utiliser notre serveur de tuiles local
        L.tileLayer('/tiles/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors | Serveur Offline Antananarivo'
        }).addTo(map);
        
        // Ajouter un marqueur sur Antananarivo
        L.marker([${CONFIG.centerLat}, ${CONFIG.centerLon}])
            .addTo(map)
            .bindPopup('<b>Antananarivo</b><br>Capitale de Madagascar')
            .openPopup();

        // Rectangle pour montrer les limites
        L.rectangle([
            [${CONFIG.bounds.minLat}, ${CONFIG.bounds.minLon}],
            [${CONFIG.bounds.maxLat}, ${CONFIG.bounds.maxLon}]
        ], {
            color: "#007bff",
            weight: 2,
            fill: false
        }).addTo(map);

        // Mettre à jour les stats
        async function updateStats() {
            try {
                const response = await fetch('/stats');
                const data = await response.json();
                document.getElementById('cacheHits').textContent = data.cacheHits;
                document.getElementById('downloads').textContent = data.downloads;
                document.getElementById('cacheRatio').textContent = 
                    (data.cacheRatio * 100).toFixed(1) + '%';
            } catch (e) {
                console.error('Erreur stats:', e);
            }
        }
        
        updateStats();
        setInterval(updateStats, 5000);
    </script>
</body>
</html>
  `);
});

// Créer une tuile PNG vide/transparente
function createEmptyTile() {
  // PNG 256x256 transparent minimal
  const emptyPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x01, 0x03, 0x00, 0x00, 0x00, 0x66, 0xbc, 0x3a, 0x25, 0x00, 0x00, 0x00,
    0x03, 0x50, 0x4c, 0x54, 0x45, 0xff, 0xff, 0xff, 0xa7, 0xc4, 0x1b, 0xc8,
    0x00, 0x00, 0x00, 0x01, 0x74, 0x52, 0x4e, 0x53, 0x00, 0x40, 0xe6, 0xd8,
    0x66, 0x00, 0x00, 0x00, 0x1f, 0x49, 0x44, 0x41, 0x54, 0x68, 0xde, 0xed,
    0xc1, 0x01, 0x0d, 0x00, 0x00, 0x00, 0xc2, 0xa0, 0xf7, 0x4f, 0x6d, 0x0e,
    0x37, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xbe, 0x0d,
    0x21, 0x00, 0x00, 0x01, 0x9a, 0x60, 0xe1, 0xd5, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  return emptyPng;
}

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🗺️  ==========================================');
  console.log('    SERVEUR DE TUILES OFFLINE - ANTANANARIVO');
  console.log('   ==========================================');
  console.log('');
  console.log(`   📍 Centre: ${CONFIG.centerLat}, ${CONFIG.centerLon}`);
  console.log(`   🔍 Zoom par défaut: ${CONFIG.defaultZoom}`);
  console.log(`   📁 Cache: ${CACHE_DIR}`);
  console.log('');
  console.log(`   🌐 Serveur démarré sur http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('   Endpoints disponibles:');
  console.log(`   - GET /tiles/{z}/{x}/{y}.png  → Tuiles OSM`);
  console.log(`   - GET /config                 → Configuration Leaflet`);
  console.log(`   - GET /stats                  → Statistiques`);
  console.log(`   - GET /health                 → Health check`);
  console.log(`   - GET /                       → Démo avec carte`);
  console.log('');
});

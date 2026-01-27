/**
 * Script pour pré-télécharger les tuiles d'Antananarivo pour usage offline
 * Usage: node download-tiles.js [minZoom] [maxZoom]
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Configuration Antananarivo
const CONFIG = {
  // Bounding box pour Antananarivo et environs
  bounds: {
    minLat: -19.05,
    maxLat: -18.75,
    minLon: 47.45,
    maxLon: 47.60
  },
  minZoom: parseInt(process.argv[2]) || 10,
  maxZoom: parseInt(process.argv[3]) || 16,
  cacheDir: process.env.CACHE_DIR || './cache'
};

const TILE_SOURCES = [
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
];

// Convertir lat/lon en coordonnées de tuile
function latLonToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

// Obtenir toutes les tuiles pour une bounding box et un niveau de zoom
function getTilesForBounds(bounds, zoom) {
  const tiles = [];
  const minTile = latLonToTile(bounds.maxLat, bounds.minLon, zoom);
  const maxTile = latLonToTile(bounds.minLat, bounds.maxLon, zoom);

  for (let x = minTile.x; x <= maxTile.x; x++) {
    for (let y = minTile.y; y <= maxTile.y; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }
  return tiles;
}

// Télécharger une tuile avec retry
async function downloadTile(z, x, y, retries = 3) {
  const cachePath = path.join(CONFIG.cacheDir, z.toString(), x.toString(), `${y}.png`);

  // Vérifier si déjà en cache
  if (await fs.pathExists(cachePath)) {
    return { status: 'cached', path: cachePath };
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const sourceIndex = attempt % TILE_SOURCES.length;
      const url = TILE_SOURCES[sourceIndex]
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'OfflineTileDownloader/1.0 (Antananarivo Map Project)'
        }
      });

      await fs.ensureDir(path.dirname(cachePath));
      await fs.writeFile(cachePath, response.data);
      
      return { status: 'downloaded', path: cachePath };
    } catch (error) {
      if (attempt === retries - 1) {
        return { status: 'error', error: error.message };
      }
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

// Fonction principale
async function main() {
  console.log('');
  console.log('🗺️  ==============================================');
  console.log('    TÉLÉCHARGEMENT TUILES ANTANANARIVO (OFFLINE)');
  console.log('   ==============================================');
  console.log('');
  console.log(`   📍 Zone: ${CONFIG.bounds.minLat}, ${CONFIG.bounds.minLon} → ${CONFIG.bounds.maxLat}, ${CONFIG.bounds.maxLon}`);
  console.log(`   🔍 Zoom: ${CONFIG.minZoom} → ${CONFIG.maxZoom}`);
  console.log(`   📁 Cache: ${CONFIG.cacheDir}`);
  console.log('');

  // Calculer le nombre total de tuiles
  let totalTiles = 0;
  const tilesByZoom = {};
  
  for (let z = CONFIG.minZoom; z <= CONFIG.maxZoom; z++) {
    const tiles = getTilesForBounds(CONFIG.bounds, z);
    tilesByZoom[z] = tiles;
    totalTiles += tiles.length;
    console.log(`   Zoom ${z}: ${tiles.length} tuiles`);
  }
  
  console.log('');
  console.log(`   Total: ${totalTiles} tuiles à télécharger`);
  console.log('');
  
  // Confirmer le téléchargement
  console.log('   ⏳ Démarrage du téléchargement...');
  console.log('');

  let downloaded = 0;
  let cached = 0;
  let errors = 0;

  // Télécharger par niveau de zoom
  for (let z = CONFIG.minZoom; z <= CONFIG.maxZoom; z++) {
    const tiles = tilesByZoom[z];
    console.log(`   📥 Zoom ${z} (${tiles.length} tuiles)...`);
    
    // Télécharger en parallèle par lots de 5
    const batchSize = 5;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(tile => downloadTile(tile.z, tile.x, tile.y))
      );
      
      results.forEach(result => {
        if (result.status === 'downloaded') downloaded++;
        else if (result.status === 'cached') cached++;
        else errors++;
      });

      // Afficher la progression
      const progress = Math.round((i + batch.length) / tiles.length * 100);
      process.stdout.write(`\r      Progression: ${progress}% (${i + batch.length}/${tiles.length})`);
      
      // Pause pour ne pas surcharger le serveur
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(' ✅');
  }

  console.log('');
  console.log('   ==========================================');
  console.log('   📊 RÉSUMÉ');
  console.log('   ==========================================');
  console.log(`   ✅ Téléchargées: ${downloaded}`);
  console.log(`   📦 Déjà en cache: ${cached}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  console.log('');
  
  // Calculer la taille du cache
  const cacheSize = await getFolderSize(CONFIG.cacheDir);
  console.log(`   💾 Taille du cache: ${formatBytes(cacheSize)}`);
  console.log('');
}

// Calculer la taille d'un dossier
async function getFolderSize(folderPath) {
  let size = 0;
  try {
    const files = await fs.readdir(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        size += await getFolderSize(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch (e) {
    // Dossier n'existe pas encore
  }
  return size;
}

// Formater les bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Exécuter
main().catch(console.error);

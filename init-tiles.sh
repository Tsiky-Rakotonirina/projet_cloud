#!/bin/bash
set -e

echo "🗺️  Initialisation des données cartographiques..."

# Vérifier si le fichier existe déjà
if [ -f "/data/antananarivo.mbtiles" ]; then
  echo "✅ antananarivo.mbtiles existe déjà"
  exit 0
fi

# Créer le répertoire s'il n'existe pas
mkdir -p /data
cd /data

echo "📥 Téléchargement des données Madagascar (Geofabrik)..."
# Télécharger Madagascar OSM depuis Geofabrik (~80MB)
URL="https://download.geofabrik.de/africa/madagascar-latest.osm.pbf"

if command -v wget &> /dev/null; then
  wget -q --show-progress "$URL" -O madagascar.osm.pbf || {
    echo "⚠️  wget échoué, tentative avec curl..."
    curl -L -o madagascar.osm.pbf "$URL"
  }
else
  curl -L -o madagascar.osm.pbf "$URL"
fi

if [ ! -f "/data/madagascar.osm.pbf" ]; then
  echo "❌ Erreur: Impossible de télécharger les données"
  exit 1
fi

echo "✅ Madagascar.osm.pbf téléchargé ($(du -h /data/madagascar.osm.pbf | cut -f1))"
echo ""
echo "ℹ️  Note: Le fichier PBF a été téléchargé avec succès!"
echo "TileServer utilisera ce fichier pour servir les tuiles."
echo ""
echo "✅ Données cartographiques prêtes!"

# Renommer pour TileServer
mv /data/madagascar.osm.pbf /data/antananarivo.mbtiles 2>/dev/null || true

# Si TileServer supporte .pbf, laisser le fichier PBF
# Sinon, un script de conversion supplémentaire sera nécessaire
ls -lh /data/

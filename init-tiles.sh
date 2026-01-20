#!/bin/sh
set -e

DATA_DIR="/data"
MBTILES_FILE="$DATA_DIR/antananarivo.mbtiles"
PBF_FILE="$DATA_DIR/antananarivo.osm.pbf"
MADAGASCAR_PBF="$DATA_DIR/madagascar-latest.osm.pbf"

# Bounding box Antananarivo et environs
# Format: minlon,minlat,maxlon,maxlat
BBOX="47.40,-19.10,47.70,-18.70"

echo "🗺️  Configuration serveur de tuiles Antananarivo (OFFLINE)"
echo "=============================================="

# Créer les dossiers nécessaires
mkdir -p "$DATA_DIR/fonts" "$DATA_DIR/styles"

# Copier le style
if [ -f "/data/basic-style.json" ]; then
    cp /data/basic-style.json "$DATA_DIR/styles/basic-style.json"
    echo "✅ Style copié"
fi

# Vérifier si MBTiles existe déjà
if [ -f "$MBTILES_FILE" ]; then
    echo "✅ Fichier MBTiles existant trouvé: $MBTILES_FILE"
    echo "ℹ️  Supprimez ce fichier pour régénérer les tuiles"
    ls -lh "$MBTILES_FILE"
    exit 0
fi

echo "📥 Téléchargement des données OSM pour Antananarivo..."

# Télécharger l'extrait Madagascar si nécessaire
if [ ! -f "$MADAGASCAR_PBF" ] && [ ! -f "$PBF_FILE" ]; then
    echo "📥 Téléchargement de Madagascar depuis Geofabrik (~100MB)..."
    apk add --no-cache wget curl
    
    wget -q --show-progress -O "$MADAGASCAR_PBF" \
        "https://download.geofabrik.de/africa/madagascar-latest.osm.pbf" || {
        echo "❌ Erreur téléchargement. Vérifiez votre connexion internet."
        exit 1
    }
    echo "✅ Téléchargement terminé"
fi

# Installer les outils nécessaires
echo "📦 Installation des outils de conversion..."
apk add --no-cache osmium-tool

# Extraire la zone d'Antananarivo
if [ ! -f "$PBF_FILE" ]; then
    echo "✂️ Extraction de la zone d'Antananarivo..."
    osmium extract -b "$BBOX" "$MADAGASCAR_PBF" -o "$PBF_FILE" --overwrite
    echo "✅ Extraction terminée"
    ls -lh "$PBF_FILE"
fi

echo ""
echo "⚠️  IMPORTANT: Génération MBTiles requise"
echo "==========================================="
echo "Le fichier PBF est prêt: $PBF_FILE"
echo ""
echo "Pour générer les tuiles MBTiles, exécutez:"
echo "  docker run -v \$(pwd)/tiles:/data openmaptiles/openmaptiles-tools"
echo ""
echo "Ou téléchargez un MBTiles pré-généré depuis:"
echo "  https://data.maptiler.com/downloads/tileset/osm/"
echo ""

# Créer une configuration de remplacement pour utiliser des tuiles raster en attendant
echo "🔄 Configuration du mode raster (fallback)..."

exit 0

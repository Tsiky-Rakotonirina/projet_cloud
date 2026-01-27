#!/bin/bash
# Script pour télécharger les tuiles d'Antananarivo pour usage offline

set -e

DATA_DIR="/data"
MBTILES_FILE="$DATA_DIR/antananarivo.mbtiles"

echo "🗺️  Préparation des données cartographiques d'Antananarivo..."

# Vérifier si le fichier mbtiles existe déjà
if [ -f "$MBTILES_FILE" ]; then
    echo "✅ Fichier MBTiles déjà présent: $MBTILES_FILE"
    exit 0
fi

# Coordonnées d'Antananarivo (bounding box élargie pour inclure les environs)
# Antananarivo: lat ~-18.87 à -18.95, lon ~47.48 à 47.56
BBOX="47.40,-19.10,47.70,-18.70"

echo "📥 Téléchargement des données OSM pour Antananarivo..."
echo "   Zone: $BBOX"

# Option 1: Télécharger depuis Geofabrik (Madagascar extract)
if [ ! -f "$DATA_DIR/madagascar-latest.osm.pbf" ] && [ ! -f "$DATA_DIR/antananarivo.osm.pbf" ]; then
    echo "📥 Téléchargement de l'extrait Madagascar depuis Geofabrik..."
    wget -O "$DATA_DIR/madagascar-latest.osm.pbf" \
        "https://download.geofabrik.de/africa/madagascar-latest.osm.pbf" || {
        echo "⚠️ Échec du téléchargement Geofabrik, tentative alternative..."
    }
fi

# Extraire uniquement Antananarivo si osmium est disponible
if command -v osmium &> /dev/null && [ -f "$DATA_DIR/madagascar-latest.osm.pbf" ]; then
    echo "✂️ Extraction de la zone d'Antananarivo..."
    osmium extract -b "$BBOX" "$DATA_DIR/madagascar-latest.osm.pbf" -o "$DATA_DIR/antananarivo.osm.pbf" --overwrite
fi

echo "✅ Données préparées"

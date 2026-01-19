# Carte Interactive d'Antananarivo

Cette application utilise Leaflet pour afficher une carte interactive de la ville d'Antananarivo, Madagascar.

## Fonctionnalités

### Composant MapView

Le composant `MapView.vue` fournit :

- **Carte centrée sur Antananarivo** : Coordonnées [-18.8792, 47.5079]
- **Marqueurs de points d'intérêt** :
  - Palais de la Reine (Rova)
  - Avenue de l'Indépendance
  - Lac Anosy
  - Tsimbazaza Zoo
- **Tuiles OpenStreetMap** pour une visualisation détaillée

### Méthodes Exposées

Le composant MapView expose les méthodes suivantes pour manipuler la carte :

```typescript
// Centrer la carte sur une position avec animation
flyTo(lat: number, lng: number, zoom: number = 15)

// Ajouter un nouveau marqueur
addMarker(lat: number, lng: number, popupText: string)

// Obtenir l'instance de la carte Leaflet
getMap()
```

### Utilisation

```vue
<template>
  <MapView ref="mapRef" />
  <button @click="addCustomMarker">Ajouter un marqueur</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MapView from '@/components/MapView.vue';

const mapRef = ref<InstanceType<typeof MapView> | null>(null);

const addCustomMarker = () => {
  if (mapRef.value) {
    mapRef.value.addMarker(
      -18.9100, 
      47.5250, 
      'Mon point personnalisé'
    );
  }
};
</script>
```

## Routes

- `/home` : Page d'accueil avec accès à la carte
- `/map` : Affichage de la carte interactive

## Installation

Les dépendances Leaflet ont déjà été installées :

```bash
npm install leaflet @types/leaflet
```

## Personnalisation

### Ajouter de nouveaux points d'intérêt

Modifiez le tableau `poiData` dans `MapView.vue` :

```typescript
const poiData = [
  { name: 'Nouveau POI', coords: [-18.xxxx, 47.xxxx] as [number, number] },
];
```

### Changer le style de carte

Modifiez l'URL du layer de tuiles :

```typescript
// Exemple avec un style différent
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
  maxZoom: 17,
}).addTo(map);
```

## Ressources

- [Documentation Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Ionic Framework](https://ionicframework.com/)

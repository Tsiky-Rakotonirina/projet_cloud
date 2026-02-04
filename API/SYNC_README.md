# Synchronisation Optimisée - Documentation

## Vue d'ensemble

Le système de synchronisation a été amélioré avec les fonctionnalités suivantes :

1. **Suivi en temps réel** des synchronisations en cours
2. **Liste détaillée des utilisateurs** synchronisés avec leur statut
3. **Gestion des sessions** de synchronisation
4. **Historique** des synchronisations passées
5. **Protection contre les synchronisations simultanées**

## Nouvelles Tables SQL

Exécuter le script suivant pour créer les tables de suivi :

```bash
psql -U votre_user -d votre_db -f database/sync_tables.sql
```

## Nouveaux Endpoints API

### Routes de Synchronisation Avancée (`/api/sync-session/`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/sync-session/users/push` | PUSH utilisateurs avec tracking |
| POST | `/api/sync-session/users/pull` | PULL utilisateurs avec tracking |
| POST | `/api/sync-session/all` | Sync complète avec tracking |
| GET | `/api/sync-session/active` | Sessions en cours |
| GET | `/api/sync-session/global-status` | Statut global |
| GET | `/api/sync-session/history` | Historique des sessions |
| GET | `/api/sync-session/:sessionId` | Détails d'une session |
| GET | `/api/sync-session/:sessionId/users` | Liste des utilisateurs synchronisés |
| POST | `/api/sync-session/:sessionId/cancel` | Annuler une session |
| POST | `/api/sync-session/cleanup` | Nettoyer anciennes sessions |

### Routes Existantes Améliorées

Les routes existantes (`/api/sync/`) supportent maintenant le paramètre `track=true` :

```bash
# Avec tracking
POST /api/sync/users/push?track=true

# Sans tracking (comportement original)
POST /api/sync/users/push
```

## Exemples d'Utilisation

### 1. Lancer une synchronisation avec suivi

```javascript
// POST /api/sync-session/users/push
{
  "initiatedBy": "admin@example.com"
}

// Réponse
{
  "success": true,
  "message": "Synchronisation PUSH utilisateurs terminée avec suivi",
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "stats": {
      "total": 150,
      "inserted": 10,
      "updated": 140,
      "errors": []
    }
  }
}
```

### 2. Consulter le statut d'une session en cours

```javascript
// GET /api/sync-session/:sessionId
{
  "success": true,
  "data": {
    "session": {
      "id": "a1b2c3d4-...",
      "status": "in_progress",
      "progressPercentage": 65.5,
      "totalItems": 150,
      "processedItems": 98,
      "insertedCount": 5,
      "updatedCount": 90,
      "errorCount": 3,
      "currentStep": "Synchronisation de user@example.com..."
    },
    "statsByStatus": {
      "success": 95,
      "failed": 3,
      "pending": 52
    },
    "recentItems": [...]
  }
}
```

### 3. Liste des utilisateurs synchronisés

```javascript
// GET /api/sync-session/:sessionId/users?page=1&limit=50&status=success
{
  "success": true,
  "data": {
    "total": 150,
    "page": 1,
    "totalPages": 3,
    "users": [
      {
        "email": "user1@example.com",
        "action": "insert",
        "status": "success",
        "sourceId": "firebase_abc123",
        "targetId": "42",
        "syncedAt": "2026-02-02T10:30:00Z"
      },
      {
        "email": "user2@example.com",
        "action": "update",
        "status": "success",
        "sourceId": "firebase_def456",
        "targetId": "43",
        "syncedAt": "2026-02-02T10:30:01Z"
      }
    ]
  }
}
```

### 4. Voir les sessions actives

```javascript
// GET /api/sync-session/active
{
  "success": true,
  "data": {
    "count": 1,
    "sessions": [
      {
        "id": "a1b2c3d4-...",
        "type": "push",
        "entityType": "utilisateurs",
        "status": "in_progress",
        "progress": 65.5,
        "currentStep": "Synchronisation de user@example.com...",
        "processed": 98,
        "total": 150,
        "startedAt": "2026-02-02T10:25:00Z"
      }
    ]
  }
}
```

### 5. Statut global de synchronisation

```javascript
// GET /api/sync-session/global-status
{
  "success": true,
  "data": {
    "isRunning": true,
    "activeSessions": [...],
    "lastSuccessful": {
      "utilisateurs": {
        "completedAt": "2026-02-02T09:00:00Z",
        "inserted": 5,
        "updated": 145,
        "errors": 0
      },
      "signalements": {...}
    },
    "last24hStats": {
      "completed": 12,
      "failed": 1,
      "cancelled": 0
    }
  }
}
```

### 6. Historique des synchronisations

```javascript
// GET /api/sync-session/history?page=1&limit=20&status=completed
{
  "success": true,
  "data": {
    "total": 156,
    "sessions": [
      {
        "id": "...",
        "type": "push",
        "entityType": "utilisateurs",
        "status": "completed",
        "startedAt": "2026-02-02T09:00:00Z",
        "completedAt": "2026-02-02T09:02:30Z",
        "duration": 150,  // secondes
        "totalItems": 150,
        "inserted": 5,
        "updated": 145,
        "errors": 0,
        "skipped": 0
      }
    ]
  }
}
```

## Statuts de Synchronisation

### Statuts de Session
| Statut | Description |
|--------|-------------|
| `pending` | Session créée, pas encore démarrée |
| `in_progress` | Synchronisation en cours |
| `completed` | Terminée avec succès |
| `failed` | Échec (voir error_message) |
| `cancelled` | Annulée par l'utilisateur |

### Statuts d'Items (utilisateurs)
| Statut | Description |
|--------|-------------|
| `pending` | En attente de traitement |
| `processing` | En cours de synchronisation |
| `success` | Synchronisé avec succès |
| `failed` | Échec de synchronisation |
| `skipped` | Ignoré (déjà à jour ou non applicable) |

### Actions
| Action | Description |
|--------|-------------|
| `insert` | Nouvel enregistrement créé |
| `update` | Enregistrement mis à jour |
| `skip` | Aucune modification nécessaire |
| `error` | Erreur lors du traitement |

## Protection contre les Synchronisations Simultanées

Le système empêche automatiquement de lancer plusieurs synchronisations du même type en parallèle :

```javascript
// Si une sync est déjà en cours
{
  "success": false,
  "error": {
    "message": "Une synchronisation est déjà en cours pour utilisateurs",
    "code": "SYNC_IN_PROGRESS",
    "activeSessionId": "a1b2c3d4-..."
  }
}
```

## Nettoyage Automatique

Pour nettoyer les anciennes sessions (> 30 jours) :

```javascript
// POST /api/sync-session/cleanup
{
  "daysToKeep": 30
}

// Réponse
{
  "success": true,
  "data": {
    "deletedCount": 45
  }
}
```

## Migration depuis l'Ancien Système

L'ancien système (`/api/sync/`) reste entièrement fonctionnel. Vous pouvez :

1. **Continuer à utiliser** les anciennes routes sans changement
2. **Activer le tracking** sur les anciennes routes avec `?track=true`
3. **Migrer progressivement** vers les nouvelles routes `/api/sync-session/`

## Architecture

```
API/src/
├── models/
│   ├── sync_session.model.js      # Modèle des sessions
│   └── sync_item_detail.model.js  # Modèle des détails par item
├── services/
│   ├── sync.service.js            # Service principal (modifié)
│   └── sync-session.service.js    # Nouveau service de gestion sessions
├── controllers/
│   ├── sync.controller.js         # Contrôleur existant (amélioré)
│   └── sync-session.controller.js # Nouveau contrôleur
└── routes/
    ├── sync.routes.js             # Routes existantes
    └── sync-session.routes.js     # Nouvelles routes
```

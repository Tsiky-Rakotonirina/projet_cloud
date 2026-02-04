# 🌍 Projet Cloud S5 : Système de Gestion des Routes

Application full-stack pour la gestion et la surveillance des routes avec synchronisation PostgreSQL ↔️ Firebase.

## 📁 Architecture

```
projet_cloud/
├── API/                 # Backend Node.js + Express
├── web/                 # Frontend Web (React/Vue)
├── mobile/              # Application Mobile (Ionic + Vue)
├── database/            # Scripts SQL
├── tiles/               # Serveur de tuiles cartographiques
└── docker-compose.yml   # Orchestration des services
```

## 🚀 Démarrage Rapide

### 1. Lancer les services Docker

```bash
docker compose up -d
```

### 2. Services disponibles

| Service | URL | Description |
|---------|-----|-------------|
| **API** | http://localhost:3000 | Backend REST API |
| **Web** | http://localhost:5173 | Interface Web Manager |
| **Mobile** | http://localhost:5001 | Application Mobile |
| **TileServer** | http://localhost:3001 | Serveur de tuiles OSM |
| **PostgreSQL** | localhost:5433 | Base de données PostGIS |

### 3. Accès Manager Web

- **URL** : http://localhost:5173/manager/login
- **Email** : admin@route.mg
- **Mot de passe** : admin123

## 🔄 Synchronisation PostgreSQL ↔️ Firebase

### Tables Synchronisées

✅ **9 tables** sont automatiquement synchronisées dans les deux directions :

| PostgreSQL | Firestore | Enregistrements |
|-----------|-----------|----------------|
| `villes` | `villes` | 6 |
| `profils` | `profils` | 4 |
| `statuts` | `statuts_utilisateur` | 4 |
| `utilisateurs` | `users` | 9 |
| `entreprises` | `entreprises` | 8 |
| `signalement_statuts` | `signalement_statuts` | 8 |
| `signalements` | `signalements` | 13 |
| `probleme_statuts` | `probleme_statuts` | 10 |
| `problemes` | `problemes` | 12 |

**Total : 74 enregistrements synchronisés**

### Utilisation

#### Synchronisation complète
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/all" -Method POST
```

#### Vérifier le statut
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/status" -Method GET
```

📖 **Documentation complète** : [SYNCHRONIZATION_STATUS.md](SYNCHRONIZATION_STATUS.md)

## 🛠️ Configuration

### Variables d'environnement (API/.env)

```env
# Base de données
DB_HOST=db
DB_PORT=5432
DB_NAME=route
DB_USER=admin
DB_PASSWORD=admin

# JWT
JWT_SECRET=9fA7QvL3xEw2JmRk8PZcN4sH0B6TYaUdF5o1iKGSWbC
JWT_EXPIRES_IN=24h

# Sécurité
MAX_LOGIN_ATTEMPTS=3
LOGIN_LOCK_DURATION=120000
```

### Firebase Configuration

Le fichier `API/src/config/firebase-admin-sdk.json` contient les credentials Firebase.

**Projet Firebase** : `tp-firebase-b195d`

## Base de Données

### Connexion PostgreSQL

```bash
docker exec -it bdd psql -U admin -d route
```

### Structure principale

```sql
-- Villes
villes (id_villes, nom, xy)

-- Utilisateurs
utilisateurs (id_utilisateurs, email, mot_de_passe, date_naissance, profil_id)
profils (id_profils, libelle, descri)
statuts (id_statuts, libelle)

-- Signalements
signalements (id_signalements, description, utilisateur_id, point_id)
signalement_statuts (id_signalement_statuts, libelle)

-- Problèmes
problemes (id_problemes, surface, budget, entreprise_id, signalement_id)
probleme_statuts (id_probleme_statuts, libelle)
entreprises (id_entreprises, nom, adresse, telephone)

-- Synchronisation
firebase_mapping (id, entity_type, postgres_id, firebase_id, created_at, updated_at)
```

## 🧪 Scripts de Test

### Diagnostic Firebase

```bash
# Compter tous les documents
docker compose exec API node /app/scripts/firebase_count_all.js

# Voir des échantillons
docker compose exec API node /app/scripts/firebase_show_samples.js

# Tester la connexion
docker compose exec API node /app/scripts/firebase_test.js
```

### Requêtes PostgreSQL

```bash
# Compter les utilisateurs
docker exec -i bdd psql -U admin -d route -c "SELECT COUNT(*) FROM utilisateurs;"

# Voir les mappings
docker exec -i bdd psql -U admin -d route -c "SELECT entity_type, COUNT(*) FROM firebase_mapping GROUP BY entity_type;"
```

## 📱 Application Mobile

L'application mobile Ionic est configurée pour se connecter à l'API :

```bash
cd mobile
npm install
npm run dev  # Serveur de développement sur port 5001
```

## 🗺️ Tuiles Cartographiques

Le serveur de tuiles utilise des données OSM pré-téléchargées.

**Initialisation** :
```bash
docker compose up tiles-init  # Télécharge les tuiles Madagascar
```

## 🔐 Sécurité

- **Passwords** : Hashés avec bcrypt (10 rounds)
- **JWT** : Tokens expirables (24h par défaut)
- **Login** : Max 3 tentatives, blocage 2 minutes
- **CORS** : Configuré pour localhost uniquement

## 📚 Documentation Complémentaire

- [SYNCHRONIZATION_STATUS.md](SYNCHRONIZATION_STATUS.md) - État détaillé de la sync
- [SYNC_TESTING_GUIDE.md](SYNC_TESTING_GUIDE.md) - Guide de test de la synchronisation
- [FIRESTORE_README.md](FIRESTORE_README.md) - Configuration Firestore
- [API/README.md](API/README.md) - Documentation de l'API

## 🐛 Dépannage

### Logs Docker

```bash
# Tous les logs
docker compose logs

# Logs API uniquement
docker compose logs API --tail=100

# Suivre en temps réel
docker compose logs -f API
```

### Redémarrer un service

```bash
docker compose restart API
docker compose restart db
```

### Reset complet

```bash
# Arrêter et supprimer les volumes
docker compose down -v

# Recréer
docker compose up -d
```

## 👥 Utilisateurs de Test

| Email | Mot de passe | Profil | Statut |
|-------|--------------|--------|--------|
| admin@route.mg | admin123 | Admin | Actif |
| jean.dupont@gmail.com | admin123 | Utilisateur | Actif |
| sophie.laurent@gmail.com | admin123 | Utilisateur | Actif |
| marie.martin@gmail.com | admin123 | Utilisateur | Actif |
| pierre.bernard@gmail.com | admin123 | Utilisateur | Actif |
| user.bloque1@gmail.com | admin123 | Utilisateur | Bloqué |
| user.bloque2@gmail.com | admin123 | Utilisateur | Bloqué |
| spammer@test.com | admin123 | Utilisateur | Suspendu |

## 🎯 Fonctionnalités Principales

- ✅ Gestion des utilisateurs (CRUD)
- ✅ Signalement de problèmes de routes
- ✅ Suivi des problèmes et interventions
- ✅ Affectation d'entreprises aux travaux
- ✅ Visualisation cartographique (OSM)
- ✅ Synchronisation temps réel PostgreSQL ↔️ Firebase
- ✅ API REST complète avec Swagger
- ✅ Application mobile multi-plateformes
- ✅ Gestion des statuts et workflows

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs : `docker compose logs API`
2. Tester la connexion Firebase : `docker compose exec API node /app/scripts/firebase_test.js`
3. Vérifier le statut sync : `Invoke-RestMethod -Uri "http://localhost:3000/api/sync/status"`

---

**Version** : 1.0.0  
**Dernière mise à jour** : 26 janvier 2026

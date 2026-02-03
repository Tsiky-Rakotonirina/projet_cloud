# API REST Node.js - Express + PostgreSQL + Sequelize

Une API REST professionnelle construite avec Node.js, Express, PostgreSQL et Sequelize.

## 📋 Description

Cette API fournit une architecture de base pour un système d'authentification sécurisé avec JWT et bcrypt, incluant la gestion des utilisateurs. Elle est conçue pour être facilement extensible.

## ✨ Caractéristiques

- ✅ Authentification JWT sécurisée
- ✅ Hashage des mots de passe avec bcrypt
- ✅ Modèle User complet avec validation
- ✅ Middleware d'authentification réutilisable
- ✅ Gestion des erreurs centralisée
- ✅ Structure en couches (routes → controllers → services → models)
- ✅ Support des migrations et seeders Sequelize
- ✅ Variables d'environnement (.env)
- ✅ CORS activé
- ✅ Nodemon pour le développement

## 🔧 Prérequis

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** ≥ 12

## 📥 Installation

### 1. Cloner ou initialiser le projet
```bash
cd API
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=api_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### 4. Créer la base de données PostgreSQL
```bash
createdb api_db
```

## 🚀 Démarrage

### Mode développement (avec hot-reload)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## Base de données

### Synchroniser les migrations
```bash
npm run db:migrate
```

### Annuler les migrations
```bash
npm run db:migrate:undo
```

### Ajouter des données initiales
```bash
npm run db:seed:all
```

### Supprimer les seeders
```bash
npm run db:seed:undo
```

## 📡 Endpoints disponibles

### Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Enregistrement réussi",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Utilisateurs (Authentification requise)

#### Profil utilisateur
```http
GET /api/users/me
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Liste des utilisateurs
```http
GET /api/users?limit=10&offset=0
Authorization: Bearer <token>
```

#### Récupérer un utilisateur
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Mettre à jour un utilisateur
```http
PATCH /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Supprimer un utilisateur
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

## 🏗️ Structure du projet

```
API/
├── src/
│   ├── config/              # Configuration DB et Sequelize
│   │   ├── database.js      # Configuration par environnement
│   │   └── sequelize.js     # Instance Sequelize
│   ├── models/              # Modèles Sequelize
│   │   ├── index.js         # Agrégation des modèles
│   │   └── user.model.js    # Modèle User
│   ├── migrations/          # Migrations Sequelize
│   ├── seeders/             # Données initiales
│   ├── controllers/         # Contrôleurs (logique requête/réponse)
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── services/            # Services (logique métier)
│   │   ├── auth.service.js
│   │   └── user.service.js
│   ├── routes/              # Routes Express
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── index.js
│   ├── middlewares/         # Middlewares Express
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── utils/               # Utilitaires
│   │   └── jwt.js
│   ├── app.js               # Configuration Express
│   └── server.js            # Point d'entrée
├── .env.example             # Variables d'environnement exemple
├── .gitignore               # Fichiers ignorés Git
├── .sequelizerc             # Configuration Sequelize CLI
├── package.json             # Dépendances et scripts
└── README.md                # Documentation
```

## 🔐 Architecture d'authentification

### Flow de connexion
1. L'utilisateur envoie email + password à `/api/auth/login`
2. Le service vérifie les identifiants
3. Si valides, un JWT est généré avec `id` et `email`
4. Le token est retourné au client
5. Le client envoie le token dans le header: `Authorization: Bearer <token>`
6. Le middleware `authMiddleware` valide le token
7. L'utilisateur est identifié et a accès aux ressources protégées

### Sécurité des mots de passe
- Les mots de passe sont hashés avec bcrypt (salt rounds: 10)
- Les mots de passe ne sont jamais stockés en clair
- Les mots de passe ne sont jamais retournés dans les réponses

## 🛠️ Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port du serveur | `3000` |
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_NAME` | Nom de la BD | `api_db` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `postgres` |
| `JWT_SECRET` | Clé secrète JWT | `your_secret_key` |
| `JWT_EXPIRES_IN` | Durée du token | `24h` |
| `NODE_ENV` | Environnement | `development` |

## 📦 Dépendances principales

- **express** - Framework web
- **sequelize** - ORM pour PostgreSQL
- **pg** - Driver PostgreSQL
- **jsonwebtoken** - Gestion JWT
- **bcrypt** - Hashage sécurisé des mots de passe
- **cors** - Support CORS
- **dotenv** - Gestion des variables d'environnement

## 🧪 Tester l'API

### Avec cURL
```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Profil (remplacer TOKEN par le JWT reçu)
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

### Avec Postman
1. Importer une collection avec les endpoints
2. Utiliser les scripts pré-executé pour sauvegarder le token
3. Tester les endpoints protégés

## 🚦 Gestion des erreurs

Toutes les erreurs retournent un JSON standardisé:
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

Les codes HTTP respectent les standards REST:
- `200` - OK
- `201` - Créé
- `400` - Requête invalide
- `401` - Non authentifié
- `404` - Non trouvé
- `500` - Erreur serveur

## 📈 Extensibilité

### Ajouter un nouveau modèle
1. Créer `src/models/product.model.js`
2. Il sera automatiquement chargé par `src/models/index.js`

### Ajouter une nouvelle route
1. Créer le contrôleur: `src/controllers/product.controller.js`
2. Créer le service: `src/services/product.service.js`
3. Créer les routes: `src/routes/product.routes.js`
4. Importer dans `src/routes/index.js`

### Ajouter un middleware
1. Créer `src/middlewares/custom.middleware.js`
2. Importer dans `src/app.js` ou les routes appropriées

## 📝 Licence

MIT

## 👨‍💻 Support

Pour toute question ou problème, consultez la documentation du projet.

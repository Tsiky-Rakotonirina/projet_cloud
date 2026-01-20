# Seeding Firestore - Guide d'utilisation

Ce guide explique comment insérer des données de test dans votre base de données Firestore.

## 📋 Données incluses

Le script de seeding insère les données suivantes :

### 👤 **Profils**
- Admin : Administrateur système

### 🏙️ **Villes**
- Antananarivo avec ses rues (Indépendance)

### 🏢 **Entreprises**
- Entreprise "okok" à Antananarivo

### 📊 **Statuts**
- Statuts de signalement : "En cours"
- Statuts de problème : "Résolu" (100%)

### 👥 **Utilisateurs**
- Utilisateur test : user@mail.com (profil Admin)

### 🚨 **Signalements**
- Signalement de route endommagée à Antananarivo

### 🛠️ **Problèmes**
- Problème lié au signalement avec budget et surface

## 🚀 Méthodes d'utilisation

### Méthode 1: Via l'interface mobile (Recommandé)

1. **Démarrer l'app mobile** :
   ```bash
   cd mobile
   npm run dev
   ```

2. **Se connecter** avec un compte existant ou créer un compte

3. **Accéder à la page de seeding** :
   - Ajouter `/seed` à l'URL : `http://localhost:5173/seed`
   - Ou ajouter un bouton dans votre navigation

4. **Insérer les données** :
   - Cliquer sur "Insérer les données de seed"
   - Attendre la confirmation de succès

### Méthode 2: Via script Node.js (Version Simple)

Le script `seed-firestore-simple.cjs` est maintenant configuré avec vos variables Firebase !

**Exécuter le script de seeding** :
```bash
cd mobile
npm run seed
```

**Résultat attendu** :
```
🌱 Firestore Seeding Script (Simple)
====================================
⚠️  IMPORTANT: Modifiez la configuration Firebase dans ce fichier avant execution !

🚀 Début du seeding des données Firestore...
✅ Profil inséré: Admin
✅ Ville insérée: Antananarivo
✅ Entreprise insérée: okok
🎉 Données de base insérées avec succès !
🎉 Seeding terminé avec succès !
```

**Note** : Cette version simple insère seulement les données de base (profils, villes, entreprises). Pour des données plus complètes, utilisez la version TypeScript via l'interface mobile.

## 🔧 Structure des fichiers créés

```
mobile/
├── src/
│   ├── services/
│   │   └── firestore-seed.service.ts  # Fonctions de seeding
│   └── views/
│       └── SeedView.vue               # Interface de seeding
├── seed-firestore.js                  # Script CLI
└── src/router/index.ts               # Route ajoutée (/seed)
```

## ⚠️ Sécurité et précautions

- **Les données de seed sont pour le développement uniquement**
- Le script de clearing supprime TOUTES les données
- Utilisez un projet Firebase de développement séparé
- Les mots de passe des utilisateurs de test sont fictifs

## ✅ Vérification des données insérées

Après exécution du script, vérifiez dans **Firebase Console > Firestore Database** :

### Collections créées :
- **`profils`** : 1 document (Admin)
- **`villes`** : 1 document (Antananarivo)
- **`entreprises`** : 1 document (okok)

### Structure des documents :
```json
// profils/profil_1
{
  "libelle": "Admin",
  "descri": "Administrateur système"
}

// villes/ville_1
{
  "nom": "Antananarivo",
  "location": { "lat": -18.8792, "lng": 47.5079 }
}

// entreprises/entreprise_1
{
  "nom": "okok",
  "adresse": "Antananarivo",
  "telephone": "+261000000"
}
```
   - `signalement_statuts` : 1 document
   - `probleme_statuts` : 1 document
   - `utilisateurs` : 1 document
   - `signalements` : 1 document
   - `problemes` : 1 document

## 🛠️ Utilisation dans le code

Vous pouvez importer les fonctions dans vos services :

```typescript
import { seedFirestoreData, addUser, addSignalement } from '@/services/firestore-seed.service';

// Insérer toutes les données de seed
await seedFirestoreData();

// Ajouter un nouvel utilisateur
await addUser({
  email: 'newuser@example.com',
  nom: 'Dupont',
  prenom: 'Jean'
});
```

## 🐛 Dépannage

### Erreur "Missing or insufficient permissions"
- Vérifiez que les règles Firestore sont déployées
- Assurez-vous d'être connecté avec un utilisateur authentifié

### Erreur "Collection not found"
- Le seeding crée les collections automatiquement
- Vérifiez la configuration Firebase

### Script ne s'exécute pas
- Vérifiez que Node.js est installé
- Installez les dépendances : `npm install`

---

**Résultat** : Votre base Firestore est maintenant remplie avec des données de test réalistes ! 🎉
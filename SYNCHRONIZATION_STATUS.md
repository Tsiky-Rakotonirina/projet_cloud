# 📋 Synchronisation Complète PostgreSQL ↔️ Firebase

## ✅ État de la Synchronisation

La synchronisation bidirectionnelle est maintenant active pour **TOUTES** les tables :

### Tables Synchronisées

| Table PostgreSQL | Collection Firestore | PostgreSQL | Firebase | Statut |
|-----------------|---------------------|-----------|----------|--------|
| `villes` | `villes` | 6 | 6 | ✅ 100% |
| `profils` | `profils` | 4 | 4 | ✅ 100% |
| `statuts` | `statuts_utilisateur` | 4 | 4 | ✅ 100% |
| `utilisateurs` | `users` | 9 | 9 | ✅ 100% |
| `entreprises` | `entreprises` | 8 | 8 | ✅ 100% |
| `signalement_statuts` | `signalement_statuts` | 8 | 8 | ✅ 100% |
| `signalements` | `signalements` | 13 | 13 | ✅ 100% |
| `probleme_statuts` | `probleme_statuts` | 10 | 10 | ✅ 100% |
| `problemes` | `problemes` | 12 | 12 | ✅ 100% |

**Total : 74 enregistrements synchronisés**

---

## 🔄 Ordre de Synchronisation

L'ordre est important pour respecter les dépendances entre tables :

1. **Villes** (aucune dépendance)
2. **Profils** (aucune dépendance)
3. **Statuts utilisateur** (aucune dépendance)
4. **Utilisateurs** (→ profils, statuts)
5. **Entreprises** (aucune dépendance)
6. **Statuts signalement** (aucune dépendance)
7. **Signalements** (→ utilisateurs, statuts)
8. **Statuts problème** (aucune dépendance)
9. **Problèmes** (→ entreprises, signalements, statuts)

---

## 🚀 Utilisation

### 1. Synchronisation Complète

Synchronise toutes les tables dans les deux directions :

```bash
POST http://localhost:3000/api/sync/all
```

**PowerShell :**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/all" -Method POST
```

### 2. Vérifier le Statut

Obtenir l'état de synchronisation de toutes les tables :

```bash
GET http://localhost:3000/api/sync/status
```

**PowerShell :**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/status" -Method GET
```

---

## 📊 Exemples de Données Synchronisées

### Villes
\`\`\`json
{
  "nom": "Antananarivo",
  "synced_at": "2026-01-26T09:07:03.000Z"
}
\`\`\`

### Utilisateurs
\`\`\`json
{
  "email": "admin@route.mg",
  "password_hash": "$2b$10$...",
  "profil_id": 1,
  "profil_libelle": "admin",
  "statut": "actif",
  "synced_at": "2026-01-26T09:07:03.000Z"
}
\`\`\`

### Problèmes
\`\`\`json
{
  "surface": 60.0,
  "budget": 15000,
  "entreprise_firebase_id": "3akS9pIommbecvzzBCOg",
  "entreprise_nom": "BTP Madagascar",
  "signalement_firebase_id": "SWOD33ui5jj7QouX3Vfa",
  "statut_firebase_id": "744UPeG1umSFcZLID9r4",
  "statut_libelle": "non_commence",
  "synced_at": "2026-01-26T09:07:03.000Z"
}
\`\`\`

---

## 🔍 Vérification dans Firebase Console

1. Ouvrez [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez le projet **tp-firebase-b195d**
3. Menu **Firestore Database**
4. Vous verrez 9 collections :
   - `villes` (6 documents)
   - `profils` (4 documents)
   - `statuts_utilisateur` (4 documents)
   - `users` (9 documents)
   - `entreprises` (8 documents)
   - `signalement_statuts` (8 documents)
   - `signalements` (13 documents)
   - `probleme_statuts` (10 documents)
   - `problemes` (12 documents)

---

## 🛠️ Scripts de Diagnostic

### Compter tous les documents Firestore
```bash
docker compose exec API node /app/scripts/firebase_count_all.js
```

### Voir des échantillons de données
```bash
docker compose exec API node /app/scripts/firebase_show_samples.js
```

---

## 📝 Structure de Mapping

Toutes les synchronisations sont trackées dans la table `firebase_mapping` :

\`\`\`sql
SELECT 
  entity_type, 
  COUNT(*) as total 
FROM firebase_mapping 
GROUP BY entity_type 
ORDER BY entity_type;
\`\`\`

Résultat :
- `entreprise`: 8 mappings
- `probleme`: 12 mappings
- `probleme_statut`: 10 mappings
- `profil`: 4 mappings
- `signalement`: 13 mappings
- `signalement_statut`: 8 mappings
- `utilisateur`: 9 mappings
- `ville`: 6 mappings

**Total : 70 mappings**

---

## ⚠️ Notes Importantes

1. **Bidirectionnel** : Chaque table a 2 méthodes :
   - `push*ToPostgres()` : Firebase → PostgreSQL
   - `pull*ToFirebase()` : PostgreSQL → Firebase

2. **Relations** : Les clés étrangères sont converties en Firebase IDs
   - `entreprise_id` → `entreprise_firebase_id`
   - `signalement_id` → `signalement_firebase_id`
   - `utilisateur_id` → `utilisateur_firebase_id`

3. **Dates** : Toutes les dates invalides de Firebase sont normalisées en `null`

4. **Undefined** : Le mode `ignoreUndefinedProperties: true` évite les erreurs Firestore

---

## 🎯 Dernière Synchronisation

**Date** : 2026-01-26 à 09:07:03 UTC

**Résultat** : ✅ Succès total - 74 enregistrements synchronisés dans 9 tables

# Guide de Test : Synchronisation Incrémentale

Ce document explique comment tester la synchronisation bidirectionnelle en ajoutant de nouvelles données.

## Test 1 : Ajouter une ville dans PostgreSQL

### 1. Ajouter une nouvelle ville dans PostgreSQL
\`\`\`bash
docker exec -i bdd psql -U admin -d route -c "INSERT INTO villes (nom) VALUES ('Fianarantsoa') RETURNING *;"
\`\`\`

### 2. Synchroniser (PULL : PostgreSQL → Firebase)
\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/all" -Method POST
\`\`\`

### 3. Vérifier dans Firestore
\`\`\`bash
docker compose exec API node /app/scripts/firebase_count_all.js
\`\`\`

**Résultat attendu** : `villes: 7 documents` (était 6)

---

## Test 2 : Ajouter une entreprise dans Firebase

### 1. Créer un script pour ajouter dans Firebase
Créez `API/scripts/test_add_entreprise.js` :
\`\`\`javascript
const admin = require('firebase-admin');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addEntreprise() {
  const docRef = await db.collection('entreprises').add({
    nom: 'Routes & Travaux SA',
    adresse: '789 Avenue de l\'Indépendance, Mahajanga',
    telephone: '+261 20 26 789 01',
    synced_at: new Date().toISOString()
  });
  
  console.log('✅ Entreprise créée dans Firebase:', docRef.id);
  process.exit(0);
}

addEntreprise().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
\`\`\`

### 2. Exécuter le script
\`\`\`bash
docker compose exec API node /app/scripts/test_add_entreprise.js
\`\`\`

### 3. Synchroniser (PUSH : Firebase → PostgreSQL)
\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/all" -Method POST
\`\`\`

### 4. Vérifier dans PostgreSQL
\`\`\`bash
docker exec -i bdd psql -U admin -d route -c "SELECT COUNT(*) FROM entreprises;"
\`\`\`

**Résultat attendu** : `9` (était 8)

---

## Test 3 : Modifier un utilisateur dans PostgreSQL

### 1. Modifier un utilisateur
\`\`\`bash
docker exec -i bdd psql -U admin -d route -c "UPDATE utilisateurs SET email = 'admin.updated@route.mg' WHERE id_utilisateurs = 1 RETURNING *;"
\`\`\`

### 2. Synchroniser
\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/all" -Method POST
\`\`\`

### 3. Vérifier dans Firebase Console
- Ouvrir Firebase Console → Firestore → collection `users`
- Chercher l'utilisateur avec `email: "admin.updated@route.mg"`

---

## Test 4 : Supprimer et re-synchroniser

### 1. Supprimer un mapping (simuler désynchronisation)
\`\`\`bash
docker exec -i bdd psql -U admin -d route -c "DELETE FROM firebase_mapping WHERE entity_type = 'ville' AND postgres_id = 1;"
\`\`\`

### 2. Vérifier le statut
\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/status" -Method GET
\`\`\`

**Résultat attendu** : `villes.non_synchronises: 1`

### 3. Re-synchroniser
\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/all" -Method POST
\`\`\`

### 4. Vérifier à nouveau
\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/status" -Method GET
\`\`\`

**Résultat attendu** : `villes.non_synchronises: 0`

---

## Scénarios Avancés

### Sync Cascade : Problème → Signalement → Utilisateur

1. **Ajouter un utilisateur** dans Firebase
2. **Synchroniser** (créé dans PostgreSQL)
3. **Ajouter un signalement** avec `utilisateur_firebase_id`
4. **Synchroniser** (créé dans PostgreSQL avec `utilisateur_id` correct)
5. **Ajouter un problème** avec `signalement_firebase_id`
6. **Synchroniser** (créé dans PostgreSQL avec `signalement_id` correct)

**Vérification** : Les relations entre tables sont préservées via les mappings.

---

## Vérifications Globales

### Comptage total
\`\`\`bash
# PostgreSQL
docker exec -i bdd psql -U admin -d route -c "
SELECT 
  'villes' as table, COUNT(*) FROM villes UNION ALL
  SELECT 'profils', COUNT(*) FROM profils UNION ALL
  SELECT 'statuts', COUNT(*) FROM statuts UNION ALL
  SELECT 'utilisateurs', COUNT(*) FROM utilisateurs UNION ALL
  SELECT 'entreprises', COUNT(*) FROM entreprises UNION ALL
  SELECT 'signalement_statuts', COUNT(*) FROM signalement_statuts UNION ALL
  SELECT 'signalements', COUNT(*) FROM signalements UNION ALL
  SELECT 'probleme_statuts', COUNT(*) FROM probleme_statuts UNION ALL
  SELECT 'problemes', COUNT(*) FROM problemes;
"

# Firestore
docker compose exec API node /app/scripts/firebase_count_all.js
\`\`\`

### Dernière sync
\`\`\`bash
docker exec -i bdd psql -U admin -d route -c "SELECT MAX(updated_at) as derniere_sync FROM firebase_mapping;"
\`\`\`

---

## Dépannage

### Logs de synchronisation
\`\`\`bash
docker compose logs API --tail=100 | Select-String -Pattern "PUSH|PULL|sync"
\`\`\`

### Erreurs de sync
\`\`\`bash
docker compose logs API --tail=50 | Select-String -Pattern "❌|ERROR"
\`\`\`

### Reset complet (⚠️ ATTENTION)
\`\`\`bash
# Supprimer tous les mappings
docker exec -i bdd psql -U admin -d route -c "TRUNCATE firebase_mapping;"

# Re-synchroniser tout
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/all" -Method POST
\`\`\`

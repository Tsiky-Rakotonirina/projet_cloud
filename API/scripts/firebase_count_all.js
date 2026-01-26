const admin = require('firebase-admin');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const collections = [
  'villes',
  'profils',
  'statuts_utilisateur',
  'users',
  'entreprises',
  'signalement_statuts',
  'signalements',
  'probleme_statuts',
  'problemes'
];

async function countAll() {
  console.log('\n=== COMPTAGE FIRESTORE ===\n');
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      console.log(`${collectionName.padEnd(25)}: ${snapshot.docs.length} documents`);
    } catch (error) {
      console.log(`${collectionName.padEnd(25)}: ERREUR - ${error.message}`);
    }
  }
  
  console.log('\n=== FIN ===\n');
  process.exit(0);
}

countAll().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});

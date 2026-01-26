const admin = require('firebase-admin');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const collections = [
  { name: 'villes', limit: 2 },
  { name: 'profils', limit: 2 },
  { name: 'statuts_utilisateur', limit: 2 },
  { name: 'users', limit: 2 },
  { name: 'entreprises', limit: 2 },
  { name: 'signalement_statuts', limit: 2 },
  { name: 'signalements', limit: 2 },
  { name: 'probleme_statuts', limit: 2 },
  { name: 'problemes', limit: 2 }
];

async function showSamples() {
  console.log('\n=== ÉCHANTILLONS FIRESTORE ===\n');
  
  for (const coll of collections) {
    try {
      const snapshot = await db.collection(coll.name).limit(coll.limit).get();
      console.log(`\n📦 ${coll.name.toUpperCase()} (${snapshot.docs.length} échantillon(s)):`);
      console.log('─'.repeat(60));
      
      snapshot.docs.forEach((doc, idx) => {
        const data = doc.data();
        console.log(`\n  [${idx + 1}] ID: ${doc.id}`);
        
        // Afficher les champs principaux
        const keys = Object.keys(data).filter(k => k !== 'synced_at');
        keys.slice(0, 5).forEach(key => {
          const value = data[key];
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
          const truncated = displayValue && displayValue.length > 50 
            ? displayValue.substring(0, 47) + '...' 
            : displayValue;
          console.log(`      ${key}: ${truncated}`);
        });
      });
      
    } catch (error) {
      console.log(`\n❌ ${coll.name}: ${error.message}`);
    }
  }
  
  console.log('\n\n=== FIN ===\n');
  process.exit(0);
}

showSamples().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});

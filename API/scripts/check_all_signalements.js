const admin = require('firebase-admin');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

(async () => {
  try {
    const snapshot = await db.collection('signalements').get();
    console.log('Total signalements:', snapshot.size);
    console.log('\n=== TOUS LES SIGNALEMENTS ===\n');
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log('--- ID:', doc.id, '---');
      console.log('  Description:', data.description?.substring(0, 50) || 'N/A');
      console.log('  utilisateurId:', data.utilisateurId || data.utilisateur_firebase_id || 'N/A');
      console.log('  statutId:', data.statutId || data.statut_id || 'N/A');
      console.log('  images:', data.images ? JSON.stringify(data.images) : 'AUCUNE');
      console.log('  point:', data.point || 'N/A');
      console.log('  createdAt:', data.createdAt || data.date_creation || 'N/A');
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();

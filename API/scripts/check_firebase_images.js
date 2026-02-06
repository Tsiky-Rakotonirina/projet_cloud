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
    const snap = await db.collection('signalements').get();
    console.log('Total Firebase:', snap.size);
    
    const withImage = snap.docs.filter(d => d.data().images && d.data().images.length > 0);
    console.log('Avec images:', withImage.length);
    
    console.log('\n=== SIGNALEMENTS AVEC IMAGES ===\n');
    for (const doc of withImage) {
      const data = doc.data();
      console.log('ID:', doc.id);
      console.log('  Image:', data.images[0]?.name);
      console.log('  Description:', data.description?.substring(0, 50));
      console.log('  createdAt:', data.createdAt);
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();

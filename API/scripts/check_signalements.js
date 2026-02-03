const admin = require('firebase-admin');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

(async () => {
  try {
    console.log('=== NETTOYAGE FIREBASE ===');
    const signalements = await db.collection('signalements').get();
    
    let deleted = 0;
    for (const doc of signalements.docs) {
      const data = doc.data();
      // Supprimer les signalements de test ou sans utilisateur
      if (['Hhhh', 'Bbbbbb', 'probleme de jsp'].includes(data.description) || 
          (!data.utilisateur_firebase_id && !data.utilisateurId)) {
        await db.collection('signalements').doc(doc.id).delete();
        deleted++;
        console.log(`Supprimé: ${data.description?.substring(0, 30)}...`);
      }
    }
    
    console.log(`\n✅ ${deleted} signalements supprimés dans Firebase`);
    
    // Compter les signalements restants
    const remaining = await db.collection('signalements').get();
    console.log(`Signalements restants: ${remaining.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();

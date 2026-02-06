const admin = require('firebase-admin');
const serviceAccount = require('./src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkData() {
  try {
    // Vérifier les signalements
    const signalements = await db.collection('signalements').get();
    console.log('\n=== SIGNALEMENTS FIREBASE ===');
    console.log('Total:', signalements.size);
    
    signalements.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: statut=${data.statut_id || data.statut || 'N/A'}, description=${(data.description || '').substring(0, 50)}`);
    });

    // Vérifier les utilisateurs
    const users = await db.collection('utilisateurs').get();
    console.log('\n=== UTILISATEURS FIREBASE ===');
    console.log('Total:', users.size);

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

checkData();
